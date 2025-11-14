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
    Task, User, TaskDomain, Priority
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
        
        Provide 3-5 concrete recommendations with clear reasoning."""

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
        Research Agent: Perform research and provide options
        """
        
        system_prompt = """You are a Research Agent for a personal assistant system.
        Your job is to research options and provide structured recommendations.
        
        For each research request:
        1. Find 3-5 relevant options
        2. Analyze pros/cons objectively  
        3. Consider user's context (location, budget, preferences)
        4. Provide a clear recommendation with reasoning
        5. Include actionable next steps
        
        Focus on practical, actionable information."""
        
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
        
        Find and analyze options. Provide structured comparison with pros/cons.
        Include pricing, ratings, and a clear recommendation based on the user's context.
        """
        
        # Note: In a real implementation, this would call external search APIs
        # For now, we'll simulate research results
        response = await self.llm_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_schema=ResearchResponse
        )
        
        return response
    
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
