# Handwriting SLD App

A comprehensive web application for dyslexia screening and learning disabilities detection with speech recognition, text-to-speech, and ML-based analysis.

## 🚀 Live Demo

**Frontend**: [https://handwriting-sld-app.netlify.app](https://handwriting-sld-app.netlify.app)
**Backend**: [https://handwriting-sld-backend.onrender.com](https://handwriting-sld-backend.onrender.com)

## ✨ Features

- **Pronunciation Mode**: Real-time speech-to-text feedback with detailed results
- **Dictation Mode**: Text-to-speech with typing practice and accuracy scoring
- **ML-Based Analysis**: Dyslexia detection using machine learning models
- **Google Cloud Vision**: Handwriting analysis and OCR capabilities
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Detailed Results**: Word-by-word breakdown with scoring and feedback

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** for styling
- **Web Speech API** for speech recognition
- **Speech Synthesis API** for text-to-speech

### Backend
- **Node.js** with Express
- **Google Cloud Vision API**
- **Python ML Models** (pickle files)
- **CORS** for cross-origin requests

## 📱 Access from Any Device

The application is deployed and accessible from:
- **Desktop/Laptop**: Use any modern browser
- **Tablet**: iPad, Android tablets
- **Mobile Phone**: iPhone, Android phones
- **URL**: https://handwriting-sld-app.netlify.app

## 🔧 Setup for Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/handwriting-sld-app.git
   cd handwriting-sld-app
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend/vite-project
   npm install
   ```

3. **Set up Google Cloud credentials**
   - Place your JSON credentials file in `backend/`
   - Update the credentials filename in `server.js`

4. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   node server.js
   
   # Frontend (Terminal 2)
   cd frontend/vite-project
   npm run dev
   ```

## 🌐 Deployment

### Frontend (Netlify)
- Built with React + Vite
- Deployed to Netlify for global CDN
- Automatic deployments from GitHub

### Backend (Railway/Render)
- Node.js Express server
- Deployed to Railway/Render
- Environment variables for API keys

## 📊 Usage

1. **Open the app** on any device
2. **Choose mode**: Pronunciation or Dictation
3. **Select difficulty**: Elementary or Intermediate
4. **Start the test**: Follow on-screen instructions
5. **View results**: Detailed scoring and feedback

## 🔐 Permissions

- **Microphone**: Required for speech recognition
- **Speakers**: Required for text-to-speech
- **Camera**: Optional for handwriting analysis

## 📈 Performance

- **Fast loading**: Optimized build with code splitting
- **Responsive**: Works on all screen sizes
- **PWA ready**: Can be installed as a mobile app
- **Offline support**: Basic functionality works offline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@handwriting-sld-app.com
- Check the FAQ section

## 🔗 Links

- **Live App**: https://handwriting-sld-app.netlify.app
- **GitHub**: https://github.com/yourusername/handwriting-sld-app
- **API Docs**: https://handwriting-sld-backend.onrender.com/docs
- **Status Page**: https://status.handwriting-sld-app.com
