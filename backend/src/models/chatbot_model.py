# from sqlmodel import SQLModel, Field, Relationship
# from datetime import datetime
# from typing import Optional, List
# import uuid

# # ... your existing Conversation and Message models ...

# # ADD THESE:
# # class ConversationResponse(SQLModel):
# #     id: uuid.UUID
# #     user_id: uuid.UUID
# #     title: Optional[str]
# #     created_at: datetime
# #     updated_at: datetime
# class Conversation(SQLModel, table=True):
#     __tablename__ = "conversations"
    
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)  # Change from int
#     user_id: uuid.UUID = Field(foreign_key="users.id")
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     updated_at: datetime = Field(default_factory=datetime.utcnow)
    
#     class Config:
#         from_attributes = True


# class MessageResponse(SQLModel):
#     id: uuid.UUID
#     user_id: uuid.UUID
#     conversation_id: uuid.UUID
#     role: str
#     content: str
#     tool_calls: Optional[str]
#     created_at: datetime
    
#     class Config:
#         from_attributes = True
# class Message(SQLModel, table=True):
#     __tablename__ = "messages"
    
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     conversation_id: uuid.UUID = Field(foreign_key="conversations.id")
#     user_id: uuid.UUID = Field(foreign_key="users.id")
#     role: str  # "user" or "assistant"
#     content: str
#     tool_calls: Optional[str] = None
#     created_at: datetime = Field(default_factory=datetime.utcnow)
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
import uuid

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id")
    user_id: uuid.UUID = Field(foreign_key="users.id")
    role: str
    content: str
    tool_calls: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationResponse(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class MessageResponse(SQLModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    content: str
    tool_calls: Optional[str]
    created_at: datetime