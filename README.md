# 🤖 AI Technical Interviewer v2.0

[![GitHub license](https://img.shields.io/github/license/Ansh420/AI-Interviewer)](https://github.com/Ansh420/AI-Interviewer/blob/main/LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://reactjs.org/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.0_Flash-8E75B2?logo=google-gemini)](https://deepmind.google/technologies/gemini/)

An advanced, real-time multimodal AI system designed to conduct autonomous technical interviews. It doesn't just ask questions—it **watches**, **listens**, and **evaluates** your performance as you present your projects or solve live coding challenges.

---

## ✨ Key Features

### 🎙️ Multimodal Intelligence
- **AI Vision:** Powered by **Gemini 2.0 Flash-lite**, the system analyzes your screen in real-time to understand your code architecture, UI design, and logic.
- **Voice Synthesis:** Integrated with **ElevenLabs Flash v2.5** for human-like, low-latency interviewer responses.
- **STT (Speech-to-Text):** Processes your verbal explanations instantly to maintain a natural conversation flow.

### 🧠 Smart Context & Personalization
- **Resume Parsing:** Upload your PDF resume, and the AI will tailor the interview questions specifically to your experience and projects.
- **Dual Modes:**
  - **Project Presentation:** Pitch your architecture and walk through your codebase.
  - **Coding Challenge:** Solve dynamic problems in a secure, integrated **Monaco Editor** environment.

### 📊 Evaluation & Feedback
- **Automated Scoring:** Get immediate feedback on **Technical Depth**, **Clarity**, and **Originality**.
- **Performance Reports:** Comprehensive scorecards are stored in a SQL database for later review and tracking.

---

## 🛠️ Technical Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS (Custom Glassmorphism), Lucide Icons, Monaco Editor |
| **Backend** | Python, FastAPI, WebSockets, PyMuPDF (Resume Parsing) |
| **AI/ML** | Google GenAI SDK (Gemini), ElevenLabs SDK |
| **Database** | SQLite, SQLAlchemy ORM |
| **Communication** | Full-duplex WebSockets for real-time video/audio/text orchestration |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- API Keys: [Google AI Studio](https://aistudio.google.com/), [ElevenLabs](https://elevenlabs.io/)

### 1. Clone the Repository
```bash
git clone https://github.com/Ansh420/AI-Interviewer.git
cd AI-Interviewer
```

### 2. Backend Configuration
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

### 3. Frontend Configuration
```bash
cd ../frontend
npm install
```

---

## 🎮 Running the Application

1. **Start the Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Begin the Interview:**
   - Open `http://localhost:3000`.
   - **Upload your Resume** (optional but recommended).
   - Choose a mode: **Presentation** or **Coding Challenge**.
   - Share your screen and start talking!

---

## 🖼️ UI Preview
The interface features a modern **Glassmorphism** design with real-time status indicators, interactive editors, and high-fidelity video feedback.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ for the future of technical recruitment.
