from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Task, PriorityEnum
from schemas import TaskCreate, TaskUpdate, TaskResponse, TaskStats
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status: all, completed, pending"),
    priority: Optional[PriorityEnum] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search by title"),
    sort_by: Optional[str] = Query("created_at", description="Sort by: due_date, priority, created_at"),
    order: Optional[str] = Query("desc", description="Order: asc, desc"),
    db: Session = Depends(get_db)
):
    """Get all tasks with optional filtering, searching, and sorting"""
    query = db.query(Task)
    
    # Filter by status
    if status == "completed":
        query = query.filter(Task.completed == True)
    elif status == "pending":
        query = query.filter(Task.completed == False)
    
    # Filter by priority
    if priority:
        query = query.filter(Task.priority == priority)
    
    # Search by title
    if search:
        query = query.filter(Task.title.contains(search))
    
    # Sorting
    if sort_by == "due_date":
        sort_column = Task.due_date
    elif sort_by == "priority":
        # Custom priority ordering: High > Medium > Low
        priority_order = {
            "High": 3,
            "Medium": 2,
            "Low": 1
        }
        # For priority, we'll handle it differently
        tasks = query.all()
        tasks.sort(
            key=lambda x: priority_order.get(x.priority.value, 0),
            reverse=(order == "desc")
        )
        return tasks
    else:
        sort_column = Task.created_at
    
    # Apply ordering
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
    
    return query.all()

@router.get("/stats", response_model=TaskStats)
def get_task_stats(db: Session = Depends(get_db)):
    """Get task statistics"""
    total = db.query(Task).count()
    completed = db.query(Task).filter(Task.completed == True).count()
    pending = total - completed
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    return TaskStats(
        total=total,
        completed=completed,
        pending=pending,
        completion_rate=round(completion_rate, 2)
    )

@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update only provided fields
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task"""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return None
