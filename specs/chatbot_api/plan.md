# Chatbot API - Implementation Plan & Tasks

## Overview
FastAPI backend with OpenAI Agents SDK and MCP integration.

---

## Implementation Tasks

### Task 001: FastAPI Setup

**Objective:** Initialize FastAPI project

**Steps:**
1. Update `backend/requirements.txt`:
```txt
# Add to existing
openai==1.10.0
better-auth-python==0.1.0  # or appropriate Better Auth SDK
pydantic-settings==2.1.0
```

2. Create `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routes import chat
from backend.app.config import settings

app = FastAPI(title="Todo Chatbot API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat.router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
```



---

### Task 002: Better Auth Middleware

**Objective:** Implement authentication

**File:** `backend/app/middleware/auth.py`
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from backend.app.config import settings

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Extract user_id from JWT token."""
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```



---

### Task 003: Conversation Service

**Objective:** Database operations for conversations

**File:** `backend/app/services/conversation_service.py`
```python
from sqlmodel import Session, select
from backend.app.models import Conversation, Message, MessageRole
from fastapi import HTTPException
from typing import List, Optional

def get_or_create_conversation(
    session: Session,
    user_id: str,
    conversation_id: Optional[int] = None
) -> Conversation:
    """Get existing or create new conversation."""
    if conversation_id:
        conv = session.get(Conversation, conversation_id)
        if not conv or conv.user_id != user_id:
            raise HTTPException(404, "Conversation not found")
        return conv
    else:
        conv = Conversation(user_id=user_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)
        return conv

def get_conversation_history(
    session: Session,
    conversation_id: int
) -> List[dict]:
    """Get all messages in conversation."""
    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at)
    
    messages = session.exec(statement).all()
    
    return [
        {"role": msg.role.value, "content": msg.content}
        for msg in messages
    ]

def save_message(
    session: Session,
    conversation_id: int,
    user_id: str,
    role: MessageRole,
    content: str
) -> Message:
    """Save a message to database."""
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content
    )
    session.add(message)
    session.commit()
    return message
```



---

### Task 004: MCP Client Service

**Objective:** Connect to MCP server

**File:** `backend/app/services/mcp_client.py`
```python
from mcp.client import MCPClient
from backend.app.config import settings
import logging

logger = logging.getLogger(__name__)

class TodoMCPClient:
    """Client for communicating with MCP server."""
    
    def __init__(self):
        self.client = MCPClient(f"stdio://{settings.MCP_SERVER_PATH}")
        logger.info("MCP client initialized")
    
    async def call_tool(self, tool_name: str, **kwargs) -> dict:
        """Call an MCP tool."""
        try:
            result = await self.client.call_tool(tool_name, **kwargs)
            return result
        except Exception as e:
            logger.error(f"MCP tool call failed: {e}")
            return {"error": str(e)}

# Global instance
mcp_client = TodoMCPClient()
```


---

### Task 005: Agent Service

**Objective:** OpenAI Agents SDK integration

**File:** `backend/app/services/agent_service.py`
```python
from openai import OpenAI
from backend.app.config import settings
from backend.app.services.mcp_client import mcp_client
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """
You are a helpful todo list assistant. Users can ask you to:
- Add tasks (e.g., "remember to buy milk")
- List tasks (e.g., "show my tasks", "what's pending?")
- Complete tasks (e.g., "mark task 3 as done")
- Delete tasks (e.g., "remove the meeting task")
- Update tasks (e.g., "change task 1 to 'call mom tonight'")

Always use the MCP tools to manage tasks. Confirm actions in a friendly way.
When a user mentions a task but doesn't give a number, list tasks first to find it.
"""

async def run_agent(user_id: str, messages: List[Dict]) -> Dict:
    """Run OpenAI agent with conversation history."""
    
    # Add system message
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\nUser ID: {user_id}"}
    ] + messages
    
    tool_calls_log = []
    
    try:
        # Call OpenAI with function calling
        response = client.chat.completions.create(
            model="gpt-4",
            messages=full_messages,
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "add_task",
                        "description": "Add a new task",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"}
                            },
                            "required": ["title"]
                        }
                    }
                },
                # ... other tools
            ],
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        
        # Handle tool calls
        if message.tool_calls:
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                tool_args["user_id"] = user_id
                
                # Call MCP tool
                result = await mcp_client.call_tool(tool_name, **tool_args)
                
                tool_calls_log.append({
                    "tool": tool_name,
                    "input": tool_args,
                    "output": result
                })
        
        return {
            "content": message.content or "Action completed!",
            "tool_calls": tool_calls_log
        }
        
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise
```



---

### Task 006: Chat Endpoint

**Objective:** Main chat API endpoint

**File:** `backend/app/routes/chat.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional, List
from backend.app.database import get_session
from backend.app.middleware.auth import get_current_user
from backend.app.services.conversation_service import (
    get_or_create_conversation,
    get_conversation_history,
    save_message
)
from backend.app.services.agent_service import run_agent
from backend.app.models import MessageRole

router = APIRouter()

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: List[dict] = []

@router.post("/api/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user)
):
    """Send a message and get AI response."""
    
    # Verify user_id matches authenticated user
    if user_id != current_user:
        raise HTTPException(403, "Forbidden")
    
    # Validate message
    if not request.message.strip():
        raise HTTPException(400, "Message cannot be empty")
    
    if len(request.message) > 50000:
        raise HTTPException(400, "Message too long")
    
    # Get or create conversation
    conversation = get_or_create_conversation(
        session,
        user_id,
        request.conversation_id
    )
    
    # Get conversation history
    history = get_conversation_history(session, conversation.id)
    
    # Add new user message
    messages = history + [{"role": "user", "content": request.message}]
    
    # Save user message
    save_message(
        session,
        conversation.id,
        user_id,
        MessageRole.USER,
        request.message
    )
    
    # Run agent
    try:
        agent_response = await run_agent(user_id, messages)
    except Exception as e:
        raise HTTPException(500, "AI service error")
    
    # Save assistant response
    save_message(
        session,
        conversation.id,
        user_id,
        MessageRole.ASSISTANT,
        agent_response["content"]
    )
    
    return ChatResponse(
        conversation_id=conversation.id,
        response=agent_response["content"],
        tool_calls=agent_response["tool_calls"]
    )
```



---

### Task 007: CORS & Error Handling

**Objective:** Middleware configuration

**File:** `backend/app/middleware/cors.py`
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.com"
]
```

**File:** `backend/app/middleware/error_handler.py`
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

async def error_handler(request: Request, exc: Exception):
    """Global error handler."""
    logger.error(f"Error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )
```



---

### Task 008: Testing

**File:** `backend/tests/test_chat_endpoint.py`
```python
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_chat_endpoint():
    # Mock authentication
    headers = {"Authorization": "Bearer test-token"}
    
    response = client.post(
        "/api/test-user/chat",
        json={"message": "Add task to buy milk"},
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert "response" in data
```



---

## Complete Task List

1. ✅ Task 001: FastAPI Setup (30m)
2. ✅ Task 002: Better Auth Middleware (45m)
3. ✅ Task 003: Conversation Service (1h)
4. ✅ Task 004: MCP Client Service (45m)
5. ✅ Task 005: Agent Service (1.5h)
6. ✅ Task 006: Chat Endpoint (1h)
7. ✅ Task 007: CORS & Error Handling (30m)
8. ✅ Task 008: Testing (1.5h)


---

## Success Checklist

- [ ] FastAPI server runs
- [ ] Chat endpoint accessible
- [ ] Authentication working
- [ ] Agent calls MCP tools
- [ ] Conversation persists
- [ ] All tests pass
- [ ] Error handling works
- [ ] Ready for frontend

---


**Dependencies:** chatbot_database, chatbot_mcp_server