"""
Calendar Service
Handles calendar integration (Google Calendar, Outlook)
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import sys
import os

from shared.schemas import CalendarEvent, Task
from .database import DatabaseService
from .google_calendar_client import GoogleCalendarClient


class CalendarService:
    """
    Calendar integration service
    Handles reading external calendars and creating task blocks
    """
    
    def __init__(self):
        self.db = DatabaseService()
        self.google_client = GoogleCalendarClient()
    
    async def get_events(
        self, 
        user_id: str, 
        start_date: str, 
        end_date: str
    ) -> List[CalendarEvent]:
        """Get calendar events for date range"""
        
        start_time = datetime.fromisoformat(start_date)
        end_time = datetime.fromisoformat(end_date)
        
        return await self.db.get_calendar_events(user_id, start_time, end_time)
    
    async def get_event(
        self,
        user_id: str,
        event_id: str
    ) -> Optional[CalendarEvent]:
        """Get a single calendar event by ID"""
        return await self.db.get_calendar_event(user_id, event_id)
    
    async def sync_external_calendars(self, user_id: str):
        """Sync events from external calendar providers"""
        
        # If Google Calendar is configured, sync from it. Otherwise no-op.
        if self.google_client.is_configured():
            now = datetime.utcnow()
            window_end = now + timedelta(days=7)

            external_events = self.google_client.fetch_events(
                time_min=now,
                time_max=window_end,
            )

            for event in external_events:
                # Attach the current user ID before saving
                event.user_id = user_id
                await self.db.save_calendar_event(event)
    
    async def create_task_block(
        self,
        user_id: str,
        task_id: str,
        start_time: datetime,
        end_time: datetime,
        title_override: Optional[str] = None
    ) -> CalendarEvent:
        """Create a calendar block for a task"""
        
        # Get the task to build event details
        task = await self.db.get_task_by_id(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # Create calendar event
        event = CalendarEvent(
            user_id=user_id,
            source="personal_assistant",
            external_id=f"task_{task_id}",
            start_time=start_time,
            end_time=end_time,
            title=title_override or f"Task: {task.title}",
            description=f"Scheduled work time for: {task.title}\n\n{task.description or ''}"
        )
        
        # Save event to local cache
        saved_event = await self.db.save_calendar_event(event)
        
        # Update task with calendar link
        task.linked_calendar_event_id = saved_event.id
        await self.db.update_task(task)
        
        # Also create event in external Google Calendar (if configured)
        if self.google_client.is_configured():
            self.google_client.create_event(saved_event)
        
        return saved_event
    
    async def find_available_slots(
        self,
        user_id: str,
        duration_minutes: int,
        start_date: datetime,
        end_date: datetime,
        work_hours_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Find available time slots for scheduling"""
        
        # Get existing events in the time range
        existing_events = await self.db.get_calendar_events(
            user_id, start_date, end_date
        )
        
        # TODO: Implement smart slot finding algorithm
        # This would:
        # 1. Generate potential slots based on duration
        # 2. Filter out conflicts with existing events
        # 3. Consider work hours if specified
        # 4. Rank slots by preference (focus time, energy levels, etc.)
        
        # For now, return some sample slots
        slots = []
        current_time = start_date
        
        while current_time < end_date:
            # Skip weekends if work_hours_only
            if work_hours_only and current_time.weekday() >= 5:
                current_time += timedelta(days=1)
                continue
            
            # Check if slot conflicts with existing events
            slot_end = current_time + timedelta(minutes=duration_minutes)
            conflicts = any(
                event.start_time < slot_end and event.end_time > current_time
                for event in existing_events
            )
            
            if not conflicts:
                slots.append({
                    "start": current_time,
                    "end": slot_end,
                    "confidence": 0.8,  # Would be calculated based on various factors
                    "reason": "Available slot with no conflicts"
                })
            
            # Move to next potential slot (30 min intervals)
            current_time += timedelta(minutes=30)
            
            # Limit number of suggestions
            if len(slots) >= 10:
                break
        
        return slots
    
    async def reschedule_task_block(
        self,
        task_id: str,
        new_start_time: datetime,
        new_end_time: datetime
    ) -> bool:
        """Reschedule an existing task block"""
        
        task = await self.db.get_task_by_id(task_id)
        if not task or not task.linked_calendar_event_id:
            return False
        
        # Update the calendar event time
        # TODO: Implement actual calendar event update
        
        return True
    
    async def get_calendar_context(self, user_id: str) -> Dict[str, Any]:
        """Get calendar context for AI planning"""
        
        # Get events for next 7 days
        start_time = datetime.now()
        end_time = start_time + timedelta(days=7)
        
        events = await self.db.get_calendar_events(user_id, start_time, end_time)
        
        # Analyze patterns and availability
        busy_periods = []
        for event in events:
            busy_periods.append({
                "start": event.start_time.isoformat(),
                "end": event.end_time.isoformat(),
                "title": event.title
            })
        
        # Find available slots
        available_slots = await self.find_available_slots(
            user_id, 60, start_time, end_time
        )
        
        return {
            "upcoming_events": [
                {
                    "title": event.title,
                    "start": event.start_time.isoformat(),
                    "end": event.end_time.isoformat(),
                    "location": event.location
                }
                for event in events[:10]  # Next 10 events
            ],
            "busy_periods": busy_periods,
            "available_slots": available_slots[:5],  # Top 5 available slots
            "work_hours": {"start": "09:00", "end": "18:00"},  # Would come from user profile
            "preferred_focus_times": ["10:00-12:00", "14:00-16:00"]  # Would be learned
        }
