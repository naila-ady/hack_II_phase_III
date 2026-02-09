from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
import uuid

from models.todo_model import Todo, TodoCreate, TodoUpdate, TodoResponse
from utils.dependencies import get_session, get_current_user

# router = APIRouter(prefix="/api/v1", tags=["todos"])
router = APIRouter(tags=["todos"])  # Remove prefix here


@router.get("/todos", response_model=List[TodoResponse])
async def get_todos(
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all todos for authenticated user"""
    statement = select(Todo).where(Todo.user_id == current_user)
    todos = session.exec(statement).all()
    return todos


@router.post("/todos", response_model=TodoResponse, status_code=201)
async def create_todo(
    todo_data: TodoCreate,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new todo"""
    todo = Todo(
        user_id=current_user,
        **todo_data.model_dump()
    )
    
    session.add(todo)
    session.commit()
    session.refresh(todo)
    
    return todo


@router.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific todo"""
    todo = session.get(Todo, todo_id)
    
    if not todo or todo.user_id != current_user:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    return todo


@router.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: uuid.UUID,
    todo_data: TodoUpdate,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a todo"""
    todo = session.get(Todo, todo_id)
    
    if not todo or todo.user_id != current_user:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    # Update only provided fields
    update_data = todo_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    
    todo.updated_at = datetime.utcnow()
    
    session.add(todo)
    session.commit()
    session.refresh(todo)
    
    return todo


@router.patch("/todos/{todo_id}/toggle", response_model=TodoResponse)
async def toggle_todo(
    todo_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Toggle todo completion status"""
    todo = session.get(Todo, todo_id)
    
    if not todo or todo.user_id != current_user:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    todo.completed = not todo.completed
    todo.updated_at = datetime.utcnow()
    
    session.add(todo)
    session.commit()
    session.refresh(todo)
    
    return todo


@router.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(
    todo_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a todo"""
    todo = session.get(Todo, todo_id)
    
    if not todo or todo.user_id != current_user:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    session.delete(todo)
    session.commit()
    
    return None