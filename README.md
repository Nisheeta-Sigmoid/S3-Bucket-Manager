# 🌐 S3 File Manager

A comprehensive file management system for AWS S3 with a modern **React frontend** and robust **FastAPI backend**. Effortlessly manage your S3 buckets and objects with an intuitive user interface.

---

## 🚀 Frontend (React + Vite + Tailwind)

### ✨ Key Features
- 📂 Browse and explore all S3 buckets and their contents  
- ⬆️ Seamless file uploads to any bucket  
- ❌ Delete files and buckets with confirmation dialogs  
- 🔄 Move and copy files between different buckets  
- 🎨 Modern, responsive UI built with Tailwind CSS

### 🛠️ Quick Start

#### 1️⃣ Get the Code
```bash
git clone https://github.com/Nisheeta-Sigmoid/S3-Bucket-Manager.git
cd S3-Bucket-Manager/s3-file-manager
```

#### 2️⃣ Install Dependencies
```bash
npm install
```

#### 3️⃣ Launch Development Server
```bash
npm run dev
```

---

## ⚙️ Backend (FastAPI)

### ✨ Core Features
- 📂 Complete bucket and object listing capabilities  
- ⬆️ Multi-file upload support  
- ❌ Safe deletion of files and buckets  
- 🔄 Efficient copy and move operations between buckets  
- 🔌 RESTful API design for easy integration

### 🛠️ Setup Instructions

#### 1️⃣ Environment Setup
```bash
source venv/bin/activate
```

#### 2️⃣ Configure AWS Credentials
Create a `.env` file with your AWS credentials:
```ini
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=your_preferred_region
```

#### 3️⃣ Start the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 4444
```

### 🔧 Technology Stack
- ⚡ **FastAPI** → High-performance web framework for building APIs
- 🚀 **Uvicorn** → Lightning-fast ASGI server
- ☁️ **Boto3** → Official AWS SDK for seamless S3 integration
- 📄 **python-multipart** → Enhanced file upload handling
- 🔐 **python-dotenv** → Secure environment variable management

### 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/buckets` | Retrieve all available buckets |
| `POST` | `/bucket/{bucket_name}` | Create a new bucket |
| `DELETE` | `/bucket/{bucket_name}` | Remove an existing bucket |
| `GET` | `/bucket/{bucket_name}` | List all objects within a bucket |
| `POST` | `/upload` | Upload files to specified bucket |
| `DELETE` | `/object` | Delete specific files |
| `POST` | `/copy` | Copy files between buckets |
| `POST` | `/move` | Move files to different locations |

---

## 🌟 Getting Started

1. **Clone the repository** and navigate to your preferred component (frontend/backend)
2. **Set up your environment** following the respective setup instructions
3. **Configure AWS credentials** for backend functionality
4. **Launch both services** and start managing your S3 resources!

---

