"""
Shared type definitions for Personal Assistant system.
Used across mobile app, backend, and AI agents.
"""

from datetime import datetime, date
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Core Enums
class TaskDomain(str, Enum):
    FAMILY = "family"
    HOME = "home" 
    JOB = "job"
    COMPANY = "company"
    PERSONAL = "personal"


class TaskStatus(str, Enum):
    CAPTURED = "captured"
    PARSED = "parsed"
    TRIAGED = "triaged"
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class Priority(str, Enum):
    CRITICAL = "critical"  # 5 - health/baby/legal/major deadlines
    HIGH = "high"         # 4 - revenue/company strategy  
    MEDIUM = "medium"     # 3 - job responsibilities
    LOW = "low"          # 2 - household stability
    SOMEDAY = "someday"   # 1 - nice-to-have


class AgentType(str, Enum):
    CAPTURE = "capture"
    PLANNING = "planning"
    EMAIL = "email"
    RESEARCH = "research"
    REFLECTION = "reflection"
    WORKFLOW = "workflow"


class TaskActionType(str, Enum):
    RESEARCH = "research"
    PURCHASE = "purchase"
    EMAIL = "email"
    CALL = "call"
    BOOK = "book"
    DELEGATE = "delegate"
    SCHEDULE = "schedule"
    REMIND = "remind"
    TRACK = "track"
    DECIDE = "decide"
    PHOTO = "photo"
    CHECKLIST = "checklist"


class TaskActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    SKIPPED = "skipped"


# Core Data Models
class SubTask(BaseModel):
    id: Optional[str] = None
    task_id: str
    title: str
    status: TaskStatus = TaskStatus.CAPTURED
    order_index: int = 0


class Task(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    description: Optional[str] = None
    domain: TaskDomain
    status: TaskStatus = TaskStatus.CAPTURED
    priority: Priority = Priority.MEDIUM
    priority_score: float = 0.0
    importance: int = Field(ge=1, le=5, default=3)
    urgency: int = Field(ge=1, le=5, default=3)
    due_date: Optional[date] = None
    estimated_duration_min: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    source: str = "manual"  # voice, manual, email, etc.
    requires_calendar_block: bool = False
    linked_calendar_event_id: Optional[str] = None
    linked_email_thread_id: Optional[str] = None
    ai_metadata: Dict[str, Any] = {}
    subtasks: List[SubTask] = []


class Project(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    description: Optional[str] = None
    domain: TaskDomain
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    task_ids: List[str] = []


class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    time_zone: str = "UTC"
    household_members: List[str] = []  # Names of household members for delegation
    default_work_hours: Dict[str, Any] = {
        "monday": {"start": "09:00", "end": "18:00"},
        "tuesday": {"start": "09:00", "end": "18:00"},
        "wednesday": {"start": "09:00", "end": "18:00"},
        "thursday": {"start": "09:00", "end": "18:00"},
        "friday": {"start": "09:00", "end": "18:00"},
        "saturday": {"start": None, "end": None},
        "sunday": {"start": None, "end": None}
    }
    default_family_hours: Dict[str, Any] = {
        "weekday_morning": {"start": "06:00", "end": "09:00"},
        "weekday_evening": {"start": "18:00", "end": "22:00"},
        "weekend": {"start": "08:00", "end": "20:00"}
    }
    preferences: Dict[str, Any] = {}


# Task Action System
class TaskAction(BaseModel):
    id: Optional[str] = None
    task_id: Optional[str] = None
    type: TaskActionType
    label: str
    status: TaskActionStatus = TaskActionStatus.PENDING
    order_index: int = 0
    metadata: Dict[str, Any] = {}
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class DecisionOption(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None
    price: Optional[str] = None
    rating: Optional[float] = None
    pros: List[str] = []
    cons: List[str] = []
    url: Optional[str] = None
    recommended: bool = False


class TaskAttachment(BaseModel):
    id: Optional[str] = None
    task_id: str
    type: str = "image"
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    created_at: Optional[datetime] = None


class HouseholdMember(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    role: str = "parent"
    skills: List[str] = []
    availability: Dict[str, Any] = {}
    contact: Optional[str] = None
    is_external: bool = False
    created_at: Optional[datetime] = None


class ExternalProvider(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    service_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    created_at: Optional[datetime] = None


class RecurringTemplate(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    title: str
    domain: TaskDomain = TaskDomain.HOME
    frequency: str = "weekly"
    cron_expression: Optional[str] = None
    default_actions: List[Dict[str, Any]] = []
    last_generated: Optional[datetime] = None
    next_due: Optional[datetime] = None
    active: bool = True
    created_at: Optional[datetime] = None


class CalendarEvent(BaseModel):
    id: Optional[str] = None
    user_id: str
    source: str  # google, outlook, manual
    external_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    is_all_day: bool = False


# AI Agent Schemas
class VoiceCaptureInput(BaseModel):
    transcript: str
    user_profile: User
    timestamp: datetime
    location: Optional[str] = None
    context: Dict[str, Any] = {}


class ParsedTaskOutput(BaseModel):
    title: str
    description: Optional[str] = None
    domain: TaskDomain
    priority_hint: Priority = Priority.MEDIUM
    due_date: Optional[date] = None
    estimated_duration_min: Optional[int] = None
    requires_calendar_block: bool = False
    subtasks: List[str] = []
    context_notes: Optional[str] = None


class CaptureAgentOutput(BaseModel):
    tasks: List[ParsedTaskOutput]
    summary: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)


class TimeSlot(BaseModel):
    start: datetime
    end: datetime
    reason: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)


class SchedulingProposal(BaseModel):
    task_id: str
    proposed_slots: List[TimeSlot]
    reasoning: Optional[str] = None


class PlanningAgentOutput(BaseModel):
    schedule_proposals: List[SchedulingProposal]
    conflicts: List[str] = []
    recommendations: List[str] = []


# API Request/Response Models
class VoiceCaptureRequest(BaseModel):
    audio_data: Optional[str] = None  # base64 encoded
    transcript: Optional[str] = None  # if already transcribed
    location: Optional[str] = None
    context: Dict[str, Any] = {}


class VoiceCaptureResponse(BaseModel):
    tasks: List[ParsedTaskOutput]
    summary: Optional[str] = None
    processing_time_ms: int
    confidence_score: float


class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    domain: TaskDomain
    priority: Priority = Priority.MEDIUM
    due_date: Optional[date] = None
    estimated_duration_min: Optional[int] = None
    requires_calendar_block: bool = False


class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[TaskDomain] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None
    estimated_duration_min: Optional[int] = None


class WhatNowRequest(BaseModel):
    current_time: datetime
    available_duration_min: Optional[int] = None
    energy_level: Optional[str] = None  # high, medium, low
    location: Optional[str] = None  # home, office, outside


class WhatNowResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    reasoning: str
    context_summary: str


class TaskListRequest(BaseModel):
    domain: Optional[TaskDomain] = None
    status: Optional[TaskStatus] = None
    due_before: Optional[date] = None
    priority: Optional[Priority] = None
    limit: int = 50
    offset: int = 0


class TaskListResponse(BaseModel):
    tasks: List[Task]
    total_count: int
    has_more: bool


# Email Agent Models
class EmailDraftRequest(BaseModel):
    task_id: str
    recipient_hint: Optional[str] = None
    context: Optional[str] = None
    tone: str = "professional"  # professional, casual, friendly


class EmailDraftResponse(BaseModel):
    subject: str
    body: str
    recipient_suggestions: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0)


# Research Agent Models
class ResearchRequest(BaseModel):
    task_id: str
    query: str
    research_type: str = "general"  # general, product_comparison, local_services
    location: Optional[str] = None
    budget_range: Optional[str] = None


class ResearchOption(BaseModel):
    title: str
    description: str
    pros: List[str] = []
    cons: List[str] = []
    price_range: Optional[str] = None
    rating: Optional[float] = None
    url: Optional[str] = None
    image_url: Optional[str] = None


class ResearchResponse(BaseModel):
    options: List[ResearchOption]
    summary: str
    recommendation: Optional[str] = None
    sources: List[str] = []


# Nudge models
class NudgeType(str, Enum):
    DUE_SOON = "due_soon"
    OVERDUE = "overdue"
    SUGGESTION = "suggestion"
    REMINDER = "reminder"


class Nudge(BaseModel):
    type: NudgeType
    message: str
    task_id: Optional[str] = None
    action: Optional[str] = None  # e.g. "view_task", "start_task"


class NudgesResponse(BaseModel):
    nudges: List[Nudge]


# Daily Plan models
class DailyPlanItem(BaseModel):
    task_id: str
    task_title: str
    suggested_time: str  # ISO time string
    reason: str
    estimated_duration_min: int = 30


class DailyPlanResponse(BaseModel):
    plan: List[DailyPlanItem]
    summary: str


# Workflow Agent Models
class WorkflowAgentOutput(BaseModel):
    actions: List[TaskAction]
    reasoning: str = ""


class ActionExecuteRequest(BaseModel):
    action_id: str
    status: Optional[TaskActionStatus] = None
    metadata_updates: Dict[str, Any] = {}


class ActionExecuteResponse(BaseModel):
    action: TaskAction
    side_effects: List[str] = []


class TaskActionsResponse(BaseModel):
    actions: List[TaskAction]


class TaskAttachmentsResponse(BaseModel):
    attachments: List[TaskAttachment]


class HouseholdResponse(BaseModel):
    members: List[HouseholdMember]
    providers: List[ExternalProvider]


class RecurringTemplatesResponse(BaseModel):
    templates: List[RecurringTemplate]
