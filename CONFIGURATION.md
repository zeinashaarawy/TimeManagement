# Frontend-Backend Configuration Guide

## ✅ Connection Status

**Backend Port:** `5001` (default, can be changed via `PORT` env variable)  
**Frontend Ports:** `3000`, `3001`, `3002` (Next.js default ports)

## 📋 Required Environment Variables

### Backend (.env file in `TimeManagement/backend/`)

Create a `.env` file in the `TimeManagement/backend/` directory with:

```env
# MongoDB Connection
# For local MongoDB:
MONGO_URI=mongodb://127.0.0.1:27017/hr_system

# For MongoDB Atlas (cloud):
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hr_system

# Backend Server Port (default: 5001)
PORT=5001

# Swagger Documentation (optional)
ENABLE_SWAGGER=true
```

### Frontend (.env.local file in `TimeManagement/frontend/`)

Create a `.env.local` file in the `TimeManagement/frontend/` directory with:

```env
# Backend API URL (optional - auto-detected if not set)
# If you want to override the auto-detection, uncomment and set:
# NEXT_PUBLIC_API_URL=http://localhost:5001

# Backend Port (optional - defaults to 5001)
# Only used if NEXT_PUBLIC_API_URL is not set
NEXT_PUBLIC_BACKEND_PORT=5001
```

## 🔧 How It Works

1. **Backend** (`TimeManagement/backend/src/main.ts`):
   - Runs on port `5001` by default (or from `PORT` env variable)
   - CORS is configured to allow requests from frontend ports `3000`, `3001`, `3002`
   - Connects to MongoDB using `MONGO_URI`

2. **Frontend** (all API files):
   - Auto-detects backend URL based on current hostname
   - Uses port `5001` by default (or from `NEXT_PUBLIC_BACKEND_PORT`)
   - Works with both `localhost` and network IPs (e.g., `172.20.10.3`)
   - Can be overridden with `NEXT_PUBLIC_API_URL` environment variable

## ✅ Fixed Issues

All frontend API files now correctly point to backend port `5001`:
- ✅ `frontend/services/timeManagementApi.ts` → port 5001
- ✅ `frontend/services/authApi.ts` → port 5001
- ✅ `frontend/lib/api.ts` → port 5001
- ✅ `frontend/api/axios.ts` → port 5001

## 🚀 Quick Start

1. **Backend:**
   ```bash
   cd TimeManagement/backend
   # Create .env file with MONGO_URI and PORT
   npm install
   npm run start:dev
   ```

2. **Frontend:**
   ```bash
   cd TimeManagement/frontend
   # Create .env.local file (optional - will auto-detect)
   npm install
   npm run dev
   ```

3. **Verify Connection:**
   - Backend should start on `http://localhost:5001`
   - Frontend should start on `http://localhost:3000` (or 3001, 3002)
   - Check browser console for API connection logs

## 🔍 Troubleshooting

### Frontend can't connect to backend:
1. Check that backend is running on port 5001
2. Check browser console for API URL logs
3. Verify CORS settings in `backend/src/main.ts` include your frontend port
4. Check `.env.local` file if you're overriding API URL

### MongoDB connection issues:
1. Verify `MONGO_URI` in backend `.env` file
2. Check MongoDB is running (if local)
3. Verify network access (if MongoDB Atlas)

