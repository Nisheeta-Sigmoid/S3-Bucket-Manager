from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from . import s3_service

router = APIRouter()

# ---------- Buckets ----------
@router.get("/buckets")
def get_buckets():
    return {"buckets": s3_service.list_buckets()}

@router.post("/bucket/{bucket_name}")
def create_bucket(bucket_name: str):
    try:
        return s3_service.create_bucket(bucket_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/bucket/{bucket_name}")
def delete_bucket(bucket_name: str):
    try:
        return s3_service.delete_bucket(bucket_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- Objects / Folders ----------
# @router.get("/objects/{bucket_name}")
# def list_objects(bucket_name: str, prefix: str = Query("", description="Folder path prefix")):
#     return s3_service.list_all_objects_recursive(bucket_name, prefix)

@router.get("/objects/{bucket_name}")
def list_objects(bucket_name: str, prefix: str = Query("", description="Folder path prefix")):
    print(f"DEBUG: Route called with bucket_name: {bucket_name}, prefix: '{prefix}'")
    try:
        result = s3_service.list_all_objects_recursive(bucket_name, prefix)
        print(f"DEBUG: Service returned: {result}")
        return result
    except Exception as e:
        print(f"DEBUG: Exception occurred: {str(e)}")
        return {"error": str(e)}
        

@router.get("/debug/{bucket_name}")
def debug_bucket(bucket_name: str):
    try:
        # Test basic connectivity
        response = s3_service.s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=5)
        return {
            "success": True,
            "raw_response": response,
            "has_contents": "Contents" in response,
            "contents_count": len(response.get("Contents", [])),
            "has_common_prefixes": "CommonPrefixes" in response,
            "prefixes": response.get("CommonPrefixes", [])
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


@router.post("/folder")
def create_folder(bucket_name: str, folder_name: str):
    return s3_service.create_folder(bucket_name, folder_name)

@router.delete("/object")
def delete_object(bucket_name: str, key: str):
    try:
        result = s3_service.delete_object(bucket_name, key)
        if not result.get("success", True):  # Handle both old and new response format
            raise HTTPException(status_code=400, detail=result.get("error", "Delete failed"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
def upload_file(bucket_name: str, key: str, file: UploadFile = File(...)):
    try:
        return s3_service.upload_file(bucket_name, file.file, key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------- Copy / Move ----------
@router.post("/copy")
def copy_object(bucket_name: str, source_key: str, dest_key: str):
    return s3_service.copy_object(bucket_name, source_key, dest_key)

@router.post("/move")
def move_object(bucket_name: str, source_key: str, dest_key: str):
    return s3_service.move_object(bucket_name, source_key, dest_key)
