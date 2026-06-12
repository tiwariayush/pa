# Personal Assistant - Intelligent Life Management System

A comprehensive personal assistant system designed for busy professionals with families. Combines voice capture, AI-powered task management, calendar integration, and proactive assistance.

## System Overview

- **Mobile App**: React Native (iOS + Android)
- **Backend**: FastAPI with AI agent orchestration  
- **Database**: PostgreSQL with Redis caching
- **AI**: Multi-agent system for capture, planning, email, and research

## Key Features

### Core Capabilities
- 🎤 **Voice Capture**: Natural language task input with intelligent parsing
- 🧠 **Context-Aware Prioritization**: Time, energy, and location-based suggestions
- 📅 **Smart Scheduling**: Automatic calendar integration and time block creation
- 🤖 **Proactive Assistance**: Research, email drafts, and planning support
- 👨‍👩‍👧 **Family & Work Balance**: Domain-aware task management

### Mobile App Features
- **Home/Today**: "What should I do now?" with smart recommendations
- **Inbox**: Voice captures with AI-parsed structure and suggestions
- **Tasks**: Domain-organized with priority scoring and context awareness
- **Calendar**: Integrated view with task blocks and drag-and-drop scheduling
- **Assistant**: Chat interface for planning and research requests

## Architecture

```
Mobile App (React Native)
    ↕
Backend API (FastAPI)
├── User/Auth Service
├── Task & Project Service  
├── Calendar Integration Service
├── AI Orchestrator Service
└── Notification Service
    ↕
External Services
├── STT/TTS Provider
├── LLM Provider (GPT-4/Claude)
├── Google/Microsoft APIs
└── Search & Research APIs
```

## Directory Structure

- `mobile/` - React Native application
- `backend/` - FastAPI server and services
- `shared/` - Common types and schemas
- `docs/` - Architecture and API documentation
- `scripts/` - Development and deployment scripts

## Getting Started

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd pa
   ```

2. **Run the setup script:**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure environment:**
   ```bash
   # Edit backend/.env with your API keys
   cd backend
   cp env.example .env
   # Add your OpenAI API key and other configuration
   ```

4. **Start the backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

5. **Start the mobile app:**
   ```bash
   cd mobile
   npm start
   ```

### Detailed Setup

See individual README files for detailed setup instructions:
- [`backend/README.md`](backend/README.md) - Backend API setup and development
- [`mobile/README.md`](mobile/README.md) - Mobile app setup and development
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Production deployment guide

## Hosting

Production runs on **Vultr** (same place and API key as the other personal
projects): a single VPS running the whole stack with Docker Compose.

```bash
export VULTR_API_KEY=...
./deploy/vultr/provision.sh                 # one-time server creation
SERVER_IP=<ip> ./deploy/vultr/deploy.sh     # deploy / redeploy
```

See [`deploy/vultr/README.md`](deploy/vultr/README.md) for details and
auto-deploy via GitHub Actions.

## Development Phases

1. **Phase 1**: Core capture & task management
2. **Phase 2**: Calendar integration & smart scheduling  
3. **Phase 3**: Email integration & research capabilities
4. **Phase 4**: Proactive learning & family features

## Privacy & Security

- End-to-end encryption for sensitive data
- Granular permission controls
- Local processing where possible
- Comprehensive data deletion capabilities
