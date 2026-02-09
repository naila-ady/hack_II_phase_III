# Chatbot API Specification

## Overview
FastAPI backend that provides a chat endpoint integrating OpenAI Agents SDK with MCP tools for natural language task management.

## Technology Stack
- **Backend Framework:** Python FastAPI
- **AI Framework:** OpenAI Agents SDK
- **MCP Client:** Official MCP SDK (client mode)
- **Authentication:** Better Auth
- **Database:** SQLModel + Neon PostgreSQL

---

## API Architecture

### Stateless Design
- Server holds NO conversation state in memory
- All state persists to database
- Each request is self-contained
- Server can restart without data loss

### Request Flow
```
1. User sends message → POST /api/{user_id}/chat
2. Load conversation history from database
3. Build message array (history + new message)
4. Save user message to database
5. Run OpenAI Agent with MCP tools
6. Agent calls MCP tools as needed
7. Save assistant response to database
8. Return response to user
```

---

## API Endpoints

### 1. Chat Endpoint

**POST** `/api/{user_id}/chat`

**Description:** Send a message and get AI response

**Path Parameters:**
- `user_id` (string) - User identifier from Better Auth

**Request Body:**
```json
{
  "conversation_id": 5,  // Optional - creates new if not provided
  "message": "Add a task to buy groceries"
}
```

**Response:**
```json
{
  "conversation_id": 5,
  "response": "I've added 'Buy groceries' to your tasks!",
  "tool_calls": [
    {
      "tool": "add_task",
      "input": {"user_id": "user_123", "title": "Buy groceries"},
      "output": {"task_id": 10, "status": "created", "title": "Buy groceries"}
    }
  ]
}
```

**Error Responses:**
- 400: Invalid request (missing message)
- 401: Unauthorized (invalid token)
- 404: Conversation not found
- 500: Server error

---

### 2. Health Check

**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "mcp_server": "available"
}
```

---

## Authentication Flow

### Better Auth Integration

**Setup:**
1. User registers/logs in via Better Auth
2. Better Auth returns JWT token
3. Frontend includes token in Authorization header
4. API validates token and extracts user_id

**Middleware:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    # Validate JWT token with Better Auth
    # Extract user_id
    # Return user_id
    pass
```

---

## OpenAI Agent Configuration

### Agent Setup

**System Prompt:**
```
You are a helpful todo list assistant. Users can ask you to:
- Add tasks (e.g., "remember to buy milk")
- List tasks (e.g., "show my tasks", "what's pending?")
- Complete tasks (e.g., "mark task 3 as done")
- Delete tasks (e.g., "remove the meeting task")
- Update tasks (e.g., "change task 1 to 'call mom tonight'")

Always use the MCP tools to manage tasks. Confirm actions in a friendly way.
When a user mentions a task but doesn't give a number, list tasks first to find it.
```

**Agent Parameters:**
```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

agent = client.agents.create(
    model="gpt-4",
    instructions=SYSTEM_PROMPT,
    tools=[
        {"type": "mcp", "name": "add_task"},
        {"type": "mcp", "name": "list_tasks"},
        {"type": "mcp", "name": "complete_task"},
        {"type": "mcp", "name": "delete_task"},
        {"type": "mcp", "name": "update_task"}
    ]
)
```

### MCP Tools Integration

**Register MCP Server:**
```python
from mcp.client import MCPClient

mcp_client = MCPClient("stdio://mcp-server/src/server.py")
```

**Tool Calling Flow:**
1. Agent decides to use tool
2. API forwards tool call to MCP server
3. MCP server executes and returns result
4. API provides result back to agent
5. Agent formulates response

---

## Database Operations

### Conversation Management

**Create Conversation:**
```python
def create_conversation(session: Session, user_id: str) -> Conversation:
    conv = Conversation(user_id=user_id)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv
```

**Get Conversation:**
```python
def get_conversation(session: Session, user_id: str, conversation_id: int) -> Conversation:
    conv = session.get(Conversation, conversation_id)
    if not conv or conv.user_id != user_id:
        raise HTTPException(404, "Conversation not found")
    return conv
```

**Get Conversation History:**
```python
def get_conversation_messages(session: Session, conversation_id: int) -> List[Message]:
    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at)
    return session.exec(statement).all()
```

### Message Management

**Save User Message:**
```python
def save_message(
    session: Session,
    conversation_id: int,
    user_id: str,
    role: MessageRole,
    content: str
) -> Message:
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

## Chat Endpoint Implementation

### Complete Flow

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel

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
    # Verify user_id matches authenticated user
    if user_id != current_user:
        raise HTTPException(403, "Forbidden")
    
    # Get or create conversation
    if request.conversation_id:
        conversation = get_conversation(session, user_id, request.conversation_id)
    else:
        conversation = create_conversation(session, user_id)
    
    # Get conversation history
    history = get_conversation_messages(session, conversation.id)
    messages = [
        {"role": msg.role.value, "content": msg.content}
        for msg in history
    ]
    
    # Add new user message
    messages.append({"role": "user", "content": request.message})
    
    # Save user message to database
    save_message(
        session,
        conversation.id,
        user_id,
        MessageRole.USER,
        request.message
    )
    
    # Run agent
    agent_response = await run_agent(user_id, messages)
    
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

## Agent Runner Service

**File:** `backend/app/services/agent_service.py`

```python
from openai import OpenAI
from typing import List, Dict

client = OpenAI()

async def run_agent(user_id: str, messages: List[Dict]) -> Dict:
    """Run OpenAI agent with MCP tools."""
    
    # Create thread with messages
    thread = client.beta.threads.create(messages=messages)
    
    # Run agent
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=ASSISTANT_ID,
        additional_instructions=f"User ID: {user_id}"
    )
    
    # Wait for completion
    while run.status in ["queued", "in_progress"]:
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
    
    # Get response
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    latest_message = messages.data[0]
    
    # Extract tool calls
    tool_calls = []
    if run.required_action:
        for tool_call in run.required_action.submit_tool_outputs.tool_calls:
            tool_calls.append({
                "tool": tool_call.function.name,
                "input": tool_call.function.arguments,
                "output": tool_call.output
            })
    
    return {
        "content": latest_message.content[0].text.value,
        "tool_calls": tool_calls
    }
```

---

## Environment Variables

```bash
# API
API_HOST=0.0.0.0
API_PORT=8000

# Database (reuse from chatbot_database)
DATABASE_URL=postgresql+asyncpg://...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...

# MCP Server
MCP_SERVER_PATH=../mcp-server/src/server.py
```

---

## Error Handling

### Graceful Failures

```python
from fastapi import HTTPException

try:
    # Run agent
    response = await run_agent(user_id, messages)
except OpenAIError as e:
    raise HTTPException(500, "AI service unavailable")
except MCPError as e:
    raise HTTPException(500, "Task service unavailable")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, "Internal server error")
```

### User-Friendly Messages

```python
# Don't expose internal errors
# Bad: "SQLAlchemy connection pool exhausted"
# Good: "Service temporarily unavailable"
```

---

## Testing Requirements

### Unit Tests
- Test chat endpoint with valid request
- Test conversation creation
- Test message saving
- Test user isolation (can't access other's conversations)

### Integration Tests
- Test complete chat flow (request → agent → response)
- Test MCP tool calls
- Test conversation persistence after server restart
- Test error handling (agent failure, MCP failure)

---

## Performance Requirements

- **Response Time:** < 5 seconds for typical chat
- **Concurrent Users:** Support 100+ simultaneous requests
- **Database Queries:** Optimize with indexes
- **Agent Timeout:** 30 seconds max

---

## Security Requirements

### Authentication
- All endpoints (except /health) require valid JWT
- Token validation on every request
- User can only access their own data

### Input Validation
- Sanitize user messages
- Limit message length (50,000 chars)
- Rate limiting (10 requests/minute per user)

### Data Isolation
- conversation_id verification with user_id
- No cross-user data access
- Secure database queries (parameterized)

---

## Deliverables

1. **FastAPI App:**
   - `backend/app/main.py`
   - `backend/app/routes/chat.py`
   - `backend/app/services/agent_service.py`

2. **Middleware:**
   - `backend/app/middleware/auth.py`
   - `backend/app/middleware/cors.py`
   - `backend/app/middleware/error_handler.py`

3. **Tests:**
   - `backend/tests/test_chat_endpoint.py`
   - `backend/tests/test_agent.py`

4. **Configuration:**
   - Updated `.env.example`
   - `backend/app/config.py`

---

## Success Criteria

✅ Chat endpoint working  
✅ Agent calls MCP tools correctly  
✅ Conversation history persists  
✅ Authentication enforced  
✅ Stateless (server restart works)  
✅ All tests pass  
✅ Error handling graceful  
✅ Ready for frontend integration  

---

**Version:** 1.0  
**Dependencies:** chatbot_database, chatbot_mcp_server# Chatbot API Specification

## Overview
FastAPI backend that provides a chat endpoint integrating OpenAI Agents SDK with MCP tools for natural language task management.

## Technology Stack
- **Backend Framework:** Python FastAPI
- **AI Framework:** OpenAI Agents SDK
- **MCP Client:** Official MCP SDK (client mode)
- **Authentication:** Better Auth
- **Database:** SQLModel + Neon PostgreSQL

---

## API Architecture

### Stateless Design
- Server holds NO conversation state in memory
- All state persists to database
- Each request is self-contained
- Server can restart without data loss

### Request Flow
```
1. User sends message → POST /api/{user_id}/chat
2. Load conversation history from database
3. Build message array (history + new message)
4. Save user message to database
5. Run OpenAI Agent with MCP tools
6. Agent calls MCP tools as needed
7. Save assistant response to database
8. Return response to user
```

---

## API Endpoints

### 1. Chat Endpoint

**POST** `/api/{user_id}/chat`

**Description:** Send a message and get AI response

**Path Parameters:**
- `user_id` (string) - User identifier from Better Auth

**Request Body:**
```json
{
  "conversation_id": 5,  // Optional - creates new if not provided
  "message": "Add a task to buy groceries"
}
```

**Response:**
```json
{
  "conversation_id": 5,
  "response": "I've added 'Buy groceries' to your tasks!",
  "tool_calls": [
    {
      "tool": "add_task",
      "input": {"user_id": "user_123", "title": "Buy groceries"},
      "output": {"task_id": 10, "status": "created", "title": "Buy groceries"}
    }
  ]
}
```

**Error Responses:**
- 400: Invalid request (missing message)
- 401: Unauthorized (invalid token)
- 404: Conversation not found
- 500: Server error

---

### 2. Health Check

**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "mcp_server": "available"
}
```

---

## Authentication Flow

### Better Auth Integration

**Setup:**
1. User registers/logs in via Better Auth
2. Better Auth returns JWT token
3. Frontend includes token in Authorization header
4. API validates token and extracts user_id

**Middleware:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    # Validate JWT token with Better Auth
    # Extract user_id
    # Return user_id
    pass
```

---

## OpenAI Agent Configuration

### Agent Setup

**System Prompt:**
```
You are a helpful todo list assistant. Users can ask you to:
- Add tasks (e.g., "remember to buy milk")
- List tasks (e.g., "show my tasks", "what's pending?")
- Complete tasks (e.g., "mark task 3 as done")
- Delete tasks (e.g., "remove the meeting task")
- Update tasks (e.g., "change task 1 to 'call mom tonight'")

Always use the MCP tools to manage tasks. Confirm actions in a friendly way.
When a user mentions a task but doesn't give a number, list tasks first to find it.
```

**Agent Parameters:**
```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

agent = client.agents.create(
    model="gpt-4",
    instructions=SYSTEM_PROMPT,
    tools=[
        {"type": "mcp", "name": "add_task"},
        {"type": "mcp", "name": "list_tasks"},
        {"type": "mcp", "name": "complete_task"},
        {"type": "mcp", "name": "delete_task"},
        {"type": "mcp", "name": "update_task"}
    ]
)
```

### MCP Tools Integration

**Register MCP Server:**
```python
from mcp.client import MCPClient

mcp_client = MCPClient("stdio://mcp-server/src/server.py")
```

**Tool Calling Flow:**
1. Agent decides to use tool
2. API forwards tool call to MCP server
3. MCP server executes and returns result
4. API provides result back to agent
5. Agent formulates response

---

## Database Operations

### Conversation Management

**Create Conversation:**
```python
def create_conversation(session: Session, user_id: str) -> Conversation:
    conv = Conversation(user_id=user_id)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv
```

**Get Conversation:**
```python
def get_conversation(session: Session, user_id: str, conversation_id: int) -> Conversation:
    conv = session.get(Conversation, conversation_id)
    if not conv or conv.user_id != user_id:
        raise HTTPException(404, "Conversation not found")
    return conv
```

**Get Conversation History:**
```python
def get_conversation_messages(session: Session, conversation_id: int) -> List[Message]:
    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at)
    return session.exec(statement).all()
```

### Message Management

**Save User Message:**
```python
def save_message(
    session: Session,
    conversation_id: int,
    user_id: str,
    role: MessageRole,
    content: str
) -> Message:
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

## Chat Endpoint Implementation

### Complete Flow

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from pydantic import BaseModel

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
    # Verify user_id matches authenticated user
    if user_id != current_user:
        raise HTTPException(403, "Forbidden")
    
    # Get or create conversation
    if request.conversation_id:
        conversation = get_conversation(session, user_id, request.conversation_id)
    else:
        conversation = create_conversation(session, user_id)
    
    # Get conversation history
    history = get_conversation_messages(session, conversation.id)
    messages = [
        {"role": msg.role.value, "content": msg.content}
        for msg in history
    ]
    
    # Add new user message
    messages.append({"role": "user", "content": request.message})
    
    # Save user message to database
    save_message(
        session,
        conversation.id,
        user_id,
        MessageRole.USER,
        request.message
    )
    
    # Run agent
    agent_response = await run_agent(user_id, messages)
    
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

## Agent Runner Service

**File:** `backend/app/services/agent_service.py`

```python
from openai import OpenAI
from typing import List, Dict

client = OpenAI()

async def run_agent(user_id: str, messages: List[Dict]) -> Dict:
    """Run OpenAI agent with MCP tools."""
    
    # Create thread with messages
    thread = client.beta.threads.create(messages=messages)
    
    # Run agent
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=ASSISTANT_ID,
        additional_instructions=f"User ID: {user_id}"
    )
    
    # Wait for completion
    while run.status in ["queued", "in_progress"]:
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
    
    # Get response
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    latest_message = messages.data[0]
    
    # Extract tool calls
    tool_calls = []
    if run.required_action:
        for tool_call in run.required_action.submit_tool_outputs.tool_calls:
            tool_calls.append({
                "tool": tool_call.function.name,
                "input": tool_call.function.arguments,
                "output": tool_call.output
            })
    
    return {
        "content": latest_message.content[0].text.value,
        "tool_calls": tool_calls
    }
```

---

## Environment Variables

```bash
# API
API_HOST=0.0.0.0
API_PORT=8000

# Database (reuse from chatbot_database)
DATABASE_URL=postgresql+asyncpg://...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...

# MCP Server
MCP_SERVER_PATH=../mcp-server/src/server.py
```

---

## Error Handling

### Graceful Failures

```python
from fastapi import HTTPException

try:
    # Run agent
    response = await run_agent(user_id, messages)
except OpenAIError as e:
    raise HTTPException(500, "AI service unavailable")
except MCPError as e:
    raise HTTPException(500, "Task service unavailable")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, "Internal server error")
```

### User-Friendly Messages

```python
# Don't expose internal errors
# Bad: "SQLAlchemy connection pool exhausted"
# Good: "Service temporarily unavailable"
```

---

## Testing Requirements

### Unit Tests
- Test chat endpoint with valid request
- Test conversation creation
- Test message saving
- Test user isolation (can't access other's conversations)

### Integration Tests
- Test complete chat flow (request → agent → response)
- Test MCP tool calls
- Test conversation persistence after server restart
- Test error handling (agent failure, MCP failure)

---

## Performance Requirements

- **Response Time:** < 5 seconds for typical chat
- **Concurrent Users:** Support 100+ simultaneous requests
- **Database Queries:** Optimize with indexes
- **Agent Timeout:** 30 seconds max

---

## Security Requirements

### Authentication
- All endpoints (except /health) require valid JWT
- Token validation on every request
- User can only access their own data

### Input Validation
- Sanitize user messages
- Limit message length (50,000 chars)
- Rate limiting (10 requests/minute per user)

### Data Isolation
- conversation_id verification with user_id
- No cross-user data access
- Secure database queries (parameterized)

---

## Deliverables

1. **FastAPI App:**
   - `backend/app/main.py`
   - `backend/app/routes/chat.py`
   - `backend/app/services/agent_service.py`

2. **Middleware:**
   - `backend/app/middleware/auth.py`
   - `backend/app/middleware/cors.py`
   - `backend/app/middleware/error_handler.py`

3. **Tests:**
   - `backend/tests/test_chat_endpoint.py`
   - `backend/tests/test_agent.py`

4. **Configuration:**
   - Updated `.env.example`
   - `backend/app/config.py`

---

## Success Criteria

✅ Chat endpoint working  
✅ Agent calls MCP tools correctly  
✅ Conversation history persists  
✅ Authentication enforced  
✅ Stateless (server restart works)  
✅ All tests pass  
✅ Error handling graceful  
✅ Ready for frontend integration  

---

**Version:** 1.0  
**Dependencies:** chatbot_database, chatbot_mcp_server