"""
AI Orchestrator - Central coordination for all AI agents
Manages the multi-agent system for capture, planning, email, and research
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import sys
import os

from shared.schemas import (
    VoiceCaptureRequest, CaptureAgentOutput, ParsedTaskOutput,
    PlanningAgentOutput, SchedulingProposal, TimeSlot,
    WhatNowRequest, WhatNowResponse,
    EmailDraftRequest, EmailDraftResponse,
    ResearchRequest, ResearchResponse, ResearchOption,
    DailyPlanResponse, DailyPlanItem,
    WorkflowAgentOutput,
    TaskAction, TaskActionType, TaskActionStatus,
    HouseholdMember,
    Task, User, TaskDomain, Priority, TaskStatus,
    TaskListRequest,
)

from .llm_client import LLMClient
from .stt_service import STTService


class AIOrchestrator:
    """
    Central AI orchestrator that coordinates multiple specialized agents
    """
    
    def __init__(self):
        self.llm_client = LLMClient()
        self.stt_service = STTService()
    
    async def process_voice_capture(
        self, 
        request: VoiceCaptureRequest, 
        user: User
    ) -> CaptureAgentOutput:
        """
        Main voice capture flow:
        1. Convert audio to text (if needed)
        2. Parse with Capture Agent
        3. Return structured tasks
        """
        
        # Step 1: Get transcript
        if request.transcript:
            transcript = request.transcript
        elif request.audio_data:
            transcript = await self.stt_service.transcribe(request.audio_data)
        else:
            raise ValueError("Either transcript or audio_data must be provided")
        
        # Step 2: Parse with Capture Agent
        capture_input = {
            "transcript": transcript,
            "user_profile": user.dict(),
            "timestamp": datetime.now().isoformat(),
            "location": request.location,
            "context": request.context
        }
        
        result = await self._call_capture_agent(capture_input)
        # Attach transcript so downstream consumers (e.g., mobile app) can display it
        result.transcript = transcript
        return result
    
    async def generate_schedule_proposals(
        self,
        tasks: List[Task],
        user_id: str
    ) -> PlanningAgentOutput:
        """
        Use Planning Agent to suggest calendar slots for tasks
        """
        
        # Get user's calendar context (would fetch from calendar service)
        calendar_context = await self._get_calendar_context(user_id)
        
        planning_input = {
            "tasks": [task.dict() for task in tasks],
            "calendar_context": calendar_context,
            "user_preferences": {}  # Would get from user profile
        }
        
        result = await self._call_planning_agent(planning_input)
        return result
    
    async def generate_what_now_recommendations(
        self,
        request: WhatNowRequest,
        available_tasks: List[Task],
        user: User
    ) -> WhatNowResponse:
        """
        Generate contextual "what now" recommendations
        """
        
        recommendation_input = {
            "current_time": request.current_time.isoformat(),
            "available_duration_min": request.available_duration_min,
            "energy_level": request.energy_level,
            "location": request.location,
            "available_tasks": [task.dict() for task in available_tasks],
            "user_profile": user.dict()
        }
        
        result = await self._call_recommendation_agent(recommendation_input)
        return result
    
    async def generate_email_draft(
        self,
        task: Task,
        request: EmailDraftRequest,
        email_context: Optional[Dict],
        user: User
    ) -> EmailDraftResponse:
        """
        Generate email draft using Email Agent
        """
        
        email_input = {
            "task": task.dict(),
            "recipient_hint": request.recipient_hint,
            "context": request.context,
            "tone": request.tone,
            "email_context": email_context,
            "user_profile": user.dict()
        }
        
        result = await self._call_email_agent(email_input)
        return result
    
    async def perform_research(
        self,
        task: Task,
        request: ResearchRequest,
        user: User
    ) -> ResearchResponse:
        """
        Perform research using Research Agent
        """
        
        research_input = {
            "task": task.dict(),
            "query": request.query,
            "research_type": request.research_type,
            "location": request.location,
            "budget_range": request.budget_range,
            "user_profile": user.dict()
        }
        
        result = await self._call_research_agent(research_input)
        return result
    
    # ── Workflow Agent ──────────────────────────────────────────────────
    async def decompose_task_into_actions(
        self,
        task: Task,
        user: User,
        household_members: Optional[List[HouseholdMember]] = None,
    ) -> List[TaskAction]:
        """
        WorkflowAgent: Decompose a task into a pipeline of typed actions.
        Called after capture to enrich each task with an action plan.
        """
        members_info = ""
        if household_members:
            members_info = "\n".join(
                f"- {m.name} (role: {m.role}, skills: {', '.join(m.skills)}, external: {m.is_external})"
                for m in household_members
            )

        system_prompt = """You are a Workflow Decomposition Agent for a house manager system.
        Your job is to take a task and break it into concrete, typed action steps.

        Available action types (use the exact string values):
        - "research"   : Search the internet, compare options, gather information
        - "purchase"   : Buy an item (include product_name, estimated price)
        - "email"      : Draft or send an email (include to, subject hint)
        - "call"       : Make a phone call (include who, phone if known)
        - "book"       : Book an appointment (include provider_name, preferred_times)
        - "delegate"   : Assign to a household member (include assigned_to name)
        - "schedule"   : Block time on the calendar (include duration_min)
        - "remind"     : Set a reminder (include remind_at hint)
        - "track"      : Track delivery or progress
        - "decide"     : Present options for a decision (requires research first)
        - "photo"      : Take or attach a photo for context
        - "checklist"  : Simple checkbox item

        Rules:
        1. Order actions logically (research before decide, decide before purchase)
        2. For complex tasks, use 3-8 actions. For simple tasks, 1-3 actions.
        3. If household members are available, suggest delegation where appropriate.
        4. Include a "label" that is a clear, concise description of the step.
        5. Put delegation suggestions in the "assigned_to" field.
        6. Use metadata to include type-specific details (query for research, product info for purchase, etc.)

        Return a JSON object with "actions" array and "reasoning" string."""

        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        user_prompt = f"""
        Decompose this task into action steps:

        Task: {task.title}
        Description: {task.description or 'N/A'}
        Domain: {task.domain.value}
        Priority: {task.priority.value}
        Due date: {task.due_date or 'None'}
        Estimated duration: {task.estimated_duration_min or 'Unknown'} min

        User profile: {_dumps(user.dict())}

        Household members available for delegation:
        {members_info or 'None configured'}

        Create a logical sequence of typed action steps.
        """

        try:
            response = await self.llm_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=WorkflowAgentOutput,
            )
            # Ensure each action gets the correct task_id
            for i, action in enumerate(response.actions):
                action.task_id = task.id
                action.order_index = i
            return response.actions
        except Exception as e:
            print(f"[WorkflowAgent] LLM failed, using fallback: {e}")
            return self._fallback_workflow_actions(task)

    def _fallback_workflow_actions(self, task: Task) -> List[TaskAction]:
        """Deterministic fallback when LLM is unavailable."""
        actions = []
        idx = 0

        # Always start with a research step for non-trivial tasks
        if task.estimated_duration_min and task.estimated_duration_min > 15:
            actions.append(TaskAction(
                task_id=task.id,
                type=TaskActionType.RESEARCH,
                label=f"Research: {task.title}",
                order_index=idx,
                metadata={"query": task.title},
            ))
            idx += 1

        # Home/Family domain often involves purchasing
        if task.domain in (TaskDomain.HOME, TaskDomain.FAMILY):
            actions.append(TaskAction(
                task_id=task.id,
                type=TaskActionType.CHECKLIST,
                label=f"Plan approach for: {task.title}",
                order_index=idx,
            ))
            idx += 1

        # If calendar-worthy, add a schedule action
        if task.requires_calendar_block:
            actions.append(TaskAction(
                task_id=task.id,
                type=TaskActionType.SCHEDULE,
                label=f"Block time for: {task.title}",
                order_index=idx,
                metadata={"duration_min": task.estimated_duration_min or 30},
            ))
            idx += 1

        # Always end with a completion checklist
        actions.append(TaskAction(
            task_id=task.id,
            type=TaskActionType.CHECKLIST,
            label=f"Complete: {task.title}",
            order_index=idx,
        ))

        return actions

    # ── Delegation Engine ─────────────────────────────────────────────
    def suggest_delegation(
        self,
        task: Task,
        actions: List[TaskAction],
        household_members: List[HouseholdMember],
    ) -> List[TaskAction]:
        """
        Enrich actions with delegation suggestions based on skill matching.
        This is a deterministic pass that runs after the WorkflowAgent.
        """
        if not household_members:
            return actions

        # Build skill lookup
        members_by_skill: Dict[str, List[str]] = {}
        for m in household_members:
            for skill in m.skills:
                members_by_skill.setdefault(skill.lower(), []).append(m.name)

        # Domain -> likely skills mapping
        domain_skills = {
            TaskDomain.FAMILY: ["childcare", "medical", "cooking"],
            TaskDomain.HOME: ["handyman", "cleaning", "cooking", "errands"],
            TaskDomain.JOB: ["tech", "admin"],
            TaskDomain.COMPANY: ["tech", "admin", "finance"],
            TaskDomain.PERSONAL: ["errands"],
        }

        # Action type -> likely skills
        action_skills = {
            TaskActionType.PURCHASE: ["errands", "shopping"],
            TaskActionType.CALL: ["admin", "medical"],
            TaskActionType.BOOK: ["admin", "medical"],
            TaskActionType.SCHEDULE: [],
            TaskActionType.RESEARCH: ["tech"],
        }

        relevant_skills = domain_skills.get(task.domain, [])

        for action in actions:
            if action.assigned_to:
                continue  # Already assigned by LLM

            type_skills = action_skills.get(action.type, [])
            all_skills = relevant_skills + type_skills

            # Find best match
            for skill in all_skills:
                candidates = members_by_skill.get(skill.lower(), [])
                if candidates:
                    action.assigned_to = candidates[0]
                    break

        return actions

    # ── Web Search (placeholder for SerpAPI/Brave) ────────────────────
    async def web_search(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a web search and return results with images.
        Currently uses LLM to simulate results.
        In production, integrate SerpAPI or Brave Search API:
          SERP_API_KEY = os.getenv("SERP_API_KEY")
        """
        # TODO: Replace with real API call when SERP_API_KEY is configured
        serp_key = os.getenv("SERP_API_KEY")
        if serp_key:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        "https://serpapi.com/search",
                        params={
                            "q": query,
                            "api_key": serp_key,
                            "num": num_results,
                            "engine": "google",
                        },
                        timeout=15,
                    )
                    data = resp.json()
                    results = []
                    for item in data.get("organic_results", [])[:num_results]:
                        results.append({
                            "title": item.get("title", ""),
                            "snippet": item.get("snippet", ""),
                            "url": item.get("link", ""),
                            "image_url": item.get("thumbnail", ""),
                        })
                    # Also grab shopping results if available
                    for item in data.get("shopping_results", [])[:3]:
                        results.append({
                            "title": item.get("title", ""),
                            "snippet": item.get("source", ""),
                            "url": item.get("link", ""),
                            "image_url": item.get("thumbnail", ""),
                            "price": item.get("price", ""),
                            "rating": item.get("rating"),
                        })
                    return results
            except Exception as e:
                print(f"[WebSearch] SerpAPI failed: {e}, falling back to LLM")

        # Fallback: return empty (the research agent LLM will generate results)
        return []

    # Agent-specific methods
    async def _call_capture_agent(self, input_data: Dict) -> CaptureAgentOutput:
        """
        Capture Agent: Parse natural language into structured tasks
        """
        
        system_prompt = """You are a Capture Agent for a personal assistant system. 
        Your job is to parse natural language input into structured tasks.
        
        The user is a busy professional with a family (including a baby), running their own company alongside a regular job.
        
        Key principles:
        1. Extract discrete, actionable tasks from natural speech
        2. Infer appropriate domains: family, home, job, company, personal
        3. Estimate realistic durations and identify calendar-worthy tasks
        4. Break down complex requests into subtasks when appropriate
        5. Preserve the user's intent and urgency
        
        Return a JSON object matching the CaptureAgentOutput schema."""
        
        user_prompt = f"""
        Parse this voice input into structured tasks:
        
        Transcript: "{input_data['transcript']}"
        
        Context:
        - Current time: {input_data['timestamp']}
        - Location: {input_data.get('location', 'unknown')}
        - User profile: {json.dumps(input_data['user_profile'], indent=2)}
        
        Focus on:
        1. Identifying separate tasks/actions
        2. Assigning appropriate domains (family/home/job/company/personal)
        3. Estimating time requirements
        4. Determining if calendar blocking is needed
        5. Breaking complex tasks into subtasks
        
        Return structured JSON with tasks array, summary, and confidence score.
        """
        
        response = await self.llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=CaptureAgentOutput
        )
        
        return response
    
    async def _call_planning_agent(self, input_data: Dict) -> PlanningAgentOutput:
        """
        Planning Agent: Suggest calendar slots for tasks
        """
        
        system_prompt = """You are a Planning Agent for a personal assistant system.
        Your job is to suggest optimal calendar time slots for tasks that require focused time.
        
        Consider:
        1. User's existing calendar commitments
        2. Task duration and complexity
        3. Domain-appropriate time slots (work tasks during work hours, family tasks during family time)
        4. Energy levels throughout the day
        5. Buffer time between meetings
        
        Return scheduling proposals with reasoning."""
        
        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        user_prompt = f"""
        Plan calendar slots for these tasks:
        
        Tasks: {_dumps(input_data['tasks'])}
        
        Calendar context: {_dumps(input_data['calendar_context'])}
        
        For each task that requires_calendar_block=true, propose 2-3 optimal time slots with reasoning.
        Consider the user's work/family schedule patterns.
        """
        
        response = await self.llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=PlanningAgentOutput
        )
        
        return response
    
    async def _call_recommendation_agent(self, input_data: Dict) -> WhatNowResponse:
        """
        Recommendation Agent: "What should I do now?" suggestions
        """
        system_prompt = """You are a Recommendation Agent for a personal assistant system.
        Your job is to suggest the best tasks to do right now based on context.
        
        Consider:
        1. Available time until next commitment
        2. Current energy level and location
        3. Task priorities and deadlines
        4. Context switching costs
        5. Time of day appropriateness
        6. If the user has household_members, suggest delegation when appropriate
           (e.g. "This might be better suited for [member name]")
        
        Provide 3-5 concrete recommendations with clear reasoning.
        Include delegation hints in the reason field when applicable."""

        # Helper to safely JSON-encode objects that may contain datetimes
        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        user_prompt = f"""
        Recommend what the user should do now:
        
        Current context:
        - Time: {input_data['current_time']}
        - Available duration: {input_data['available_duration_min']} minutes
        - Energy level: {input_data['energy_level']}
        - Location: {input_data['location']}
        
        Available tasks: {_dumps(input_data['available_tasks'])}
        
        User profile: {_dumps(input_data['user_profile'])}
        
        Suggest 3-5 tasks ranked by appropriateness for this moment.
        Include estimated time and reasoning for each recommendation.
        """

        try:
            response = await self.llm_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=WhatNowResponse
            )
            return response
        except Exception as e:
            # Fallback: deterministic recommendation logic without LLM
            tasks = input_data.get("available_tasks", [])
            # Sort by priority_score if available, otherwise keep order
            tasks_sorted = sorted(
                tasks,
                key=lambda t: t.get("priority_score", 0),
                reverse=True,
            )
            top = tasks_sorted[:3]

            recommendations = []
            for t in top:
                recommendations.append(
                    {
                        "task": t,
                        "reason": "High priority and fits your current context.",
                        "estimatedTime": t.get("estimated_duration_min") or 30,
                        "confidence": 0.7,
                    }
                )

            return WhatNowResponse(
                recommendations=recommendations,
                reasoning="Used simple priority-based ranking fallback because the LLM recommendation agent was unavailable or returned invalid output.",
                context_summary=f"Time: {input_data.get('current_time')}, "
                f"available_duration_min: {input_data.get('available_duration_min')}, "
                f"energy_level: {input_data.get('energy_level')}, "
                f"location: {input_data.get('location')}",
            )
    
    async def _call_email_agent(self, input_data: Dict) -> EmailDraftResponse:
        """
        Email Agent: Draft emails for tasks
        """
        
        system_prompt = """You are an Email Agent for a personal assistant system.
        Your job is to draft professional, contextual emails based on tasks and conversation history.
        
        Key principles:
        1. Match the user's communication style and tone
        2. Be concise but complete
        3. Include relevant context and next steps
        4. Maintain professionalism while being personable
        5. Suggest appropriate recipients when possible
        
        Return a well-structured email draft."""
        
        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        user_prompt = f"""
        Draft an email for this task:
        
        Task: {_dumps(input_data['task'])}
        
        Email context: {_dumps(input_data.get('email_context'))}
        
        Requirements:
        - Recipient hint: {input_data.get('recipient_hint')}
        - Tone: {input_data['tone']}
        - Additional context: {input_data.get('context')}
        
        User profile: {_dumps(input_data['user_profile'])}
        
        Create a professional email that accomplishes the task goal.
        Include subject line and suggest recipients if possible.
        """
        
        response = await self.llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=EmailDraftResponse
        )
        
        return response
    
    async def _call_research_agent(self, input_data: Dict) -> ResearchResponse:
        """
        Research Agent: Perform research with web search integration and image URLs.
        """

        # Attempt real web search first
        query = input_data.get("query", "")
        web_results = await self.web_search(query)
        web_context = ""
        if web_results:
            web_context = "\n\nReal web search results to incorporate:\n" + json.dumps(web_results[:8], indent=2)

        system_prompt = f"""You are a Research Agent for a house manager / personal assistant system.
        Your job is to research options and provide structured recommendations.

        For each research request:
        1. Find 3-5 relevant options
        2. Analyze pros/cons objectively
        3. Consider user's context (location, budget, preferences, family with young children)
        4. Provide a clear recommendation with reasoning
        5. Include actionable next steps
        6. IMPORTANT: For each option, include an image_url field with a real product
           image URL when possible. Use URLs from the web search results if provided.

        Focus on practical, actionable information for a family with toddlers."""

        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        user_prompt = f"""
        Research request for this task:

        Task: {_dumps(input_data['task'])}

        Research query: {input_data['query']}
        Research type: {input_data['research_type']}
        Location: {input_data.get('location')}
        Budget range: {input_data.get('budget_range')}

        User profile: {_dumps(input_data['user_profile'])}
        {web_context}

        Find and analyze options. Provide structured comparison with pros/cons.
        Include pricing, ratings, image URLs, and a clear recommendation.
        """

        response = await self.llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=ResearchResponse
        )

        return response
    
    async def generate_daily_plan(
        self,
        user: User,
        task_service,
    ) -> DailyPlanResponse:
        """
        Generate a daily plan considering today's calendar, open tasks,
        estimated durations, and priority scores.
        """
        # Get open tasks
        all_tasks_resp = await task_service.list_tasks(
            user_id=user.id,
            filters=TaskListRequest(limit=100)
        )
        open_tasks = [
            t for t in all_tasks_resp.tasks
            if t.status not in (TaskStatus.DONE, TaskStatus.CANCELLED)
        ]

        # Get calendar context
        calendar_context = await self._get_calendar_context(user.id)

        def _dumps(obj):
            return json.dumps(obj, indent=2, default=str)

        system_prompt = """You are a Daily Planning Agent for a personal assistant system.
        Your job is to create an optimized daily schedule from the user's open tasks.
        
        Consider:
        1. Task priority scores and deadlines (overdue tasks go first)
        2. Estimated duration for each task
        3. Existing calendar commitments (avoid conflicts)
        4. Energy patterns: high-effort tasks in morning, lighter tasks afternoon
        5. Include breaks between focused work sessions
        6. Be realistic about what fits in one day
        
        Return a structured daily plan with suggested times and reasoning."""

        user_prompt = f"""
        Create a daily plan for today ({datetime.now().strftime('%A, %B %d, %Y')}).
        
        Open tasks: {_dumps([t.dict() for t in open_tasks[:20]])}
        
        Calendar context: {_dumps(calendar_context)}
        
        User profile: {_dumps(user.dict())}
        
        Pick the most important 5-8 tasks that fit today.
        Assign realistic time slots and provide brief reasoning.
        """

        try:
            response = await self.llm_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_schema=DailyPlanResponse,
            )
            return response
        except Exception:
            # Fallback: simple priority-based plan
            sorted_tasks = sorted(
                open_tasks,
                key=lambda t: t.priority_score,
                reverse=True,
            )[:6]

            plan_items = []
            hour = 9
            for t in sorted_tasks:
                duration = t.estimated_duration_min or 30
                plan_items.append(DailyPlanItem(
                    task_id=t.id or "",
                    task_title=t.title,
                    suggested_time=f"{datetime.now().strftime('%Y-%m-%d')}T{hour:02d}:00:00",
                    reason=f"Priority: {t.priority.value}, score: {t.priority_score}",
                    estimated_duration_min=duration,
                ))
                hour += max(1, duration // 60 + (1 if duration % 60 > 0 else 0))
                if hour >= 18:
                    break

            return DailyPlanResponse(
                plan=plan_items,
                summary=f"Planned {len(plan_items)} tasks for today based on priority.",
            )

    async def _get_calendar_context(self, user_id: str) -> Dict:
        """
        Get user's calendar context for planning
        This would integrate with CalendarService
        """
        
        # Placeholder - would fetch real calendar data
        return {
            "upcoming_events": [],
            "work_hours": {"start": "09:00", "end": "18:00"},
            "busy_periods": [],
            "preferred_focus_times": ["10:00-12:00", "14:00-16:00"]
        }
