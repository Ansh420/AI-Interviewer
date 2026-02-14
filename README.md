# AI-Driven Automated Interviewer 🤖🎙️

A real-time, multimodal AI system that conducts project presentation interviews.

The system "watches" a student's screen, "listens" to their explanation, and asks adaptive technical questions using AI-generated voice.



## 🚀 Features
- **Multimodal Understanding:** Uses **Gemini 3 Flash** to analyze UI, code snippets, and diagrams from real-time screen captures.
- **Voice Interaction:** Integrated **ElevenLabs Flash v2.5** for high-fidelity, low-latency AI interviewer voice.
- **Real-Time Orchestration:** Full-duplex communication via **WebSockets** and **FastAPI**.
- **Automated Scoring:** Generates a final evaluation report based on technical depth, clarity, and originality, stored in a **SQL database**.

## 🛠️ Technical Stack
- **Frontend:** React.js, WebRTC (Screen Capture), Web Speech API (STT).
- **Backend:** Python, FastAPI, WebSockets.
- **AI Models:** Google Gemini (Vision & LLM), ElevenLabs (TTS).
- **Database:** SQLite with SQLAlchemy ORM.

## 📋 Prerequisites
- Python 3.9+
- Node.js & npm
- [Google AI Studio API Key](https://aistudio.google.com/)
- [ElevenLabs API Key](https://elevenlabs.io/)

## 🔧 Installation & Setup

### 1. Backend Setup

cd backend

python -m venv venv

source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt 


### Create a .env file in the backend/ folder


GEMINI_API_KEY=your_google_key_here

ELEVENLABS_API_KEY=your_elevenlabs_key_here

### Frontend Setup


cd frontend

npm install

## How to Run the Demo

### Start the Backend

uvicorn main:app --reload

### Start the Frontend 

npm start

### The Workflow:

Open localhost:3000 in Chrome.

Click "Begin Presentation".

Share the window containing your project code or slides.

Explain your project aloud. The AI will periodically interrupt with voice-based technical questions.

Click "Finish" to view your generated performance scorecard.

## Evaluation Metrics

Upon completion, the system provides a scorecard (stored in SQL) covering:

Technical Depth: Understanding of implementation and architecture.

Clarity: Quality of verbal explanation.

Originality: Innovation and problem-solving approach.

