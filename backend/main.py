"""
Personal Assistant Backend API
FastAPI server with AI agent orchestration
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import sys
import os
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
# Try current directory first, then parent directory (project root)
env_path = Path(__file__).parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from typing import List
from shared.schemas import (
    VoiceCaptureRequest,
    VoiceCaptureResponse,
    TaskCreateRequest,
    TaskUpdateRequest,
    Task,
    TaskListRequest,
    TaskListResponse,
    WhatNowRequest,
    WhatNowResponse,
    EmailDraftRequest,
    EmailDraftResponse,
    ResearchRequest,
    ResearchResponse,
    NudgesResponse,
    Nudge,
    NudgeType,
    DailyPlanResponse,
    TaskAction,
    TaskActionType,
    TaskActionStatus,
    TaskActionsResponse,
    ActionExecuteRequest,
    ActionExecuteResponse,
    TaskAttachment,
    TaskAttachmentsResponse,
    HouseholdMember,
    ExternalProvider,
    HouseholdResponse,
    RecurringTemplate,
    RecurringTemplatesResponse,
    User,
    TaskStatus,
    TaskDomain,
    Priority,
    LoginRequest,
    RegisterRequest,
)

from services.database import DatabaseService
from services.auth import AuthService  
from services.task_service import TaskService
from services.ai_orchestrator import AIOrchestrator
from services.calendar_service import CalendarService
from services.email_service import EmailService


# Application lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Personal Assistant API starting up...")
    
    # Initialize services
    await DatabaseService.initialize()
    
    yield
    
    # Shutdown
    print("👋 Personal Assistant API shutting down...")
    await DatabaseService.close()


# Create FastAPI app
app = FastAPI(
    title="Personal Assistant API",
    description="Intelligent personal assistant with AI-powered task management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
auth_service = AuthService()


# Dependency injection
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Extract and validate user from JWT token"""
    return await auth_service.get_current_user(credentials.credentials)


async def get_task_service() -> TaskService:
    return TaskService()


async def get_ai_orchestrator() -> AIOrchestrator:
    return AIOrchestrator()


async def get_calendar_service() -> CalendarService:
    return CalendarService()


async def get_email_service() -> EmailService:
    return EmailService()


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "personal-assistant-api"}


# Authentication endpoints
@app.post("/auth/login")
async def login(request: LoginRequest):
    """User login - returns JWT token"""
    try:
        return await auth_service.login(request.email, request.password)
    except ValueError as e:
        # Invalid credentials
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/auth/register")
async def register(request: RegisterRequest):
    """User registration"""
    try:
        return await auth_service.register(request.dict())
    except ValueError as e:
        # User already exists or validation issue
        raise HTTPException(status_code=400, detail=str(e))


# Test endpoint without auth (for demo purposes)
@app.post("/test/voice-parse")
async def test_voice_parse(request: VoiceCaptureRequest):
    """Test voice parsing without authentication - for demo only"""
    ai_orchestrator = AIOrchestrator()
    
    # Create a mock user for testing
    mock_user = User(
        id="test-user",
        name="Test User",
        email="test@example.com",
        time_zone="UTC"
    )
    
    try:
        result = await ai_orchestrator.process_voice_capture(request, mock_user)
        return VoiceCaptureResponse(
            tasks=result.tasks,
            summary=result.summary,
            processing_time_ms=0,
            confidence_score=result.confidence_score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Core voice capture endpoint
@app.post("/capture/voice", response_model=VoiceCaptureResponse)
async def capture_voice(
    request: VoiceCaptureRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Main voice capture endpoint - converts speech to structured tasks
    
    Flow:
    1. STT (if audio provided) or use transcript directly
    2. AI Capture Agent parses into structured tasks
    3. Save tasks to database
    4. Return structured response for mobile app review
    """
    try:
        # Process voice input through AI orchestrator
        capture_result = await ai_orchestrator.process_voice_capture(
            request, current_user
        )
        
        # Create tasks in database (initially in 'parsed' state)
        created_tasks = []
        for task_data in capture_result.tasks:
            task = await task_service.create_task_from_parsed(
                user_id=current_user.id,
                parsed_task=task_data
            )
            created_tasks.append(task)
        
        # Schedule background processing: calendar + workflow decomposition
        background_tasks.add_task(
            schedule_tasks_background,
            created_tasks,
            current_user.id
        )
        background_tasks.add_task(
            decompose_tasks_background,
            created_tasks,
            current_user,
        )
        
        return VoiceCaptureResponse(
            tasks=capture_result.tasks,
            summary=capture_result.summary,
            processing_time_ms=0,  # TODO: measure actual time
            confidence_score=capture_result.confidence_score,
            transcript=capture_result.transcript,
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice capture failed: {str(e)}")


async def schedule_tasks_background(tasks: list[Task], user_id: str):
    """Background task to handle calendar scheduling"""
    ai_orchestrator = AIOrchestrator()
    calendar_service = CalendarService()
    
    # Get tasks that need calendar blocks
    calendar_tasks = [t for t in tasks if t.requires_calendar_block]
    
    if calendar_tasks:
        # Get scheduling proposals from AI
        proposals = await ai_orchestrator.generate_schedule_proposals(
            tasks=calendar_tasks,
            user_id=user_id
        )
        
        # Create calendar events (auto-accept for now, add confirmation later)
        for proposal in proposals.schedule_proposals:
            if proposal.proposed_slots:
                best_slot = proposal.proposed_slots[0]  # Take highest confidence
                await calendar_service.create_task_block(
                    user_id=user_id,
                    task_id=proposal.task_id,
                    start_time=best_slot.start,
                    end_time=best_slot.end
                )


async def decompose_tasks_background(tasks: list[Task], user: User):
    """Background task to decompose captured tasks into workflow actions."""
    try:
        ai = AIOrchestrator()
        ts = TaskService()
        members = await ts.get_household_members(user.id)

        for task in tasks:
            actions = await ai.decompose_task_into_actions(task, user, members)
            actions = ai.suggest_delegation(task, actions, members)
            await ts.add_actions_to_task(task.id, actions)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Background] Workflow decomposition failed: {e}")


# Task management endpoints
@app.post("/tasks", response_model=Task)
async def create_task(
    request: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Create a new task manually"""
    return await task_service.create_task(
        user_id=current_user.id,
        task_data=request
    )


@app.get("/tasks", response_model=TaskListResponse)
async def list_tasks(
    domain: TaskDomain = None,
    status: TaskStatus = None,
    priority: Priority = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """List tasks with filtering"""
    filters = TaskListRequest(
        domain=domain,
        status=status,
        priority=priority,
        limit=limit,
        offset=offset
    )
    
    return await task_service.list_tasks(
        user_id=current_user.id,
        filters=filters
    )


@app.get("/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get a specific task"""
    task = await task_service.get_task(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Update a task"""
    task = await task_service.update_task(
        task_id=task_id,
        user_id=current_user.id,
        updates=request
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Delete a task"""
    success = await task_service.delete_task(task_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# "What should I do now?" endpoint
@app.post("/recommendations/what-now", response_model=WhatNowResponse)
async def what_now(
    request: WhatNowRequest,
    current_user: User = Depends(get_current_user),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Get contextual task recommendations based on time, energy, location
    """
    try:
        # Get current tasks that could be done now
        available_tasks = await task_service.get_available_tasks(
            user_id=current_user.id,
            current_time=request.current_time,
            max_duration=request.available_duration_min
        )
        
        # Use AI to prioritize and recommend
        recommendations = await ai_orchestrator.generate_what_now_recommendations(
            request=request,
            available_tasks=available_tasks,
            user=current_user
        )
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")


# Proactive nudges endpoint
@app.get("/recommendations/nudges", response_model=NudgesResponse)
async def get_nudges(
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Get proactive nudge notifications based on task deadlines and patterns.
    Returns nudges for overdue tasks, tasks due soon (1-3 days), and contextual suggestions.
    """
    try:
        from datetime import datetime, timedelta

        # Fetch all open tasks
        all_tasks_resp = await task_service.list_tasks(
            user_id=current_user.id,
            filters=TaskListRequest(limit=200)
        )
        open_tasks = [
            t for t in all_tasks_resp.tasks
            if t.status not in (TaskStatus.DONE, TaskStatus.CANCELLED)
        ]

        nudges: list[Nudge] = []
        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")

        for task in open_tasks:
            if not task.due_date:
                continue

            due_str = task.due_date.isoformat() if hasattr(task.due_date, 'isoformat') else str(task.due_date)
            due_str = due_str[:10]

            diff_days = (datetime.strptime(due_str, "%Y-%m-%d") - datetime.strptime(today_str, "%Y-%m-%d")).days

            if diff_days < 0:
                nudges.append(Nudge(
                    type=NudgeType.OVERDUE,
                    message=f'"{task.title}" is overdue by {abs(diff_days)} day{"s" if abs(diff_days) != 1 else ""}.',
                    task_id=task.id,
                    action="view_task",
                ))
            elif diff_days == 0:
                nudges.append(Nudge(
                    type=NudgeType.DUE_SOON,
                    message=f'"{task.title}" is due today.',
                    task_id=task.id,
                    action="start_task",
                ))
            elif diff_days <= 3:
                nudges.append(Nudge(
                    type=NudgeType.DUE_SOON,
                    message=f'"{task.title}" is due in {diff_days} day{"s" if diff_days != 1 else ""}.',
                    task_id=task.id,
                    action="view_task",
                ))

        # Sort: overdue first, then due_soon
        type_priority = {NudgeType.OVERDUE: 0, NudgeType.DUE_SOON: 1, NudgeType.SUGGESTION: 2, NudgeType.REMINDER: 3}
        nudges.sort(key=lambda n: type_priority.get(n.type, 99))

        return NudgesResponse(nudges=nudges[:10])  # Limit to 10 nudges

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate nudges: {str(e)}")


# Daily plan generation endpoint
@app.post("/recommendations/daily-plan", response_model=DailyPlanResponse)
async def generate_daily_plan(
    current_user: User = Depends(get_current_user),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
    task_service: TaskService = Depends(get_task_service)
):
    """
    Generate an AI-powered daily plan considering calendar, tasks, and energy patterns.
    """
    try:
        plan = await ai_orchestrator.generate_daily_plan(
            user=current_user,
            task_service=task_service,
        )
        return plan
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Daily plan generation failed: {str(e)}")


# ── Task Actions endpoints ─────────────────────────────────────────

@app.get("/tasks/{task_id}/actions", response_model=TaskActionsResponse)
async def get_task_actions(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get all actions for a task."""
    actions = await task_service.get_task_actions(task_id)
    return TaskActionsResponse(actions=actions)


@app.post("/tasks/{task_id}/actions/generate", response_model=TaskActionsResponse)
async def generate_task_actions(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator)
):
    """Use the WorkflowAgent to decompose a task into typed actions."""
    task = await task_service.get_task(task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get household members for delegation suggestions
    members = await task_service.get_household_members(current_user.id)

    # Generate actions via WorkflowAgent
    actions = await ai_orchestrator.decompose_task_into_actions(
        task=task, user=current_user, household_members=members
    )

    # Apply delegation engine
    actions = ai_orchestrator.suggest_delegation(task, actions, members)

    # Save to database
    saved = await task_service.add_actions_to_task(task_id, actions)
    return TaskActionsResponse(actions=saved)


@app.put("/tasks/{task_id}/actions/{action_id}")
async def update_task_action(
    task_id: str,
    action_id: str,
    request: ActionExecuteRequest,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Update an action's status or metadata."""
    updates = {}
    if request.status:
        updates["status"] = request.status
    if request.metadata_updates:
        # Merge metadata
        action = await task_service.db.get_task_action(action_id)
        if action:
            merged = {**action.metadata, **request.metadata_updates}
            updates["metadata"] = merged

    result = await task_service.update_action(action_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found")
    return ActionExecuteResponse(action=result, side_effects=[])


# ── Task Attachments endpoints ────────────────────────────────────

@app.get("/tasks/{task_id}/attachments", response_model=TaskAttachmentsResponse)
async def get_task_attachments(
    task_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get all attachments for a task."""
    attachments = await task_service.get_task_attachments(task_id)
    return TaskAttachmentsResponse(attachments=attachments)


@app.post("/tasks/{task_id}/attachments", response_model=TaskAttachment)
async def add_task_attachment(
    task_id: str,
    attachment: TaskAttachment,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Add an attachment to a task."""
    attachment.task_id = task_id
    return await task_service.add_attachment(attachment)


@app.delete("/tasks/{task_id}/attachments/{attachment_id}")
async def delete_task_attachment(
    task_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Delete an attachment."""
    success = await task_service.delete_attachment(attachment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return {"message": "Attachment deleted"}


# ── Household endpoints ───────────────────────────────────────────

@app.get("/household", response_model=HouseholdResponse)
async def get_household(
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get household members and service providers."""
    members = await task_service.get_household_members(current_user.id)
    providers = await task_service.get_service_providers(current_user.id)
    return HouseholdResponse(members=members, providers=providers)


@app.post("/household/members", response_model=HouseholdMember)
async def add_household_member(
    member: HouseholdMember,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Add a household member."""
    member.user_id = current_user.id
    return await task_service.add_household_member(member)


@app.delete("/household/members/{member_id}")
async def remove_household_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Remove a household member."""
    success = await task_service.delete_household_member(member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member removed"}


@app.post("/household/providers", response_model=ExternalProvider)
async def add_service_provider(
    provider: ExternalProvider,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Add a service provider."""
    provider.user_id = current_user.id
    return await task_service.add_service_provider(provider)


@app.delete("/household/providers/{provider_id}")
async def remove_service_provider(
    provider_id: str,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Remove a service provider."""
    success = await task_service.delete_service_provider(provider_id)
    if not success:
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"message": "Provider removed"}


# ── Recurring Templates endpoints ─────────────────────────────────

@app.get("/recurring-templates", response_model=RecurringTemplatesResponse)
async def get_recurring_templates(
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get all recurring templates."""
    templates = await task_service.get_recurring_templates(current_user.id)
    return RecurringTemplatesResponse(templates=templates)


@app.post("/recurring-templates", response_model=RecurringTemplate)
async def create_recurring_template(
    template: RecurringTemplate,
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Create a recurring template."""
    template.user_id = current_user.id
    return await task_service.add_recurring_template(template)


@app.post("/recurring-templates/seed-defaults", response_model=RecurringTemplatesResponse)
async def seed_default_templates(
    current_user: User = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Seed account with pre-built toddler family templates."""
    templates = await task_service.seed_default_templates(current_user.id)
    return RecurringTemplatesResponse(templates=templates)


# Email assistance endpoints
@app.post("/email/draft", response_model=EmailDraftResponse)
async def draft_email(
    request: EmailDraftRequest,
    current_user: User = Depends(get_current_user),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
    task_service: TaskService = Depends(get_task_service),
    email_service: EmailService = Depends(get_email_service)
):
    """Generate email draft for a task"""
    try:
        # Get task context
        task = await task_service.get_task(request.task_id, current_user.id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Get email context if available
        email_context = None
        if task.linked_email_thread_id:
            email_context = await email_service.get_thread_context(
                thread_id=task.linked_email_thread_id,
                user_id=current_user.id
            )
        
        # Generate draft using AI
        draft = await ai_orchestrator.generate_email_draft(
            task=task,
            request=request,
            email_context=email_context,
            user=current_user
        )
        
        return draft
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email draft failed: {str(e)}")


# Research assistance endpoints  
@app.post("/research", response_model=ResearchResponse)
async def research_task(
    request: ResearchRequest,
    current_user: User = Depends(get_current_user),
    ai_orchestrator: AIOrchestrator = Depends(get_ai_orchestrator),
    task_service: TaskService = Depends(get_task_service)
):
    """Perform research for a task"""
    try:
        # Get task context
        task = await task_service.get_task(request.task_id, current_user.id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Perform research using AI agent
        research_result = await ai_orchestrator.perform_research(
            task=task,
            request=request,
            user=current_user
        )
        
        # Attach research results to task
        await task_service.attach_research_results(
            task_id=request.task_id,
            research_data=research_result
        )
        
        return research_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


# Calendar integration endpoints
@app.get("/calendar/events")
async def get_calendar_events(
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user),
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """Get calendar events for date range"""
    return await calendar_service.get_events(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )


@app.post("/calendar/sync")
async def sync_calendar(
    current_user: User = Depends(get_current_user),
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """Manually trigger calendar sync"""
    await calendar_service.sync_external_calendars(current_user.id)
    return {"message": "Calendar sync initiated"}


@app.post("/calendar/events/{event_id}/import-to-task", response_model=Task)
async def import_calendar_event_to_task(
    event_id: str,
    current_user: User = Depends(get_current_user),
    calendar_service: CalendarService = Depends(get_calendar_service),
    task_service: TaskService = Depends(get_task_service),
):
    """
    Import a calendar event (e.g. from Google Calendar) as a task.
    """
    event = await calendar_service.get_event(current_user.id, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    task = await task_service.create_task_from_calendar_event(
        user_id=current_user.id,
        event=event,
    )
    return task


# ── File upload endpoint ───────────────────────────────────────────

import uuid as _uuid
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve uploaded files as static
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload an image or document. Returns the URL for the uploaded file."""
    ext = Path(file.filename or "file").suffix or ".jpg"
    filename = f"{_uuid.uuid4()}{ext}"
    filepath = UPLOAD_DIR / filename

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Build URL (assumes backend is accessed via its own base URL)
    url = f"/uploads/{filename}"
    return {"url": url, "filename": filename}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
