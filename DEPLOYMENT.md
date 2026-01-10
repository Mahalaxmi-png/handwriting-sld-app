# Deployment Guide for Handwriting SLD App

## Overview
This is a full-stack application for dyslexia screening and learning disabilities detection with:
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Node.js/Express (Port 5000)
- **Features**: Speech recognition, text-to-speech, ML models, Google Cloud Vision API

## Deployment Options

### Option 1: Local/Server Deployment (Recommended)
**Requirements:**
- Node.js 18+ 
- npm/yarn
- Google Cloud Vision API credentials
- Microphone access for browser

**Steps:**
1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend/vite-project
   npm install
   ```

2. **Build Frontend**
   ```bash
   cd frontend/vite-project
   npm run build
   ```

3. **Setup Google Cloud Credentials**
   - Place your JSON credentials file in `backend/`
   - Update the credentials filename in `server.js`

4. **Start Services**
   ```bash
   # Backend (Terminal 1)
   cd backend
   node server.js
   
   # Frontend (Terminal 2) - Use built files
   cd frontend/vite-project
   npm run preview
   ```

5. **Access Application**
   - Frontend: http://localhost:4173
   - Backend: http://localhost:5000

### Option 2: Docker Deployment
Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend:/app
      - ./backend/credentials.json:/app/credentials.json

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Option 3: Cloud Deployment

#### Vercel (Frontend) + Railway/Render (Backend)
1. **Frontend on Vercel**
   ```bash
   cd frontend/vite-project
   npm install -g vercel
   vercel --prod
   ```

2. **Backend on Railway/Render**
   - Deploy Node.js app
   - Add environment variables for Google Cloud credentials
   - Update frontend API URLs to point to deployed backend

#### AWS/Azure/GCP
- Use AWS Amplify, Azure App Service, or Google Cloud Run
- Configure CORS for cross-origin requests
- Set up environment variables for API keys

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=./your-credentials.json
```

### Frontend
Update API URLs in components to point to deployed backend:
```javascript
const API_BASE = 'https://your-backend-url.com';
```

## Production Considerations

### Security
- Store API keys in environment variables
- Enable HTTPS
- Implement rate limiting
- Add input validation

### Performance
- Use CDN for static assets
- Enable gzip compression
- Implement caching strategies
- Monitor with analytics

### Monitoring
- Add error tracking (Sentry)
- Set up logging
- Monitor API usage
- Health checks

## Troubleshooting

### Common Issues
1. **CORS Errors**: Update backend CORS settings
2. **API Timeouts**: Increase timeout limits
3. **Microphone Access**: Use HTTPS in production
4. **Google Cloud API**: Check credentials and quotas

### Logs
```bash
# Backend logs
cd backend && node server.js

# Frontend build issues
cd frontend/vite-project && npm run build --verbose
```

## Support
For deployment issues:
1. Check console logs
2. Verify API endpoints
3. Test Google Cloud credentials
4. Ensure all dependencies are installed

## Quick Start Script
```bash
#!/bin/bash
echo "Starting Handwriting SLD App Deployment..."

# Install dependencies
echo "Installing backend dependencies..."
cd backend && npm install

echo "Installing frontend dependencies..."
cd ../frontend/vite-project && npm install

# Build frontend
echo "Building frontend..."
npm run build

# Start services
echo "Starting services..."
cd ../../backend && node server.js &
cd ../frontend/vite-project && npm run preview &

echo "Deployment complete! Access:"
echo "Frontend: http://localhost:4173"
echo "Backend: http://localhost:5000"
```

## File Structure After Build
```
handwriting-sld-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── credentials.json
│   └── node_modules/
├── frontend/
│   ├── vite-project/
│   │   ├── dist/           # Built files
│   │   ├── package.json
│   │   └── node_modules/
└── model/
    ├── dyslexia_model.pkl
    └── dyslexia_pipeline.pkl
```
