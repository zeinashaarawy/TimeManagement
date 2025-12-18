# Commands to Run Backend and Frontend

## Quick Start (Both Servers)

### Option 1: Run in Separate Terminal Windows (Recommended)

**Terminal 1 - Backend:**
```bash
cd /Users/janasaeed/Desktop/softwareproject1/TimeManagement/backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd /Users/janasaeed/Desktop/softwareproject1/TimeManagement/frontend
npm run dev
```

---

## Step-by-Step Commands

### Step 1: Check if Ports are Free (Optional)
```bash
# Check port 5001 (backend)
lsof -ti:5001 && echo "Port 5001 is in use" || echo "Port 5001 is free"

# Check port 3000 (frontend)
lsof -ti:3000 && echo "Port 3000 is in use" || echo "Port 3000 is free"
```

### Step 2: Kill Existing Processes (If Ports are in Use)
```bash
# Kill backend process on port 5001
kill $(lsof -ti:5001) 2>/dev/null || echo "No process on port 5001"

# Kill frontend process on port 3000
kill $(lsof -ti:3000) 2>/dev/null || echo "No process on port 3000"
```

### Step 3: Start Backend Server
```bash
cd /Users/janasaeed/Desktop/softwareproject1/TimeManagement/backend
npm run start:dev
```

**Expected output:**
- `[Nest] Starting Nest application...`
- `✅ MongoDB connected successfully!`
- `Nest application successfully started`
- Server running on `http://localhost:5001`

### Step 4: Start Frontend Server (In a NEW Terminal)
```bash
cd /Users/janasaeed/Desktop/softwareproject1/TimeManagement/frontend
npm run dev
```

**Expected output:**
- `ready - started server on 0.0.0.0:3000`
- `Local: http://localhost:3000`

---

## Verify Servers are Running

### Check Backend:
```bash
curl http://localhost:5001/time-management/shifts -H "x-user-id: 646576757365723132330000" -H "x-user-role: SYSTEM_ADMIN"
```

### Check Frontend:
```bash
curl http://localhost:3000
```

---

## Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Time Management:** http://localhost:3000/subsystems/time-management

---

## Stop Servers

Press `Ctrl + C` in each terminal window to stop the servers.

Or kill by port:
```bash
kill $(lsof -ti:5001)  # Stop backend
kill $(lsof -ti:3000)  # Stop frontend
```

---

## Troubleshooting

### Port Already in Use Error
If you see `EADDRINUSE: address already in use :::5001`:
- The server is already running (this is good!)
- Or kill the existing process: `kill $(lsof -ti:5001)`

### MongoDB Connection Error
- Check your `.env` file in `backend/` directory
- Ensure MongoDB connection string is correct

### Frontend Build Errors
- Run: `cd frontend && npm install`
- Then: `npm run dev`

