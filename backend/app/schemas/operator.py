from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OperatorProfileResponse(BaseModel):
    name: str
    employeeId: str
    experienceYears: int
    assignedMachine: Optional[str]
    shiftStatus: str
    completedTasks: int
    hoursWorked: float
    safetyScore: int
    achievements: List[str]

class OperatorTaskResponse(BaseModel):
    id: str
    name: str
    priority: str
    machineId: str
    machineName: str
    status: str
    dueTime: str

class AssetScanResponse(BaseModel):
    name: str
    imageSeed: str
    status: str
    machineId: str
    rentalId: Optional[str]
    healthScore: int
    assignedSite: Optional[str]
    assignedOperator: Optional[str]

class TaskStatusUpdateRequest(BaseModel):
    status: str

class ReportIssueRequest(BaseModel):
    asset_id: str
    problem_details: str
