"""
LLM Client - Interface for language model interactions
Supports structured output generation for AI agents
"""

import json
import asyncio
from typing import Dict, Any, Type, TypeVar, Optional
from pydantic import BaseModel
import openai
import os
from datetime import datetime

T = TypeVar('T', bound=BaseModel)


class LLMClient:
    """
    Client for interacting with language models (OpenAI GPT-4, Claude, etc.)
    Handles structured output generation for AI agents
    """
    
    def __init__(self):
        # Initialize OpenAI client (can be extended for other providers)
        self.openai_client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Default model configuration
        self.default_model = "gpt-4-turbo-preview"
        self.default_temperature = 0.1  # Low temperature for consistent structured output
        self.max_tokens = 4000
        
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T],
        model: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> T:
        """
        Generate structured response matching a Pydantic schema
        
        Args:
            system_prompt: System instructions for the AI
            user_prompt: User's specific request
            response_schema: Pydantic model class for response validation
            model: Override default model
            temperature: Override default temperature
        
        Returns:
            Validated Pydantic model instance
        """
        
        # Build the complete prompt with schema instructions
        schema_prompt = self._build_schema_prompt(response_schema)
        full_system_prompt = f"{system_prompt}\n\n{schema_prompt}"
        
        try:
            # Call the language model
            response = await self.openai_client.chat.completions.create(
                model=model or self.default_model,
                temperature=temperature or self.default_temperature,
                max_tokens=self.max_tokens,
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            # Extract and parse the response
            response_text = response.choices[0].message.content.strip()
            
            # Clean up the response (remove markdown code blocks if present)
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON and validate with Pydantic
            response_data = json.loads(response_text)
            validated_response = response_schema(**response_data)
            
            return validated_response
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from LLM: {e}")
        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {e}")
    
    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generate free-form text response
        """
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model or self.default_model,
                temperature=temperature or self.default_temperature,
                max_tokens=self.max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise RuntimeError(f"LLM text generation failed: {e}")
    
    def _build_schema_prompt(self, schema_class: Type[BaseModel]) -> str:
        """
        Build prompt instructions for structured output
        """
        
        # Get the JSON schema from Pydantic model
        schema = schema_class.model_json_schema()
        
        prompt = f"""
IMPORTANT: You must respond with valid JSON that matches this exact schema:

{json.dumps(schema, indent=2)}

Requirements:
1. Return ONLY valid JSON - no markdown, no explanations, no additional text
2. All required fields must be present
3. Field types must match the schema exactly
4. Enum values must be from the allowed options
5. Dates should be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
6. Arrays and objects must be properly formatted

Example response format:
{{
    "field1": "value1",
    "field2": 123,
    "field3": ["item1", "item2"]
}}
"""
        
        return prompt
    
    async def generate_with_tools(
        self,
        system_prompt: str,
        user_prompt: str,
        tools: list[Dict[str, Any]],
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate response with tool calling capability
        (For future use with function calling models)
        """
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model or self.default_model,
                temperature=self.default_temperature,
                max_tokens=self.max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                tools=tools,
                tool_choice="auto"
            )
            
            return {
                "message": response.choices[0].message.content,
                "tool_calls": response.choices[0].message.tool_calls or []
            }
            
        except Exception as e:
            raise RuntimeError(f"LLM tool generation failed: {e}")


class LLMLogger:
    """
    Logger for LLM interactions (for debugging and improvement)
    """
    
    def __init__(self):
        self.log_file = "llm_interactions.jsonl"
    
    async def log_interaction(
        self,
        agent_type: str,
        system_prompt: str,
        user_prompt: str,
        response: Any,
        user_id: str,
        execution_time_ms: int,
        error: Optional[str] = None
    ):
        """
        Log LLM interaction for analysis and improvement
        """
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "agent_type": agent_type,
            "user_id": user_id,
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "response": str(response) if response else None,
            "execution_time_ms": execution_time_ms,
            "error": error
        }
        
        # In production, this would go to a proper logging system
        # For now, just write to file
        try:
            with open(self.log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception:
            pass  # Don't fail the main operation if logging fails


# Singleton instances
llm_client = LLMClient()
llm_logger = LLMLogger()
