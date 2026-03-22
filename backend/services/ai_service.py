from typing import List, Optional
import sys
import os
from dotenv import load_dotenv
from anthropic import AsyncAnthropic

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.schemas import ChatResponse

class AIService:
    def __init__(self):
        # Automatically uses ANTHROPIC_API_KEY environment variable
        self.client = AsyncAnthropic()
        self.system_prompt = (
            "You are an AI code analysis assistant for a tool called AntyGravity. "
            "AntyGravity detects bugs, security issues, and structural regressions in code. "
            "Help the user understand the risks and how to fix them."
        )

    async def get_reply(self, message: str, context: Optional[str] = None) -> ChatResponse:
        system = self.system_prompt
        if context:
            system += f"\n\nCurrent scan results (context):\n{context}\nReference this context if relevant."
            
        try:
            response = await self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system=system,
                messages=[
                    {"role": "user", "content": message}
                ]
            )
            reply = "".join(block.text for block in response.content)
        except Exception as e:
            reply = f"Error calling Anthropic API: {str(e)}"
            
        return ChatResponse(reply=reply)
