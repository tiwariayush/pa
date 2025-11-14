# Personal Assistant Backend

FastAPI-based backend service with AI agent orchestration for the Personal Assistant system.

## Features

- **Voice Capture Processing**: STT + AI parsing of natural language into structured tasks
- **Multi-Agent AI System**: Specialized agents for capture, planning, email, and research
- **Task Management**: Complete CRUD operations with smart prioritization
- **Calendar Integration**: Google Calendar sync and task scheduling
- **Email Integration**: Context-aware email drafting and thread management
- **PostgreSQL Database**: Robust data persistence with async operations
- **JWT Authentication**: Secure user authentication and authorization

## Architecture

```
FastAPI Application
├── AI Orchestrator Service
│   ├── Capture Agent (Voice → Tasks)
│   ├── Planning Agent (Task → Calendar)
│   ├── Email Agent (Task → Email Drafts)
│   └── Research Agent (Task → Options)
├── Core Services
│   ├── Task Service (CRUD + Prioritization)
│   ├── Calendar Service (Google Calendar API)
│   ├── Email Service (Gmail API)
│   └── Database Service (PostgreSQL)
└── External Integrations
    ├── OpenAI (LLM + STT)
    ├── Google APIs (Calendar, Gmail)
    └── Search APIs (Research)
```

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis 6+ (optional, for task queuing)
- OpenAI API key
- Google Cloud credentials (for Calendar/Gmail)

### Installation

1. **Clone and setup environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database setup:**
   ```bash
   # Create PostgreSQL database
   createdb personal_assistant
   
   # Database tables will be created automatically on first run
   ```

3. **Environment configuration:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Required environment variables:**
   ```bash
   # Database
   DATABASE_URL=postgresql://postgres:password@localhost:5432/personal_assistant
   
   # AI Services
   OPENAI_API_KEY=your-openai-api-key
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   
   # Google Services (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### Running the Server

```bash
# Development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

- **API Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Voice Capture
- `POST /capture/voice` - Process voice input into structured tasks

### Task Management
- `GET /tasks` - List tasks with filtering
- `POST /tasks` - Create new task
- `GET /tasks/{id}` - Get specific task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

### AI Assistance
- `POST /recommendations/what-now` - Get contextual task recommendations
- `POST /email/draft` - Generate email draft for task
- `POST /research` - Perform research for task

### Calendar Integration
- `GET /calendar/events` - Get calendar events
- `POST /calendar/sync` - Sync external calendars

## AI Agent System

### Capture Agent
Parses natural language voice input into structured tasks:

```python
Input: "I need to book vaccines for the baby and schedule a meeting with the accountant"

Output: [
    {
        "title": "Book vaccines for the baby",
        "domain": "family",
        "priority": "high",
        "requiresCalendarBlock": true,
        "subtasks": ["Research pediatric clinics", "Book appointment"]
    },
    {
        "title": "Schedule meeting with accountant", 
        "domain": "job",
        "priority": "medium",
        "requiresCalendarBlock": true
    }
]
```

### Planning Agent
Suggests optimal calendar slots for tasks based on:
- Existing calendar commitments
- Task duration and complexity
- Domain-appropriate time slots
- Energy levels and focus times

### Email Agent
Generates contextual email drafts considering:
- Task context and requirements
- Previous email thread history
- User's communication style
- Professional tone and formatting

### Research Agent
Performs structured research for decision-making tasks:
- Product/service comparisons
- Local business recommendations
- Pros/cons analysis
- Price ranges and ratings

## Database Schema

### Core Tables
- `users` - User profiles and preferences
- `tasks` - Task data with AI metadata
- `subtasks` - Task breakdown and checklists
- `projects` - Multi-task project grouping
- `events_cache` - Calendar events mirror
- `ai_logs` - AI interaction logging

### Key Features
- **Priority Scoring**: Dynamic calculation based on urgency, importance, effort, and context
- **Domain Organization**: Family, Home, Job, Company, Personal categorization
- **Status Lifecycle**: Captured → Parsed → Triaged → Planned → Scheduled → Done
- **AI Metadata**: Extensible JSON fields for agent-specific data

## Development

### Adding New Agents

1. Create agent class in `services/ai_orchestrator.py`
2. Define input/output schemas in `shared/types.py`
3. Add API endpoint in `main.py`
4. Implement agent-specific prompts and logic

### Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=.

# Test specific module
pytest tests/test_ai_orchestrator.py
```

### Code Quality

```bash
# Format code
black .
isort .

# Type checking
mypy .

# Linting
flake8 .
```

## Deployment

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```bash
# Security
JWT_SECRET=generate-strong-secret-key
DEBUG=false

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/personal_assistant

# External Services
OPENAI_API_KEY=prod-openai-key
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret

# Monitoring
LOG_LEVEL=INFO
```

## Monitoring

- **Health Check**: `/health` endpoint for load balancer checks
- **Logging**: Structured logging with request IDs
- **AI Interaction Logs**: All agent calls logged for analysis
- **Performance Metrics**: Response times and success rates

## Security

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Pydantic schemas for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: API rate limits (implement with Redis)
- **CORS Configuration**: Restricted origins in production

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits and usage
   - Monitor API response times

3. **Voice Processing Issues**
   - Ensure audio format compatibility
   - Check STT service availability
   - Verify audio file size limits

### Performance Optimization

- **Database Indexing**: Indexes on user_id, status, priority_score
- **Connection Pooling**: AsyncPG connection pool
- **Caching**: Redis for frequent queries
- **Background Tasks**: Celery for heavy processing

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-agent`
3. Make changes and add tests
4. Ensure code quality: `black . && mypy . && pytest`
5. Submit pull request

## License

This project is licensed under the MIT License.
