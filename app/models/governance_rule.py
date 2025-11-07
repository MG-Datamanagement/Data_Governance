from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean,
    Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base

class GovernanceRule(Base):
    __tablename__ = "governance_rules"
    
    # rule_id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, primary_key=True, autoincrement=True) 
    rules = Column(Text, nullable=False)
    status = Column(Enum('Active', 'Inactive', name='governancerulestatusenum'), nullable=False)
    category = Column(String(100), nullable=False)
    priority = Column(Enum('Low', 'Medium', 'High',  name='rulepriorityenum'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    modified_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())