
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from models.chatbot_model import Conversation, Message, ConversationResponse, MessageResponse
from models.user_model import User
from utils.dependencies import get_session, get_current_user
from agents.task_agent import run_agent

router = APIRouter(tags=["chatbot"])

class ChatRequest(BaseModel):
    conversation_id: Optional[uuid.UUID] = None
    message: str

class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    response: str
    tool_calls: list

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        print(f"DEBUG 1: current_user from token: {current_user}")
        print(f"DEBUG 2: current_user type: {type(current_user)}")
        
        # Check if user exists in database
        check_user = session.get(User, current_user)
        print(f"DEBUG 3: User exists in DB: {check_user is not None}")
        if check_user:
            print(f"DEBUG 4: User in DB has ID: {check_user.id}")
        
        # Get or create conversation
        if request.conversation_id:
            conversation = session.get(Conversation, request.conversation_id)
            if not conversation or conversation.user_id != current_user:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            print(f"DEBUG 5: Creating conversation with user_id: {current_user}")
            conversation = Conversation(user_id=current_user)
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            print(f"DEBUG 6: Conversation created with ID: {conversation.id}")
        
        # Fetch conversation history
        messages_query = select(Message).where(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at)
        
        db_messages = session.exec(messages_query).all()
        
        # Build message history for agent
        message_history = [
            {"role": msg.role, "content": msg.content}
            for msg in db_messages
        ]
        
        # Add current message
        message_history.append({"role": "user", "content": request.message})
        
        # Call agent
        agent_result = run_agent(message_history, str(current_user))
        
        # Store messages
        user_message = Message(
            user_id=current_user,
            conversation_id=conversation.id,
            role="user",
            content=request.message
        )
        session.add(user_message)
        
        assistant_message = Message(
            user_id=current_user,
            conversation_id=conversation.id,
            role="assistant",
            content=agent_result["response"]
        )
        session.add(assistant_message)
        session.commit()
        
        return ChatResponse(
            conversation_id=conversation.id,
            response=agent_result["response"],
            tool_calls=agent_result.get("tool_calls", [])
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    conversations = session.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user)
        .order_by(Conversation.updated_at.desc())
    ).all()
    return conversations

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: uuid.UUID = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)
    
    if not conversation or conversation.user_id != current_user:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()
    return messages