# GeoAgent — Agentic Local Tourism Intelligence System

A production-ready multi-agent AI system for local tourism planning. GeoAgent combines
RAG-based knowledge retrieval, real-time weather data, location-aware suggestions, and
adaptive safety analysis to deliver personalized travel intelligence.

---

## Architecture

```
User Request
    |
    v
Planner Agent          ← Decomposes query, identifies required sub-agents
    |
    +---> Explorer Agent    ← RAG (Chroma + HuggingFace + Groq)
    +---> Nearby Agent      ← Maps API (Foursquare)
    +---> Weather Agent     ← OpenWeatherMap
    +---> Safety Agent      ← Risk analysis (weather + time context)
    |
    v
Aggregator Agent       ← Groq LLM synthesis
    |
    v
Structured Response
```

Agents run in parallel where possible (Explorer, Weather, Nearby) to minimize latency.
The Safety Agent consumes Weather output. The Aggregator synthesizes all outputs into a
final personalized response.

---

## Tech Stack

**Backend**
- Python 3.11
- FastAPI — async API framework
- LangChain — agent orchestration and RAG chains
- Chroma DB — vector store for tourism knowledge
- HuggingFace Sentence Transformers — document embeddings
- Groq (LLaMA 3.1 8B) — LLM for generation and synthesis
- ReportLab — PDF itinerary export

**Frontend**
- React 18 + TypeScript
- Tailwind CSS — utility-first styling
- Vite — build tool and dev server
- Axios — API client
- Lucide React — icon system

---

## Project Structure

```
geoagent/
├── backend/
│   ├── agents/
│   │   ├── planner.py         # Task decomposition
│   │   ├── explorer.py        # RAG retrieval
│   │   ├── nearby.py          # Maps API integration
│   │   ├── weather.py         # Weather data
│   │   ├── safety.py          # Risk analysis
│   │   ├── aggregator.py      # LLM response synthesis
│   │   └── orchestrator.py    # Agent coordination
│   ├── core/
│   │   ├── config.py          # Pydantic settings
│   │   └── logging_config.py  # Structured logging
│   ├── data/
│   │   └── tourism_data.txt   # RAG knowledge base
│   ├── models/
│   │   └── schemas.py         # Pydantic request/response models
│   ├── routes/
│   │   ├── chat.py            # POST /api/chat
│   │   ├── plan.py            # POST /api/plan
│   │   ├── nearby.py          # POST /api/nearby
│   │   └── export.py          # POST /api/export
│   ├── services/
│   │   ├── rag_service.py     # Chroma + LangChain RAG
│   │   └── pdf_service.py     # PDF generation
│   ├── tools/
│   │   ├── maps_tool.py       # Foursquare API wrapper
│   │   ├── weather_tool.py    # OpenWeatherMap wrapper
│   │   └── rag_tool.py        # RAG query wrapper
│   ├── main.py                # FastAPI application
│   ├── requirements.txt
│   ├── render.yaml            # Render deployment config
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # Axios API client
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ItineraryPanel.tsx
│   │   │   ├── NearbyPanel.tsx
│   │   │   ├── ProfilePanel.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   └── useLocation.ts
│   │   ├── styles/globals.css
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── vercel.json
│   └── .env.example
└── .github/
    └── workflows/ci.yml
```

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Groq API key (https://console.groq.com/keys)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (required)
# MAPS_API_KEY and WEATHER_API_KEY are optional; synthetic data is used if absent

# Start the server
uvicorn main:app --reload --port 8000
```

The backend will be available at http://localhost:8000.
API docs: http://localhost:8000/docs

RAG loads lazily by default to keep memory usage low on small instances.
Set `RAG_PREWARM_ON_STARTUP=true` only if your host has enough memory and you
want faster first-query latency.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional for local dev)
cp .env.example .env
# VITE_API_URL defaults to /api, proxied to localhost:8000 by Vite

# Start dev server
npm run dev
```

The frontend will be available at http://localhost:5173.

---

## API Reference

### POST /api/chat

Multi-agent chat query.

**Request**
```json
{
  "query": "What are the best things to do in Bangalore?",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "user_profile": {
    "budget": "medium",
    "interests": ["history", "food"]
  }
}
```

**Response**
```json
{
  "answer": "...",
  "sources": ["tourism_data.txt"],
  "agent_trace": ["Explorer [high confidence]", "Weather Agent", "Safety Agent", "Aggregator"],
  "session_id": "abc123"
}
```

---

### POST /api/plan

Generate a multi-day travel itinerary.

**Request**
```json
{
  "destination": "Goa",
  "days": 3,
  "user_profile": {
    "budget": "medium",
    "interests": ["food", "nature"]
  }
}
```

**Response**
```json
{
  "destination": "Goa",
  "days": 3,
  "itinerary": [
    {
      "day": 1,
      "theme": "Arrival and North Goa Beaches",
      "activities": ["..."],
      "meals": ["..."],
      "tips": ["..."]
    }
  ],
  "safety_notes": ["..."],
  "weather_summary": "...",
  "agent_trace": ["..."]
}
```

---

### POST /api/nearby

Find places near a coordinate.

**Request**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius_km": 5,
  "categories": ["attractions", "food"]
}
```

---

### POST /api/export

Export a plan as a PDF. Returns `application/pdf` binary.

**Request** — body is the full `PlanResponse` object wrapped in:
```json
{
  "plan": { ... },
  "include_map": false
}
```

---

### GET /health

Returns `{ "status": "ok", "version": "1.0.0" }`.

---

## Deployment

### Backend → Render

1. Push the `backend/` directory to a GitHub repository.
2. Create a new Web Service on Render, connecting the repository.
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `GROQ_API_KEY`, `MAPS_API_KEY`, `WEATHER_API_KEY`

For low-memory plans, keep `RAG_PREWARM_ON_STARTUP=false` (or unset) to avoid
startup OOM while loading embedding models.

### Frontend → Vercel

1. Push the `frontend/` directory to a GitHub repository.
2. Import the repository in Vercel.
3. Set `VITE_API_URL` environment variable to your Render backend URL.
4. Update `vercel.json` rewrites destination to your Render URL.
5. Deploy.

---

## Git Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production releases |
| `dev` | Integration branch |
| `feature/frontend` | UI development |
| `feature/dataset` | Tourism data and RAG prep |
| `feature/testing` | API testing and QA |
| `feature/docs` | Documentation |

### Commit Convention

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring |
| `test:` | Test additions |
| `chore:` | Build or tooling changes |

### Workflow

1. Branch off `dev`: `git checkout -b feature/your-task dev`
2. Commit your changes with clear messages
3. Push and open a Pull Request to `dev`
4. Project Lead reviews and merges
5. On release: `dev` is merged into `main`

---

## Team Roles

| ID | Name | Role |
|----|------|------|
| 1HK23CS038 | Deepika M R | Frontend Developer — `feature/frontend` |
| 1HK23CS039 | Deepthi Raj D | Dataset Engineer — `feature/dataset` |
| 1HK23CS040 | Deepti Kanta Panigrahi | Testing Engineer — `feature/testing` |
| 1HK23CS041 | Devidas | Backend and AI Lead — `main` / `dev` |
| 1HK23CS042 | Dhanushree P | Documentation Engineer — `feature/docs` |

---

## Extending the Knowledge Base

Add tourism content to `backend/data/tourism_data.txt`. Delete the `backend/chroma_db/`
directory and restart the backend. The RAG pipeline will rebuild the index automatically.

---

## License

For academic use. HKBK College of Engineering, Department of Computer Science.
