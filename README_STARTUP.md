# 🚀 How to Start the Handwriting Dyslexia Analyzer Project

## Quick Start (Windows)

### Option 1: Use the Batch Script (Easiest)
Double-click `START_SERVERS.bat` - it will open 3 separate windows for each server.

### Option 2: Use PowerShell Script
Right-click `START_SERVERS.ps1` → "Run with PowerShell"

### Option 3: Manual Start (3 Separate Terminals)

---

## 📋 Step-by-Step Manual Instructions

### Prerequisites Check
- ✅ Python installed (check with `py --version`)
- ✅ Node.js installed (check with `node --version`)
- ✅ All dependencies installed (see Setup below)

---

## 🔧 One-Time Setup (If Not Done Already)

### 1. Install Python Dependencies
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend"
py -m pip install -r requirements.txt
```

### 2. Install Node.js Backend Dependencies
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend"
npm install
```

### 3. Install Frontend Dependencies
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\frontend\vite-project"
npm install
```

---

## ▶️ Starting the Servers (Every Time)

You need **3 separate terminal windows**. Open them in this order:

### Terminal 1: Python Flask API (Port 6000)
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend"
py predict_api.py
```

**Expected Output:**
```
 * Running on http://127.0.0.1:6000
```

**Keep this window open!**

---

### Terminal 2: Node.js Backend (Port 5000)
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\backend"
npm start
```

**Expected Output:**
```
✅ Node server running on http://localhost:5000
```

**Keep this window open!**

---

### Terminal 3: Frontend React App
```powershell
cd "C:\Users\D V Reddy\major_project (3)\major_project\handwriting-sld-app\frontend\vite-project"
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open the URL shown (usually http://localhost:5173/) in your browser!**

---

## ✅ Verification Checklist

Before uploading an image, make sure:

- [ ] Terminal 1 shows Flask running on port 6000
- [ ] Terminal 2 shows Node server running on port 5000  
- [ ] Terminal 3 shows Vite dev server with a localhost URL
- [ ] You've opened the frontend URL in your browser

---

## 🐛 Troubleshooting

### "Server not reachable" Error
1. Check that **both** Terminal 1 (Flask) and Terminal 2 (Node) are running
2. Check for error messages in those terminals
3. Make sure no firewall is blocking ports 5000 and 6000

### Flask Server Won't Start
- Check if port 6000 is already in use: `netstat -ano | findstr :6000`
- Make sure `dyslexia_pipeline.pkl` exists in the `backend` folder
- Check Python dependencies: `py -m pip list | findstr flask`

### Node Server Won't Start
- Check if port 5000 is already in use: `netstat -ano | findstr :5000`
- Make sure `node_modules` folder exists: `npm install`
- Check Google Cloud credentials file exists: `sld-dys-9d1abe88a4a5.json`

### Frontend Won't Start
- Check if port 5173 is already in use
- Make sure `node_modules` folder exists: `npm install`

---

## 📁 Project Structure

```
handwriting-sld-app/
├── backend/
│   ├── server.js          ← Node.js server (port 5000)
│   ├── predict_api.py     ← Flask API (port 6000)
│   ├── dyslexia_pipeline.pkl  ← ML model
│   └── requirements.txt   ← Python dependencies
├── frontend/
│   └── vite-project/
│       └── src/
│           └── components/
│               ├── UploadAndFeatures.jsx
│               └── ShapBarChart.jsx
└── START_SERVERS.bat      ← Quick start script
```

---

## 🎯 How It Works

1. **Frontend** (React/Vite) → User uploads image
2. **Node Backend** (Express) → Receives image, uses Google Vision API to extract text/features
3. **Flask API** (Python) → Receives features, runs ML model, calculates SHAP values
4. **Node Backend** → Returns results to frontend
5. **Frontend** → Displays prediction, features, and SHAP chart

---

## 🛑 Stopping the Servers

Press `Ctrl+C` in each terminal window, or simply close the terminal windows.

---

## 📝 Notes

- The servers must run in this order: Flask → Node → Frontend
- All three servers must be running simultaneously for the app to work
- The Flask server must start before the Node server (Node calls Flask)
- Google Cloud Vision API credentials are required for text extraction




