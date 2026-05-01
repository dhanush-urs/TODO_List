from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Union
from datetime import datetime, date
from enum import Enum

class PriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.MEDIUM
    due_date: Optional[Union[datetime, date, str]] = None
    completed: bool = False
    
    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        """Normalize priority to uppercase"""
        if v is None:
            return PriorityEnum.MEDIUM
        if isinstance(v, PriorityEnum):
            return v
        if isinstance(v, str):
            # Convert to uppercase
            v_upper = v.strip().upper()
            # Validate it's a valid priority
            if v_upper in ['LOW', 'MEDIUM', 'HIGH']:
                return v_upper
            # Try to map common variations
            priority_map = {
                'LOW': 'LOW',
                'MEDIUM': 'MEDIUM',
                'HIGH': 'HIGH',
                'L': 'LOW',
                'M': 'MEDIUM',
                'H': 'HIGH'
            }
            mapped = priority_map.get(v_upper)
            if mapped:
                return mapped
            # If invalid, raise error
            raise ValueError(f"Invalid priority value: '{v}'. Must be LOW, MEDIUM, or HIGH")
        return v
    
    @field_validator('due_date', mode='before')
    @classmethod
    def parse_due_date(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, (datetime, date)):
            return v
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except:
                try:
                    return datetime.strptime(v, '%Y-%m-%d')
                except:
                    return None
        return None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[Union[datetime, date, str]] = None
    completed: Optional[bool] = None
    
    @field_validator('priority', mode='before')
    @classmethod
    def normalize_priority(cls, v):
        """Normalize priority to uppercase"""
        if v is None:
            return None
        if isinstance(v, PriorityEnum):
            return v
        if isinstance(v, str):
            v_upper = v.strip().upper()
            if v_upper in ['LOW', 'MEDIUM', 'HIGH']:
                return v_upper
            priority_map = {
                'LOW': 'LOW',
                'MEDIUM': 'MEDIUM',
                'HIGH': 'HIGH',
                'L': 'LOW',
                'M': 'MEDIUM',
                'H': 'HIGH'
            }
            mapped = priority_map.get(v_upper)
            if mapped:
                return mapped
            raise ValueError(f"Invalid priority value: '{v}'. Must be LOW, MEDIUM, or HIGH")
        return v
    
    @field_validator('due_date', mode='before')
    @classmethod
    def parse_due_date(cls, v):
        if v is None or v == '':
            return None
        if isinstance(v, (datetime, date)):
            return v
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except:
                try:
                    return datetime.strptime(v, '%Y-%m-%d')
                except:
                    return None
        return None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TaskStats(BaseModel):
    total: int
    completed: int
    pending: int
    completion_rate: float
