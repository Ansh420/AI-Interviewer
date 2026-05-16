# AI Technical Interviewer v2.0 🚀

A professional-grade, AI-driven platform for real-time technical interview simulation. Transitioned from Gemini to **Local LLM (Ollama)** for privacy, cost-efficiency, and unlimited usage.

## ✨ Core Features

- **Local AI Brain:** Powered by [Ollama](https://ollama.com/) (using `moondream` or `llava-llama3`). No API keys required for reasoning.
- **Vision-Based Analysis:** The AI "sees" your screen. It analyzes your code structure, UI layouts, and architectural diagrams in real-time.
- **Neural Voice Interaction:** High-quality, human-like voice synthesis using `edge-tts` (Aria voice). 100% Free.
- **Integrated Code Sandbox:** Execute Python and JavaScript locally in a secure environment with AI-driven performance critique.
- **Professional Architecture:** Built with a Layer-Based FastAPI backend and a modular React frontend.
- **Session Timelines:** Detailed post-interview reports including technical depth, clarity, and originality scores.
- **Markdown Feedback:** Professional technical critiques structured with strengths, weaknesses, and roadmaps.

## 🏗️ Project Structure

```text
ai-interviewer/
├── backend/                # FastAPI Layer-Based Architecture
│   ├── app/
│   │   ├── api/v1/         # Versioned API Endpoints
│   │   ├── core/           # Configuration & Settings
│   │   ├── db/             # Database Session & Base Models
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Validation
│   │   └── services/       # AI Engine, TTS, & Sandbox Logic
│   └── tests/              # Pytest Suite
└── frontend/               # React Modular Structure
    └── src/
        ├── assets/         # Static Resources
        ├── components/     # Shared UI Components
        ├── pages/          # Top-level Views (Interview, Feedback)
        ├── services/       # API & WebSocket Clients
        └── styles/         # Organized CSS
```

## 🚀 Quick Start

### 1. Prerequisites
- [Ollama](https://ollama.com/) installed and running.
- Python 3.10+ & Node.js installed.

### 2. Setup Ollama
```bash
ollama pull moondream  # Lightweight Vision/Reasoning
# OR
ollama pull llava-llama3 # High Performance (requires 8GB+ RAM)
```

### 3. Backend Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

### 4. Frontend Installation
```bash
cd frontend
npm install
npm start
```

## 🛠️ Configuration
Rename `.env.example` to `.env` in both directories to configure local database paths and specialized settings.

## 📝 License
MIT License. Powered by Gemini Flash & Ollama.
