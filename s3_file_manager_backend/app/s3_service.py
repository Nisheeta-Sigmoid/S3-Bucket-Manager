import boto3
from botocore.exceptions import ClientError
from . import config
from typing import List

s3_client = boto3.client(
    "s3",
    aws_access_key_id=config.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
    region_name=config.AWS_REGION
)

# ---------- Bucket Operations ----------
def list_buckets():
    response = s3_client.list_buckets()
    return [bucket["Name"] for bucket in response.get("Buckets", [])]

def create_bucket(bucket_name: str):
    s3_client.create_bucket(
        Bucket=bucket_name,
        CreateBucketConfiguration={"LocationConstraint": config.AWS_REGION}
    )
    return {"message": f"Bucket '{bucket_name}' created successfully."}

def delete_bucket(bucket_name: str):
    s3_client.delete_bucket(Bucket=bucket_name)
    return {"message": f"Bucket '{bucket_name}' deleted successfully."}

# ---------- Object / Folder Operations ----------
def list_all_objects_recursive(bucket_name: str, prefix: str = ""):
    """
    Alternative implementation with more explicit folder detection
    """
    try:
        paginator = s3_client.get_paginator('list_objects_v2')
        
        all_items = []
        files = []
        explicit_folders = []
        
        # Get all objects and separate files from folder markers
        for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
            for obj in page.get('Contents', []):
                key = obj['Key']
                
                if key.endswith('/'):
                    # This is a folder marker
                    explicit_folders.append({
                        "key": key,
                        "last_modified": obj['LastModified'].isoformat()
                    })
                else:
                    # This is a regular file
                    files.append({
                        "key": key,
                        "size": obj['Size'],
                        "last_modified": obj['LastModified'].isoformat()
                    })
        
        # Process explicit folders (folder markers)
        folders_from_markers = set()
        for folder in explicit_folders:
            key = folder['key']
            parts = key.rstrip('/').split('/')
            
            # Add this folder and all parent folders
            for i in range(1, len(parts) + 1):
                folder_path = '/'.join(parts[:i]) + '/'
                folders_from_markers.add(folder_path)
        
        # Process files and extract folder structure
        folders_from_files = set()
        for file in files:
            key = file['key']
            parts = key.split('/')
            
            # Add all parent folders
            for i in range(len(parts) - 1):
                folder_path = '/'.join(parts[:i+1]) + '/'
                folders_from_files.add(folder_path)
            
            # Add the file to items
            file_name = parts[-1]
            if file_name:
                all_items.append({
                    "name": file_name,
                    "type": "file",
                    "key": key,
                    "path": key,
                    "parent_folder": '/'.join(parts[:-1]) + '/' if len(parts) > 1 else "",
                    "size": file['size'],
                    "last_modified": file['last_modified'],
                    "is_folder": False,
                    "depth": len(parts) - 1
                })
        
        # Combine all folders (from both markers and file paths)
        all_folders = folders_from_markers.union(folders_from_files)
        
        # Add folder items
        for folder_path in all_folders:
            parts = folder_path.rstrip('/').split('/')
            folder_name = parts[-1]
            
            if folder_name:
                all_items.append({
                    "name": folder_name,
                    "type": "folder",
                    "key": folder_path,
                    "path": folder_path,
                    "parent_folder": '/'.join(parts[:-1]) + '/' if len(parts) > 1 else "",
                    "size": None,
                    "last_modified": None,
                    "is_folder": True,
                    "depth": len(parts) - 1
                })
        
        # Sort by depth first, then by type (folders first), then alphabetically
        all_items.sort(key=lambda x: (x['depth'], not x['is_folder'], x['name'].lower()))
        
        return {
            "success": True,
            "items": all_items,
            "total_count": len(all_items),
            "debug": {
                "explicit_folders": len(explicit_folders),
                "files": len(files),
                "folders_from_markers": len(folders_from_markers),
                "folders_from_files": len(folders_from_files)
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "items": []
        }

def create_folder(bucket_name: str, folder_name: str):
    """
    Simple folder creation - just creates empty object with trailing slash
    Note: May not be visible in all S3 browser UIs
    """
    try:
        if not folder_name.endswith("/"):
            folder_name += "/"
        
        s3_client.put_object(Bucket=bucket_name, Key=folder_name, Body=b'')
        
        return {
            "message": f"Folder '{folder_name}' created successfully in '{bucket_name}'.",
            "folder_key": folder_name
        }
    except ClientError as e:
        return {
            "error": f"Failed to create folder: {str(e)}",
            "folder_name": folder_name
        }

def delete_object(bucket_name: str, key: str):
    """
    Enhanced delete function that handles both files and folders.
    For folders, it recursively deletes all contents first.
    """
    try:
        # Check if this is a folder (ends with /) or contains files
        if key.endswith('/') or _is_folder_with_contents(bucket_name, key):
            return _delete_folder_recursive(bucket_name, key)
        else:
            # Single file deletion
            s3_client.delete_object(Bucket=bucket_name, Key=key)
            return {
                "success": True,
                "message": f"File '{key}' deleted from '{bucket_name}'.",
                "deleted_objects": [key]
            }
    except ClientError as e:
        return {
            "success": False,
            "error": f"Failed to delete '{key}': {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error deleting '{key}': {str(e)}"
        }

def _is_folder_with_contents(bucket_name: str, key: str):
    """
    Check if the key represents a folder by looking for objects with this prefix
    """
    if not key.endswith('/'):
        key += '/'
    
    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=key,
            MaxKeys=1
        )
        return 'Contents' in response and len(response['Contents']) > 0
    except:
        return False

def _delete_folder_recursive(bucket_name: str, folder_key: str):
    """
    Recursively delete all objects in a folder and the folder itself
    """
    if not folder_key.endswith('/'):
        folder_key += '/'
    
    deleted_objects = []
    
    try:
        # Get all objects in the folder
        paginator = s3_client.get_paginator('list_objects_v2')
        
        objects_to_delete = []
        
        # Collect all objects that start with the folder prefix
        for page in paginator.paginate(Bucket=bucket_name, Prefix=folder_key):
            for obj in page.get('Contents', []):
                objects_to_delete.append({'Key': obj['Key']})
        
        # Also include the folder marker itself if it exists
        try:
            s3_client.head_object(Bucket=bucket_name, Key=folder_key)
            objects_to_delete.append({'Key': folder_key})
        except ClientError as e:
            if e.response['Error']['Code'] != '404':
                raise
        
        if not objects_to_delete:
            return {
                "success": True,
                "message": f"Folder '{folder_key}' is already empty or doesn't exist.",
                "deleted_objects": []
            }
        
        # Delete objects in batches (S3 allows up to 1000 objects per batch)
        batch_size = 1000
        for i in range(0, len(objects_to_delete), batch_size):
            batch = objects_to_delete[i:i + batch_size]
            
            response = s3_client.delete_objects(
                Bucket=bucket_name,
                Delete={
                    'Objects': batch,
                    'Quiet': False
                }
            )
            
            # Track successfully deleted objects
            for deleted in response.get('Deleted', []):
                deleted_objects.append(deleted['Key'])
            
            # Handle any errors
            if 'Errors' in response and response['Errors']:
                error_messages = [f"{err['Key']}: {err['Message']}" for err in response['Errors']]
                return {
                    "success": False,
                    "error": f"Some objects couldn't be deleted: {'; '.join(error_messages)}",
                    "deleted_objects": deleted_objects,
                    "failed_objects": [err['Key'] for err in response['Errors']]
                }
        
        return {
            "success": True,
            "message": f"Folder '{folder_key}' and all its contents ({len(deleted_objects)} objects) deleted successfully.",
            "deleted_objects": deleted_objects
        }
        
    except ClientError as e:
        return {
            "success": False,
            "error": f"Failed to delete folder '{folder_key}': {str(e)}",
            "deleted_objects": deleted_objects
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error deleting folder '{folder_key}': {str(e)}",
            "deleted_objects": deleted_objects
        }

def upload_file(bucket_name: str, file_obj, key: str):
    s3_client.upload_fileobj(file_obj, bucket_name, key)
    return {"message": f"File '{key}' uploaded to '{bucket_name}'."}

# ---------- Copy / Move ----------
def copy_object(bucket_name: str, source_key: str, dest_key: str):
    copy_source = {"Bucket": bucket_name, "Key": source_key}
    s3_client.copy_object(Bucket=bucket_name, CopySource=copy_source, Key=dest_key)
    return {"message": f"Copied '{source_key}' to '{dest_key}' in bucket '{bucket_name}'."}

def move_object(bucket_name: str, source_key: str, dest_key: str):
    copy_object(bucket_name, source_key, dest_key)
    delete_object(bucket_name, source_key)
    return {"message": f"Moved '{source_key}' to '{dest_key}' in bucket '{bucket_name}'."}
