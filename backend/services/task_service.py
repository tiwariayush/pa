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
        
        # Filter by duration if specified
        if max_duration:
            tasks = [
                t for t in tasks 
                if not t.estimated_duration_min or t.estimated_duration_min <= max_duration
            ]
        
        # Sort by priority score (descending)
        tasks.sort(key=lambda t: t.priority_score, reverse=True)
        
        return tasks[:10]  # Return top 10 candidates
    
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
