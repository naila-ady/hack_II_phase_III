# from sqlmodel import SQLModel, Field
# from datetime import datetime
# from typing import Optional
# import uuid

# class Todo(SQLModel, table=True):
#     __tablename__ = "todos"
    
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     user_id: uuid.UUID = Field(foreign_key="users.id")
#     title: str
#     description: Optional[str] = None
#     priority: str = "medium"
#     completed: bool = False
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: datetime = Field(default_factory=datetime.utcnow)

# class TodoCreate(SQLModel):
#     title: str
#     description: Optional[str] = None
#     priority: str = "medium"

# class TodoUpdate(SQLModel):
#     title: Optional[str] = None
#     description: Optional[str] = None
#     priority: Optional[str] = None
#     completed: Optional[bool] = None

# class TodoResponse(SQLModel):
#     id: uuid.UUID
#     user_id: uuid.UUID
#     title: str
#     description: Optional[str]
#     priority: str
#     completed: bool
#     created_at: datetime
#     updated_at: datetime

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class Todo(SQLModel, table=True):
    __tablename__ = "todos"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TodoCreate(SQLModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"

class TodoUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None

class TodoResponse(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str]
    priority: str
    completed: bool
    created_at: datetime
    updated_at: datetime