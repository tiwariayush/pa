"""
Task Service - Core task management logic
Handles CRUD operations, prioritization, and task lifecycle
"""

import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
import sys
import os

from shared.schemas import (
    Task,
    SubTask,
    ParsedTaskOutput,
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskListRequest,
    TaskListResponse,
    TaskAction,
    TaskActionType,
    TaskActionStatus,
    TaskAttachment,
    HouseholdMember,
    ExternalProvider,
    RecurringTemplate,
    TaskStatus,
    TaskDomain,
    Priority,
    CalendarEvent,
)

from .database import DatabaseService


class TaskService:
    """
    Service for managing tasks and their lifecycle
    """
    
    def __init__(self):
        self.db = DatabaseService()
    
    async def create_task_from_parsed(
        self, 
        user_id: str, 
        parsed_task: ParsedTaskOutput
    ) -> Task:
        """
        Create a task from AI-parsed output
        """
        
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        # Calculate priority score
        priority_score = self._calculate_priority_score(
            domain=parsed_task.domain,
            priority_hint=parsed_task.priority_hint,
            due_date=parsed_task.due_date,
            estimated_duration=parsed_task.estimated_duration_min
        )
        
        # Create main task
        task = Task(
            id=task_id,
            user_id=user_id,
            title=parsed_task.title,
            description=parsed_task.description,
            domain=parsed_task.domain,
            status=TaskStatus.PARSED,
            priority=parsed_task.priority_hint,
            priority_score=priority_score,
            importance=self._map_priority_to_importance(parsed_task.priority_hint),
            urgency=self._calculate_urgency(parsed_task.due_date),
            due_date=parsed_task.due_date,
            estimated_duration_min=parsed_task.estimated_duration_min,
            created_at=now,
            updated_at=now,
            source="voice",
            requires_calendar_block=parsed_task.requires_calendar_block,
            ai_metadata={"parsed_from": "capture_agent", "context_notes": parsed_task.context_notes}
        )
        
        # Create subtasks if any
        subtasks = []
        for i, subtask_title in enumerate(parsed_task.subtasks):
            subtask = SubTask(
                id=str(uuid.uuid4()),
                task_id=task_id,
                title=subtask_title,
                status=TaskStatus.CAPTURED,
                order_index=i
            )
            subtasks.append(subtask)
        
        task.subtasks = subtasks
        
        # Save to database
        await self.db.save_task(task)
        
        return task
    
    async def create_task(
        self, 
        user_id: str, 
        task_data: TaskCreateRequest
    ) -> Task:
        """
        Create a task manually
        """
        
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        priority_score = self._calculate_priority_score(
            domain=task_data.domain,
            priority_hint=task_data.priority,
            due_date=task_data.due_date,
            estimated_duration=task_data.estimated_duration_min
        )
        
        task = Task(
            id=task_id,
            user_id=user_id,
            title=task_data.title,
            description=task_data.description,
            domain=task_data.domain,
            status=TaskStatus.TRIAGED,
            priority=task_data.priority,
            priority_score=priority_score,
            importance=self._map_priority_to_importance(task_data.priority),
            urgency=self._calculate_urgency(task_data.due_date),
            due_date=task_data.due_date,
            estimated_duration_min=task_data.estimated_duration_min,
            created_at=now,
            updated_at=now,
            source="manual",
            requires_calendar_block=task_data.requires_calendar_block
        )
        
        await self.db.save_task(task)
        return task
    
    async def create_task_from_calendar_event(
        self,
        user_id: str,
        event: CalendarEvent,
        domain: TaskDomain = TaskDomain.PERSONAL,
        priority: Priority = Priority.MEDIUM,
    ) -> Task:
        """
        Create a task based on a calendar event.
        
        This is used to import external (e.g. Google) events into the task system.
        """
        task_id = str(uuid.uuid4())
        now = datetime.now()

        # Use event duration as estimated duration if available
        duration_minutes: Optional[int] = None
        if event.start_time and event.end_time:
            duration_minutes = int((event.end_time - event.start_time).total_seconds() / 60)

        priority_score = self._calculate_priority_score(
            domain=domain,
            priority_hint=priority,
            due_date=event.start_time.date() if event.start_time else None,
            estimated_duration=duration_minutes,
        )

        task = Task(
            id=task_id,
            user_id=user_id,
            title=event.title,
            description=event.description,
            domain=domain,
            status=TaskStatus.TRIAGED,
            priority=priority,
            priority_score=priority_score,
            importance=self._map_priority_to_importance(priority),
            urgency=self._calculate_urgency(event.start_time.date() if event.start_time else None),
            due_date=event.start_time.date() if event.start_time else None,
            estimated_duration_min=duration_minutes,
            created_at=now,
            updated_at=now,
            source="calendar",
            requires_calendar_block=False,
            linked_calendar_event_id=str(event.id),
        )

        await self.db.save_task(task)
        return task
    
    async def get_task(self, task_id: str, user_id: str) -> Optional[Task]:
        """Get a specific task"""
        return await self.db.get_task(task_id, user_id)
    
    async def list_tasks(
        self, 
        user_id: str, 
        filters: TaskListRequest
    ) -> TaskListResponse:
        """List tasks with filtering and pagination"""
        
        tasks, total_count = await self.db.list_tasks(
            user_id=user_id,
            domain=filters.domain,
            status=filters.status,
            due_before=filters.due_before,
            priority=filters.priority,
            limit=filters.limit,
            offset=filters.offset
        )
        
        return TaskListResponse(
            tasks=tasks,
            total_count=total_count,
            has_more=(filters.offset + len(tasks)) < total_count
        )
    
    async def update_task(
        self, 
        task_id: str, 
        user_id: str, 
        updates: TaskUpdateRequest
    ) -> Optional[Task]:
        """Update a task"""
        
        task = await self.db.get_task(task_id, user_id)
        if not task:
            return None
        
        # Apply updates
        update_data = updates.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        # Recalculate priority score if relevant fields changed
        if any(field in update_data for field in ['priority', 'due_date', 'domain']):
            task.priority_score = self._calculate_priority_score(
                domain=task.domain,
                priority_hint=task.priority,
                due_date=task.due_date,
                estimated_duration=task.estimated_duration_min
            )
        
        task.updated_at = datetime.now()
        
        await self.db.update_task(task)
        return task
    
    async def delete_task(self, task_id: str, user_id: str) -> bool:
        """Delete a task"""
        return await self.db.delete_task(task_id, user_id)
    
    async def get_available_tasks(
        self,
        user_id: str,
        current_time: datetime,
        max_duration: Optional[int] = None
    ) -> List[Task]:
        """
        Get tasks that could be done now based on context
        """
        
        # Get tasks that are ready to work on
        tasks, _ = await self.db.list_tasks(
            user_id=user_id,
            status=TaskStatus.TRIAGED,  # Could also include PLANNED
            limit=100,
            offset=0
        )

        # Prefer tasks with due dates in the near / medium future.
        # We don't want to suggest things that are very far out unless
        # there is nothing more immediate to work on.
        today = current_time.date()
        NEAR_DAYS = 7      # due within a week
        FAR_FUTURE_DAYS = 30  # consider >30 days as "far future"

        near_tasks: List[Task] = []
        medium_tasks: List[Task] = []
        far_future_tasks: List[Task] = []

        for t in tasks:
            if t.due_date is None:
                # No due date: treat as medium term
                medium_tasks.append(t)
                continue

            days_until = (t.due_date - today).days
            if days_until <= NEAR_DAYS:
                near_tasks.append(t)
            elif days_until <= FAR_FUTURE_DAYS:
                medium_tasks.append(t)
            else:
                far_future_tasks.append(t)

        # Build the pool in priority order: near → medium → far future (only if needed)
        candidate_tasks: List[Task] = near_tasks or medium_tasks or far_future_tasks

        # Filter by duration if specified
        if max_duration:
            candidate_tasks = [
                t for t in candidate_tasks 
                if not t.estimated_duration_min or t.estimated_duration_min <= max_duration
            ]
        
        # Sort by urgency first, then priority score (both descending)
        candidate_tasks.sort(
            key=lambda t: (t.urgency, t.priority_score),
            reverse=True,
        )
        
        return candidate_tasks[:10]  # Return top 10 candidates
    
    async def attach_research_results(
        self, 
        task_id: str, 
        research_data: Any
    ) -> bool:
        """
        Attach research results to a task
        """
        
        task = await self.db.get_task_by_id(task_id)
        if not task:
            return False
        
        # Convert Pydantic models to plain dicts if needed
        if hasattr(research_data, "dict"):
            research_data = research_data.dict()

        # Add research data to ai_metadata
        if "research_results" not in task.ai_metadata:
            task.ai_metadata["research_results"] = []
        
        task.ai_metadata["research_results"].append({
            "timestamp": datetime.now().isoformat(),
            "data": research_data
        })
        
        task.updated_at = datetime.now()
        await self.db.update_task(task)
        
        return True
    
    # ── Task Actions ──────────────────────────────────────────────────
    async def add_actions_to_task(self, task_id: str, actions: List[TaskAction]) -> List[TaskAction]:
        """Save a list of actions for a task."""
        saved = []
        for action in actions:
            action.task_id = task_id
            action.id = action.id or str(uuid.uuid4())
            result = await self.db.save_task_action(action)
            saved.append(result)
        return saved

    async def get_task_actions(self, task_id: str) -> List[TaskAction]:
        return await self.db.get_task_actions(task_id)

    async def update_action(self, action_id: str, updates: dict) -> Optional[TaskAction]:
        action = await self.db.get_task_action(action_id)
        if not action:
            return None
        for k, v in updates.items():
            if hasattr(action, k):
                setattr(action, k, v)
        if updates.get("status") == TaskActionStatus.DONE.value or updates.get("status") == TaskActionStatus.DONE:
            action.status = TaskActionStatus.DONE
            action.completed_at = datetime.now()
        return await self.db.save_task_action(action)

    # ── Attachments ──────────────────────────────────────────────────
    async def add_attachment(self, attachment: TaskAttachment) -> TaskAttachment:
        return await self.db.save_task_attachment(attachment)

    async def get_task_attachments(self, task_id: str) -> List[TaskAttachment]:
        return await self.db.get_task_attachments(task_id)

    async def delete_attachment(self, attachment_id: str) -> bool:
        return await self.db.delete_task_attachment(attachment_id)

    # ── Household ────────────────────────────────────────────────────
    async def add_household_member(self, member: HouseholdMember) -> HouseholdMember:
        return await self.db.save_household_member(member)

    async def get_household_members(self, user_id: str) -> List[HouseholdMember]:
        return await self.db.get_household_members(user_id)

    async def delete_household_member(self, member_id: str) -> bool:
        return await self.db.delete_household_member(member_id)

    # ── Service Providers ────────────────────────────────────────────
    async def add_service_provider(self, provider: ExternalProvider) -> ExternalProvider:
        return await self.db.save_service_provider(provider)

    async def get_service_providers(self, user_id: str) -> List[ExternalProvider]:
        return await self.db.get_service_providers(user_id)

    async def delete_service_provider(self, provider_id: str) -> bool:
        return await self.db.delete_service_provider(provider_id)

    # ── Recurring Templates ──────────────────────────────────────────
    async def add_recurring_template(self, template: RecurringTemplate) -> RecurringTemplate:
        return await self.db.save_recurring_template(template)

    async def get_recurring_templates(self, user_id: str) -> List[RecurringTemplate]:
        return await self.db.get_recurring_templates(user_id)

    async def update_recurring_template(self, template_id: str, updates: dict) -> Optional[RecurringTemplate]:
        return await self.db.update_recurring_template(template_id, updates)

    # ── Pre-built Recurring Templates ────────────────────────────────
    def get_default_toddler_templates(self) -> list[dict]:
        """Return pre-built recurring template definitions for a family with toddlers."""
        return [
            {
                "title": "Weekly grocery run",
                "domain": "home",
                "frequency": "weekly",
                "default_actions": [
                    {"type": "checklist", "label": "Review meal plan for the week"},
                    {"type": "checklist", "label": "Check pantry and fridge for staples"},
                    {"type": "checklist", "label": "Add baby food and toddler snacks"},
                    {"type": "purchase", "label": "Shop for groceries", "metadata": {"estimated_price": "$100-150"}},
                ],
            },
            {
                "title": "Diaper & wipes restock check",
                "domain": "family",
                "frequency": "biweekly",
                "default_actions": [
                    {"type": "checklist", "label": "Count remaining diaper supply"},
                    {"type": "checklist", "label": "Check wipes, cream, and bags stock"},
                    {"type": "purchase", "label": "Order diapers and wipes if running low"},
                ],
            },
            {
                "title": "Pediatrician well-visit",
                "domain": "family",
                "frequency": "custom",
                "cron_expression": None,  # manually triggered per CDC schedule
                "default_actions": [
                    {"type": "book", "label": "Schedule pediatrician appointment", "metadata": {"provider_name": "Pediatrician"}},
                    {"type": "checklist", "label": "Prepare questions and concerns list"},
                    {"type": "checklist", "label": "Bring vaccination record"},
                    {"type": "schedule", "label": "Block calendar for appointment", "metadata": {"duration_min": 90}},
                ],
            },
            {
                "title": "House cleaning",
                "domain": "home",
                "frequency": "weekly",
                "default_actions": [
                    {"type": "delegate", "label": "Assign cleaning areas to household members"},
                    {"type": "checklist", "label": "Kitchen deep clean"},
                    {"type": "checklist", "label": "Bathrooms"},
                    {"type": "checklist", "label": "Vacuum and mop floors"},
                    {"type": "checklist", "label": "Laundry - wash, fold, put away"},
                ],
            },
            {
                "title": "Weekly meal prep",
                "domain": "home",
                "frequency": "weekly",
                "default_actions": [
                    {"type": "research", "label": "Find age-appropriate toddler meal ideas", "metadata": {"query": "easy toddler meals for the week"}},
                    {"type": "checklist", "label": "Prep and batch cook toddler meals"},
                    {"type": "checklist", "label": "Portion and label containers"},
                    {"type": "checklist", "label": "Prep adult lunches for the week"},
                ],
            },
            {
                "title": "Baby-proofing audit",
                "domain": "family",
                "frequency": "monthly",
                "default_actions": [
                    {"type": "checklist", "label": "Check all outlet covers are secure"},
                    {"type": "checklist", "label": "Test cabinet and drawer locks"},
                    {"type": "checklist", "label": "Verify baby gates are tight"},
                    {"type": "checklist", "label": "Move new hazards out of reach"},
                    {"type": "checklist", "label": "Check smoke and CO detectors"},
                ],
            },
            {
                "title": "Seasonal clothing size check",
                "domain": "family",
                "frequency": "monthly",
                "default_actions": [
                    {"type": "checklist", "label": "Try current clothes on each child"},
                    {"type": "research", "label": "Research next-size-up options", "metadata": {"query": "toddler clothing deals"}},
                    {"type": "purchase", "label": "Order new clothes if needed"},
                    {"type": "delegate", "label": "Sort and donate outgrown clothes"},
                ],
            },
            {
                "title": "Car seat safety check",
                "domain": "family",
                "frequency": "custom",
                "default_actions": [
                    {"type": "checklist", "label": "Check harness height and tightness"},
                    {"type": "checklist", "label": "Verify car seat is not expired"},
                    {"type": "checklist", "label": "Check for recalls on current model"},
                    {"type": "research", "label": "Research if child has outgrown current seat", "metadata": {"query": "car seat weight and height limits"}},
                ],
            },
        ]

    async def seed_default_templates(self, user_id: str) -> list[RecurringTemplate]:
        """Seed a user's account with pre-built toddler family templates."""
        templates_data = self.get_default_toddler_templates()
        created = []
        for tdata in templates_data:
            template = RecurringTemplate(
                user_id=user_id,
                title=tdata["title"],
                domain=TaskDomain(tdata["domain"]),
                frequency=tdata["frequency"],
                cron_expression=tdata.get("cron_expression"),
                default_actions=tdata.get("default_actions", []),
                active=True,
            )
            saved = await self.db.save_recurring_template(template)
            created.append(saved)
        return created

    # Priority calculation methods
    def _calculate_priority_score(
        self,
        domain: TaskDomain,
        priority_hint: Priority,
        due_date: Optional[date],
        estimated_duration: Optional[int]
    ) -> float:
        """
        Calculate priority score using the algorithm from the spec:
        score = w1*urgency + w2*importance + w3*effort_inverse + w4*domain_weight + w5*context_fit
        """
        
        # Base importance from priority hint
        importance = self._map_priority_to_importance(priority_hint)
        
        # Urgency based on due date
        urgency = self._calculate_urgency(due_date)
        
        # Effort inverse (shorter tasks get boost)
        effort_inverse = 1.0
        if estimated_duration:
            import math
            effort_inverse = 1.0 / math.log(estimated_duration + 1)
        
        # Domain weight (context-dependent, simplified for now)
        domain_weight = self._get_domain_weight(domain)
        
        # Context fit (simplified - would use time of day, location, etc.)
        context_fit = 1.0
        
        # Weights (can be tuned based on user feedback)
        w1, w2, w3, w4, w5 = 0.3, 0.4, 0.1, 0.15, 0.05
        
        score = (
            w1 * urgency + 
            w2 * importance + 
            w3 * effort_inverse + 
            w4 * domain_weight + 
            w5 * context_fit
        )
        
        return round(score, 2)
    
    def _map_priority_to_importance(self, priority: Priority) -> int:
        """Map Priority enum to importance score (1-5)"""
        mapping = {
            Priority.CRITICAL: 5,
            Priority.HIGH: 4,
            Priority.MEDIUM: 3,
            Priority.LOW: 2,
            Priority.SOMEDAY: 1
        }
        return mapping.get(priority, 3)
    
    def _calculate_urgency(self, due_date: Optional[date]) -> int:
        """Calculate urgency based on time to deadline"""
        if not due_date:
            return 2  # Medium urgency for tasks without deadlines
        
        days_until_due = (due_date - date.today()).days
        
        if days_until_due < 0:
            return 5  # Overdue
        elif days_until_due == 0:
            return 5  # Due today
        elif days_until_due == 1:
            return 4  # Due tomorrow
        elif days_until_due <= 3:
            return 3  # Due this week
        elif days_until_due <= 7:
            return 2  # Due next week
        else:
            return 1  # Due later
    
    def _get_domain_weight(self, domain: TaskDomain) -> float:
        """Get domain weight (would be context-aware in full implementation)"""
        weights = {
            TaskDomain.FAMILY: 1.0,
            TaskDomain.HOME: 0.8,
            TaskDomain.JOB: 0.9,
            TaskDomain.COMPANY: 0.9,
            TaskDomain.PERSONAL: 0.7
        }
        return weights.get(domain, 0.8)
