"""
Database Service - PostgreSQL database interface
Handles all database operations for the personal assistant system
"""

import asyncio
import json
from datetime import datetime, date
from typing import List, Optional, Tuple, Dict, Any
import asyncpg
import os
import sys

from shared.schemas import (
    Task, SubTask, User, Project, CalendarEvent,
    TaskStatus, TaskDomain, Priority
)


class DatabaseService:
    """
    PostgreSQL database service with connection pooling
    """
    
    _instance = None
    _pool = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseService, cls).__new__(cls)
        return cls._instance
    
    @classmethod
    async def initialize(cls):
        """Initialize database connection pool"""
        if cls._pool is None:
            database_url = os.getenv(
                "DATABASE_URL", 
                "postgresql://postgres:password@localhost:5432/personal_assistant"
            )
            
            cls._pool = await asyncpg.create_pool(
                database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            
            # Create tables if they don't exist
            await cls._create_tables()
    
    @classmethod
    async def close(cls):
        """Close database connection pool"""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
    
    @classmethod
    async def _create_tables(cls):
        """Create database tables"""
        
        create_tables_sql = """
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            time_zone VARCHAR(50) DEFAULT 'UTC',
            default_work_hours JSONB DEFAULT '{}',
            default_family_hours JSONB DEFAULT '{}',
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            domain VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'captured',
            priority VARCHAR(50) NOT NULL DEFAULT 'medium',
            priority_score DECIMAL(5,2) DEFAULT 0.0,
            importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
            urgency INTEGER DEFAULT 3 CHECK (urgency >= 1 AND urgency <= 5),
            due_date DATE,
            estimated_duration_min INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            source VARCHAR(50) DEFAULT 'manual',
            requires_calendar_block BOOLEAN DEFAULT FALSE,
            linked_calendar_event_id VARCHAR(255),
            linked_email_thread_id VARCHAR(255),
            ai_metadata JSONB DEFAULT '{}'
        );
        
        -- Subtasks table
        CREATE TABLE IF NOT EXISTS subtasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'captured',
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            domain VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Project-task relationships
        CREATE TABLE IF NOT EXISTS project_tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(project_id, task_id)
        );
        
        -- Calendar events cache
        CREATE TABLE IF NOT EXISTS events_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            source VARCHAR(50) NOT NULL,
            external_id VARCHAR(255),
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            location VARCHAR(255),
            is_all_day BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- AI interaction logs
        CREATE TABLE IF NOT EXISTS ai_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            agent_type VARCHAR(50) NOT NULL,
            input_payload JSONB,
            output_payload JSONB,
            execution_time_ms INTEGER,
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_domain ON tasks(domain);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority_score ON tasks(priority_score DESC);
        CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
        CREATE INDEX IF NOT EXISTS idx_events_user_id ON events_cache(user_id);
        CREATE INDEX IF NOT EXISTS idx_events_time_range ON events_cache(start_time, end_time);
        CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_logs_agent_type ON ai_logs(agent_type);
        """
        
        async with cls._pool.acquire() as conn:
            await conn.execute(create_tables_sql)
    
    # User operations
    async def create_user(self, user: User) -> User:
        """Create a new user"""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO users (name, email, time_zone, default_work_hours, default_family_hours, preferences)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            """, user.name, user.email, user.time_zone, 
                json.dumps(user.default_work_hours),
                json.dumps(user.default_family_hours),
                json.dumps(user.preferences)
            )
            
            return self._row_to_user(row)
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
            return self._row_to_user(row) if row else None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
            return self._row_to_user(row) if row else None
    
    # Task operations
    async def save_task(self, task: Task) -> Task:
        """Create or update a task"""
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                # Insert or update main task
                row = await conn.fetchrow("""
                    INSERT INTO tasks (
                        id, user_id, title, description, domain, status, priority,
                        priority_score, importance, urgency, due_date, estimated_duration_min,
                        source, requires_calendar_block, linked_calendar_event_id,
                        linked_email_thread_id, ai_metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        domain = EXCLUDED.domain,
                        status = EXCLUDED.status,
                        priority = EXCLUDED.priority,
                        priority_score = EXCLUDED.priority_score,
                        importance = EXCLUDED.importance,
                        urgency = EXCLUDED.urgency,
                        due_date = EXCLUDED.due_date,
                        estimated_duration_min = EXCLUDED.estimated_duration_min,
                        requires_calendar_block = EXCLUDED.requires_calendar_block,
                        linked_calendar_event_id = EXCLUDED.linked_calendar_event_id,
                        linked_email_thread_id = EXCLUDED.linked_email_thread_id,
                        ai_metadata = EXCLUDED.ai_metadata,
                        updated_at = NOW()
                    RETURNING *
                """, 
                    task.id, task.user_id, task.title, task.description, 
                    task.domain.value, task.status.value, task.priority.value,
                    task.priority_score, task.importance, task.urgency,
                    task.due_date, task.estimated_duration_min, task.source,
                    task.requires_calendar_block, task.linked_calendar_event_id,
                    task.linked_email_thread_id, json.dumps(task.ai_metadata)
                )
                
                # Handle subtasks
                if task.subtasks:
                    # Delete existing subtasks
                    await conn.execute("DELETE FROM subtasks WHERE task_id = $1", task.id)
                    
                    # Insert new subtasks
                    for subtask in task.subtasks:
                        await conn.execute("""
                            INSERT INTO subtasks (id, task_id, title, status, order_index)
                            VALUES ($1, $2, $3, $4, $5)
                        """, subtask.id, subtask.task_id, subtask.title, 
                            subtask.status.value, subtask.order_index)
                
                return self._row_to_task(row)
    
    async def get_task(self, task_id: str, user_id: str) -> Optional[Task]:
        """Get a specific task with subtasks"""
        async with self._pool.acquire() as conn:
            # Get main task
            task_row = await conn.fetchrow("""
                SELECT * FROM tasks WHERE id = $1 AND user_id = $2
            """, task_id, user_id)
            
            if not task_row:
                return None
            
            # Get subtasks
            subtask_rows = await conn.fetch("""
                SELECT * FROM subtasks WHERE task_id = $1 ORDER BY order_index
            """, task_id)
            
            task = self._row_to_task(task_row)
            task.subtasks = [self._row_to_subtask(row) for row in subtask_rows]
            
            return task
    
    async def get_task_by_id(self, task_id: str) -> Optional[Task]:
        """Get task by ID (without user check - for internal use)"""
        async with self._pool.acquire() as conn:
            task_row = await conn.fetchrow("SELECT * FROM tasks WHERE id = $1", task_id)
            if not task_row:
                return None
            
            subtask_rows = await conn.fetch("""
                SELECT * FROM subtasks WHERE task_id = $1 ORDER BY order_index
            """, task_id)
            
            task = self._row_to_task(task_row)
            task.subtasks = [self._row_to_subtask(row) for row in subtask_rows]
            
            return task
    
    async def list_tasks(
        self,
        user_id: str,
        domain: Optional[TaskDomain] = None,
        status: Optional[TaskStatus] = None,
        due_before: Optional[date] = None,
        priority: Optional[Priority] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Task], int]:
        """List tasks with filtering"""
        
        # Build WHERE clause
        where_conditions = ["user_id = $1"]
        params = [user_id]
        param_count = 1
        
        if domain:
            param_count += 1
            where_conditions.append(f"domain = ${param_count}")
            params.append(domain.value)
        
        if status:
            param_count += 1
            where_conditions.append(f"status = ${param_count}")
            params.append(status.value)
        
        if due_before:
            param_count += 1
            where_conditions.append(f"due_date <= ${param_count}")
            params.append(due_before)
        
        if priority:
            param_count += 1
            where_conditions.append(f"priority = ${param_count}")
            params.append(priority.value)
        
        where_clause = " AND ".join(where_conditions)
        
        async with self._pool.acquire() as conn:
            # Get total count
            count_query = f"SELECT COUNT(*) FROM tasks WHERE {where_clause}"
            total_count = await conn.fetchval(count_query, *params)
            
            # Get tasks
            tasks_query = f"""
                SELECT * FROM tasks 
                WHERE {where_clause}
                ORDER BY priority_score DESC, created_at DESC
                LIMIT ${param_count + 1} OFFSET ${param_count + 2}
            """
            params.extend([limit, offset])
            
            task_rows = await conn.fetch(tasks_query, *params)
            
            # Get subtasks for all tasks
            task_ids = [str(row['id']) for row in task_rows]
            subtasks = {}
            
            if task_ids:
                subtask_rows = await conn.fetch("""
                    SELECT * FROM subtasks 
                    WHERE task_id = ANY($1::uuid[])
                    ORDER BY task_id, order_index
                """, task_ids)
                
                for row in subtask_rows:
                    task_id = str(row['task_id'])
                    if task_id not in subtasks:
                        subtasks[task_id] = []
                    subtasks[task_id].append(self._row_to_subtask(row))
            
            # Build task objects
            tasks = []
            for row in task_rows:
                task = self._row_to_task(row)
                task.subtasks = subtasks.get(str(row['id']), [])
                tasks.append(task)
            
            return tasks, total_count
    
    async def update_task(self, task: Task) -> Task:
        """Update an existing task"""
        return await self.save_task(task)
    
    async def delete_task(self, task_id: str, user_id: str) -> bool:
        """Delete a task"""
        async with self._pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM tasks WHERE id = $1 AND user_id = $2
            """, task_id, user_id)
            
            return result.split()[-1] == "1"  # Check if one row was deleted
    
    # Calendar operations
    async def save_calendar_event(self, event: CalendarEvent) -> CalendarEvent:
        """Save a calendar event to cache"""
        async with self._pool.acquire() as conn:
            # Note: For simplicity we avoid ON CONFLICT here since there is no
            # unique constraint on (user_id, source, external_id) yet.
            # In production, you'd add a UNIQUE constraint and use upsert.
            row = await conn.fetchrow("""
                INSERT INTO events_cache (
                    user_id, source, external_id, start_time, end_time,
                    title, description, location, is_all_day
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            """, event.user_id, event.source, event.external_id,
                event.start_time, event.end_time, event.title,
                event.description, event.location, event.is_all_day)
            
            return self._row_to_calendar_event(row)
    
    async def get_calendar_events(
        self,
        user_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[CalendarEvent]:
        """Get calendar events in time range"""
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM events_cache
                WHERE user_id = $1 
                AND start_time <= $3 
                AND end_time >= $2
                ORDER BY start_time
            """, user_id, start_time, end_time)
            
            return [self._row_to_calendar_event(row) for row in rows]
    
    async def get_calendar_event(
        self,
        user_id: str,
        event_id: str
    ) -> Optional[CalendarEvent]:
        """Get a single calendar event by ID"""
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM events_cache
                WHERE id = $1 AND user_id = $2
            """, event_id, user_id)
            return self._row_to_calendar_event(row) if row else None
    
    # AI logging
    async def log_ai_interaction(
        self,
        user_id: str,
        agent_type: str,
        input_payload: Dict[str, Any],
        output_payload: Dict[str, Any],
        execution_time_ms: int,
        error: Optional[str] = None
    ):
        """Log AI agent interaction"""
        async with self._pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO ai_logs (
                    user_id, agent_type, input_payload, output_payload,
                    execution_time_ms, error
                ) VALUES ($1, $2, $3, $4, $5, $6)
            """, user_id, agent_type, 
                json.dumps(input_payload),
                json.dumps(output_payload),
                execution_time_ms, error)
    
    # Helper methods for row conversion
    def _row_to_user(self, row) -> User:
        """Convert database row to User object"""
        # asyncpg may return JSONB fields as strings; ensure we always pass dicts to Pydantic
        def _ensure_dict(value):
            if value is None:
                return {}
            if isinstance(value, dict):
                return value
            try:
                return json.loads(value)
            except Exception:
                # Fallback to empty dict if parsing fails
                return {}

        return User(
            id=str(row['id']),
            name=row['name'],
            email=row['email'],
            time_zone=row['time_zone'],
            default_work_hours=_ensure_dict(row['default_work_hours']),
            default_family_hours=_ensure_dict(row['default_family_hours']),
            preferences=_ensure_dict(row['preferences'])
        )
    
    def _row_to_task(self, row) -> Task:
        """Convert database row to Task object"""
        # Ensure JSONB fields are proper Python structures
        def _ensure_dict(value):
            if value is None:
                return {}
            if isinstance(value, dict):
                return value
            try:
                return json.loads(value)
            except Exception:
                return {}

        return Task(
            id=str(row['id']),
            user_id=str(row['user_id']),
            title=row['title'],
            description=row['description'],
            domain=TaskDomain(row['domain']),
            status=TaskStatus(row['status']),
            priority=Priority(row['priority']),
            priority_score=float(row['priority_score']),
            importance=row['importance'],
            urgency=row['urgency'],
            due_date=row['due_date'],
            estimated_duration_min=row['estimated_duration_min'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            source=row['source'],
            requires_calendar_block=row['requires_calendar_block'],
            linked_calendar_event_id=row['linked_calendar_event_id'],
            linked_email_thread_id=row['linked_email_thread_id'],
            ai_metadata=_ensure_dict(row['ai_metadata']),
            subtasks=[]  # Will be populated separately
        )
    
    def _row_to_subtask(self, row) -> SubTask:
        """Convert database row to SubTask object"""
        return SubTask(
            id=str(row['id']),
            task_id=str(row['task_id']),
            title=row['title'],
            status=TaskStatus(row['status']),
            order_index=row['order_index']
        )
    
    def _row_to_calendar_event(self, row) -> CalendarEvent:
        """Convert database row to CalendarEvent object"""
        return CalendarEvent(
            id=str(row['id']),
            user_id=str(row['user_id']),
            source=row['source'],
            external_id=row['external_id'],
            start_time=row['start_time'],
            end_time=row['end_time'],
            title=row['title'],
            description=row['description'],
            location=row['location'],
            is_all_day=row['is_all_day']
        )
