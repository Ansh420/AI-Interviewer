from sqlalchemy import Column, Integer, Text, DateTime, JSON
import datetime
from app.db.base import Base

class InterviewReport(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    tech_score = Column(Integer)
    clarity_score = Column(Integer)
    originality_score = Column(Integer)
    feedback = Column(Text)
    timeline_events = Column(JSON, nullable=True) # Stores list of {timestamp, type, content, marker}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
