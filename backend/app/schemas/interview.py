from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class InterviewReportBase(BaseModel):
    tech_score: int
    clarity_score: int
    originality_score: int
    feedback: str

class InterviewReportCreate(InterviewReportBase):
    pass

class InterviewReport(InterviewReportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
