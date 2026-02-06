"""
Speech-to-Text Service
Handles audio transcription for voice capture
"""

import base64
import asyncio
import tempfile
import os
from typing import Optional
import openai


class STTService:
    """
    Speech-to-Text service using OpenAI Whisper API
    Can be extended to support other STT providers
    """
    
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def transcribe(self, audio_data: str) -> str:
        """
        Transcribe base64-encoded audio data to text
        
        Args:
            audio_data: Base64-encoded audio file (mp3, wav, m4a, etc.)
        
        Returns:
            Transcribed text
        """
        
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temporary file for audio (.m4a is the format from iOS/Expo recorder)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.m4a') as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
            
            try:
                # Transcribe using OpenAI Whisper
                with open(temp_file_path, 'rb') as audio_file:
                    transcript = await self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="en"  # Can be made configurable
                    )
                
                return transcript.text.strip()
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            raise RuntimeError(f"Speech transcription failed: {e}")
    
    async def transcribe_with_timestamps(self, audio_data: str) -> dict:
        """
        Transcribe with word-level timestamps (for future use)
        """
        
        try:
            audio_bytes = base64.b64decode(audio_data)
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
            
            try:
                with open(temp_file_path, 'rb') as audio_file:
                    transcript = await self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="verbose_json",
                        timestamp_granularities=["word"]
                    )
                
                return {
                    "text": transcript.text,
                    "words": transcript.words,
                    "duration": transcript.duration
                }
                
            finally:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            raise RuntimeError(f"Speech transcription with timestamps failed: {e}")


class TTSService:
    """
    Text-to-Speech service for voice responses (future feature)
    """
    
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def synthesize(self, text: str, voice: str = "alloy") -> bytes:
        """
        Convert text to speech audio
        
        Args:
            text: Text to convert to speech
            voice: Voice to use (alloy, echo, fable, onyx, nova, shimmer)
        
        Returns:
            Audio data as bytes
        """
        
        try:
            response = await self.openai_client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )
            
            return response.content
            
        except Exception as e:
            raise RuntimeError(f"Text-to-speech synthesis failed: {e}")
