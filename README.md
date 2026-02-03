# SpeakMate 🗣️

An AI-powered English speaking practice application with real-time voice interaction, instant feedback on grammar, vocabulary, and pronunciation.

## ✨ Features

- **Real-time Voice Transcription** - Powered by Deepgram's Nova-2 model
- **AI Feedback** - Grammar corrections, vocabulary suggestions, and pronunciation tips using Groq LLM
- **Adaptive Learning** - Adjusts to your proficiency level (Beginner, Intermediate, Advanced)
- **Multiple Topics** - Practice Daily Life, Business, Travel, Academic, or Free Talk
- **Progress Tracking** - Monitor your confidence scores and improvement over time
- **Natural Conversations** - Listen to native-like responses with TTS

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- API keys for: Deepgram, Groq

### Installation

1. **Clone the repository**
```bash
cd "English speaking partner"
```

2. **Set up Backend**
```bash
cd backend
pip install -r requirements.txt
```

3. **Set up Frontend**
```bash
cd frontend
npm install
```

4. **Configure Environment**

The `.env` file in `backend/` is already configured with your API keys.

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit: **http://localhost:3000**

## 🏗️ Architecture

```
User speaks → Deepgram STT → Backend processes → Groq LLM generates feedback
                                    ↓
                              RAG retrieves context
                                    ↓
                              MongoDB stores progress
                                    ↓
TTS audio ← Deepgram TTS ← Response sent back
```

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Environment configuration
│   ├── services/
│   │   ├── voice_agent.py   # Deepgram integration
│   │   └── llm_service.py   # Groq LLM integration
│   ├── rag/
│   │   ├── retrieval.py     # Context retrieval
│   │   └── learning_materials.py
│   ├── analytics/
│   │   └── progress_tracker.py
│   └── models/
│       ├── schemas.py       # Pydantic models
│       └── database.py      # MongoDB operations
│
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx         # Main application
│   │   └── layout.tsx       # Root layout
│   ├── src/components/
│   │   ├── VoiceInterface.tsx
│   │   ├── TranscriptDisplay.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── ProgressDashboard.tsx
│   │   └── TopicSelector.tsx
│   └── src/hooks/
│       └── useVoiceAgent.ts # WebSocket hook
│
└── docker-compose.yml
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/sessions` | POST | Create practice session |
| `/api/sessions/{id}/progress` | GET | Get session progress |
| `/api/sessions/{id}/end` | POST | End session |
| `/api/user/{id}/analytics` | GET | User analytics |
| `/ws/voice` | WebSocket | Real-time voice |

## 🐳 Docker

```bash
docker-compose up --build
```

## 📊 Proficiency Levels

| Level | Focus |
|-------|-------|
| **Beginner** | Simple vocabulary, basic grammar, encouragement |
| **Intermediate** | Everyday conversations, phrasal verbs, fluency |
| **Advanced** | Complex topics, idioms, native-like expressions |

## 🔧 Tech Stack

- **Backend**: FastAPI, Python 3.11
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Voice**: Deepgram Nova-2 (STT/TTS)
- **LLM**: Groq (Llama 3)
- **Database**: MongoDB Atlas
- **Animation**: Framer Motion

## 📝 License

MIT License
