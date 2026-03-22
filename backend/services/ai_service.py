from typing import List, Optional
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.schemas import ChatResponse

class AIService:
    def __init__(self):
        self.random_responses = [
            "The current stability index is acceptable, but monitor the hotspots for regressive patterns.",
            "I recommend performing a manual peer review on the high-gravity modules.",
            "Based on structural analysis, the current deployment appears stable."
        ]

    async def get_reply(self, message: str, context: Optional[str] = None) -> ChatResponse:
        msg = message.lower()
        
        # Keyword-based logic
        if "risk" in msg:
            reply = "Risk vectors are calculated purely from cyclomatic complexity (logic branching). High risk indicates code that is structurally prone to regressions."
        elif "gravity" in msg:
            reply = "Gravity Score represents the structural fragility of a module. High gravity files should be prioritized for refactoring to prevent system failure."
        elif "fix" in msg or "suggest" in msg:
            reply = "To reduce gravity, I recommend decomposing large functions into smaller units, reducing nested conditionals, and increasing unit test coverage."
        elif context:
            # Simple context usage
            reply = f"Analyzing your current project state: I see your overall gravity is monitored. Focusing on the identified hotspots is the most efficient path to stabilization."
        else:
            import random
            reply = random.choice(self.random_responses)
            
        return ChatResponse(reply=reply)
