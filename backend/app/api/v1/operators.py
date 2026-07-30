from fastapi import APIRouter
from app.models.mongo.users import User
from pydantic import BaseModel
import random

router = APIRouter()

class OperatorUIResponse(BaseModel):
    id: str
    name: str
    avatar: str
    efficiency: int
    safetyScore: int
    assignedEquipment: str
    experienceYears: int
    lateReturns: int
    rank: int

@router.get("", response_model=list[OperatorUIResponse])
async def get_all_operators():
    # In a real app we would join Postgres assignments, but since Beanie handles operators
    # we'll fetch them from Mongo and mock the stats.
    users = await User.find(User.role == "operator").to_list()
    
    response_data = []
    for idx, u in enumerate(users):
        name_parts = u.name.split()
        initials = "".join([p[0].upper() for p in name_parts]) if name_parts else "OP"
        
        response_data.append(
            OperatorUIResponse(
                id=str(u.id),
                name=u.name,
                avatar=initials,
                efficiency=random.randint(70, 98),
                safetyScore=random.randint(75, 100),
                assignedEquipment="Unassigned", # We'd query postgres for this normally
                experienceYears=random.randint(1, 15),
                lateReturns=random.randint(0, 3),
                rank=idx + 1
            )
        )
        
    return response_data
