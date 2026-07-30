from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RecommendationResponse(BaseModel):
    id: str
    equipment: str
    equipmentId: str
    recommendation: str
    reason: str
    savings: int
    confidence: int
    priority: str
    category: str

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations():
    # Return mock AI recommendations for the hackathon
    # In a real app, this would use an LLM analyzing the Postgres telemetry data.
    return [
      {
        "id": 'rec-1',
        "equipment": 'CAT 320 Excavator',
        "equipmentId": 'eq-1',
        "recommendation": 'Relocate to Site Bravo',
        "reason": 'Idle for 14 hours while Site Bravo requires an excavator tomorrow for a new foundation pour.',
        "savings": 2400,
        "confidence": 97,
        "priority": 'high',
        "category": 'Relocation',
      },
      {
        "id": 'rec-2',
        "equipment": 'CAT 980 Loader',
        "equipmentId": 'eq-3',
        "recommendation": 'Schedule preventive maintenance',
        "reason": 'Engine hours approaching service interval. Risk of unplanned downtime increases 34% past threshold.',
        "savings": 5800,
        "confidence": 91,
        "priority": 'high',
        "category": 'Maintenance',
      }
    ]

class CopilotRequest(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    reply: str

@router.post("/copilot", response_model=CopilotResponse)
async def ask_copilot(req: CopilotRequest):
    q = req.query
    map_replies = {
        'Which assets are wasting money?':
            'Three assets are bleeding revenue right now:\n\n1. CAT 336 Excavator — 6 idle hrs, critical health, $1,800/day at risk\n2. CAT 631 Scraper — 8 idle hrs, $960/day at risk\n3. CAT 966 Loader — 11 idle hrs + maintenance, $2,200/day at risk\n\nTotal daily exposure: ~$4,960. Approve the maintenance recommendation to recover $5,800.',
        'Recommend relocations.':
            'Top relocation opportunity:\n\n• Move CAT 320 Excavator from Site Alpha to Site Bravo\n  Reason: idle 14 hrs, Bravo needs excavator tomorrow\n  Savings: $2,400 | Confidence: 97%\n\nSecondary: Redeploy CAT 14M Grader from Alpha to Delta before Thursday roadwork. Savings $3,100, confidence 79%.',
        "Summarize today's fleet.":
            "Fleet snapshot — 126 active rentals, 87.4% utilization (+2.1 pts). 14 units idle, 3 safety alerts. Fleet health 92%. $48,200 revenue at risk, mostly concentrated at Site Charlie. 4 critical decisions pending your approval — total potential savings $12,400.",
        'Which rentals expire tomorrow?':
            'Rentals expiring within 24h:\n\n• CAT 336 Excavator — Site Charlie (4 days remain, but customer flagged early return)\n• CAT 966 Loader — Site Delta (6 days, in maintenance)\n• CAT D6 Dozer — Site Alpha (8 days)\n\nRecommend proactive renewal outreach on the 336 and 966.',
    }
    reply = map_replies.get(q, "I can analyze fleet utilization, recommend relocations, flag revenue at risk, and surface expiring rentals. Try one of the suggested prompts above.")
    return CopilotResponse(reply=reply)
