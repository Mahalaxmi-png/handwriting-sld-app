# Handwriting SLD App

A web-based application designed to screen for dyslexia and related learning difficulties by analyzing reading, writing, and pronunciation patterns using a combination of machine learning and interactive tests.

## Overview
This project focuses on making early screening more accessible by turning traditionally manual assessments into a structured digital process.  
The system combines speech, text, and handwriting inputs to provide a more comprehensive screening approach and generates interpretable results for users.

## Features
- Pronunciation mode with real-time speech-to-text evaluation  
- Dictation mode with text-to-speech and typing accuracy analysis  
- ML-based screening using linguistic and phonetic features  
- Handwriting analysis using Google Cloud Vision OCR  
- Word-level feedback with detailed scoring and error breakdown  

## Tech Stack

### Frontend
- React (Vite)  
- TailwindCSS  
- Web Speech API (speech recognition)  
- Speech Synthesis API (text-to-speech)  

### Backend
- Node.js with Express  
- Google Cloud Vision API  
- Python-based ML models  

## How it works
1. User selects a test mode (pronunciation, dictation, etc.)  
2. Input is captured through speech or typing  
3. Text is analyzed for spelling, grammar, and phonetic patterns  
4. Machine learning models evaluate features for possible learning difficulties  
5. Results are generated with structured scores and detailed feedback  

## Demo
A walkthrough of the application showing how different modules work and how results are generated:

▶️ Watch Demo: https://drive.google.com/file/d/1ES2_C1CkZn7rfEKq8dRqkdRya9BWrRXt/view?usp=sharing

## Learnings
- Built a full-stack application integrating frontend, backend, and ML components  
- Worked with speech recognition and text-to-speech APIs  
- Applied NLP concepts for error detection and analysis  
- Designed structured evaluation and reporting systems  

## Future Improvements
- Improve model accuracy with larger datasets  
- Enhance UI for better accessibility  
- Add progress tracking and personalized feedback  
