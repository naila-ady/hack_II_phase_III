# Feature Spec: MCP Server for Task Management

## Overview
Build an MCP (Model Context Protocol) server that exposes task management operations as standardized tools. This enables the OpenAI agent to interact with the task database through a well-defined interface.

## Problem Statement
The AI agent needs a way to perform task operations (create, read, update, delete, complete) in response to user commands. Without MCP tools, the agent cannot interact with the database or execute user requests.

MCP provides a standardized protocol for exposing functions as tools that AI models can call. This creates a clean separation between AI logic (agent) and business logic (tools).

## User Stories

### US-1: Create Task via Natural Language
**As a** user  
**I want** to add tasks by telling the AI in natural language  
**So that** I don't need to use forms or buttons

**Acceptance Criteria:**
- AI can interpret "Add buy milk" and create a task
- Task is associated with the authenticated user
- AI confirms task creation with task details

### US-2: List Tasks via Natural Language
**As a** user  
**I want** to ask the AI to show my tasks  
**So that** I can see what I need to do

**Acceptance Criteria:**
- AI can interpret "Show my tasks" and list all tasks
- AI can filter by status when asked ("Show pending tasks")
- Tasks are only from the authenticated user

### US-3: Complete Task via Natural Language
**As a** user  
**I want** to tell the AI when I finish a task  
**So that** I can mark it complete conversationally

**Acceptance Criteria:**
- AI can interpret "I finished task 3" and mark it complete
- AI confirms completion with task details

### US-4: Delete Task via Natural Language
**As a** user  
**I want** to tell the AI to remove tasks  
**So that** I can clean up my list conversationally

**Acceptance Criteria:**
- AI can interpret "Delete task 5" and remove it
- AI confirms deletion with task details
- Only user's own tasks can be deleted

### US-5: Update Task via Natural Language
**As a** user  
**I want** to tell the AI to change task details  
**So that** I can correct or update tasks conversationally

**Acceptance Criteria:**
- AI can interpret "Change task 1 to 'Buy groceries and fruits'"
- AI updates title and/or description
- AI confirms update with new details

## Requirements

### Functional Requirements

#### FR-1: MCP Server Implementation
- Must use Official MCP Python SDK
- Must expose 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
- Must run as stdio transport (standard input/output)
- Must be stateless (no conversation memory in MCP server)
- Must connect to Neon PostgreSQL database

#### FR-2: Tool Definitions

Each tool must have:
- Clear name (verb_noun format: add_task, list_tasks)
- JSON schema for input parameters
- JSON schema for output/response
- Error handling for all failure cases
- User isolation (all operations filtered by user_id)

#### FR-3: Data Access
- All tools must filter by user_id for security
- Tools must use existing SQLModel models (Task)
- Tools must handle database connection errors
- Tools must validate input parameters

### Non-Functional Requirements

#### NFR-1: Performance
- Tool execution time: < 500ms per call
- Database queries optimized with indexes
- No N+1 query problems

#### NFR-2: Reliability
- Tools must be idempotent where possible
- Graceful error handling (no crashes)
- Database transactions for consistency
- Proper logging of all tool calls

#### NFR-3: Security
- User can only access their own tasks
- SQL injection prevention (parameterized queries)
- Input validation on all parameters
- No exposed internal errors to AI

## MCP Tools Specification

### Tool 1: add_task

**Purpose:** Create a new task for the user

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "User identifier"
    },
    "title": {
      "type": "string",
      "description": "Task title (1-200 characters)",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "Optional task description (max 1000 characters)",
      "maxLength": 1000
    }
  },
  "required": ["user_id", "title"]
}
```

**Output Schema:**
```json
{
  "task_id": 5,
  "status": "created",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Error Cases:**
- Title empty or too long → validation_error
- Database error → database_error

---

### Tool 2: list_tasks

**Purpose:** Retrieve tasks based on filter criteria

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "User identifier"
    },
    "status": {
      "type": "string",
      "enum": ["all", "pending", "completed"],
      "description": "Filter tasks by completion status",
      "default": "all"
    }
  },
  "required": ["user_id"]
}
```

**Output Schema:**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-02-07T10:30:00Z",
    "updated_at": "2024-02-07T10:30:00Z"
  },
  {
    "id": 2,
    "title": "Call mom",
    "completed": true,
    "created_at": "2024-02-06T15:20:00Z",
    "updated_at": "2024-02-07T09:15:00Z"
  }
]
```

**Error Cases:**
- Invalid status value → validation_error
- Database error → database_error

---

### Tool 3: complete_task

**Purpose:** Mark a task as completed

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "User identifier"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to complete"
    }
  },
  "required": ["user_id", "task_id"]
}
```

**Output Schema:**
```json
{
  "task_id": 3,
  "status": "completed",
  "title": "Call mom"
}
```

**Error Cases:**
- Task not found → task_not_found
- Task not owned by user → unauthorized
- Database error → database_error

---

### Tool 4: delete_task

**Purpose:** Remove a task from the database

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "User identifier"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to delete"
    }
  },
  "required": ["user_id", "task_id"]
}
```

**Output Schema:**
```json
{
  "task_id": 2,
  "status": "deleted",
  "title": "Old task"
}
```

**Error Cases:**
- Task not found → task_not_found
- Task not owned by user → unauthorized
- Database error → database_error

---

### Tool 5: update_task

**Purpose:** Modify task title or description

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "User identifier"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to update"
    },
    "title": {
      "type": "string",
      "description": "New task title",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "New task description",
      "maxLength": 1000
    }
  },
  "required": ["user_id", "task_id"]
}
```

**Output Schema:**
```json
{
  "task_id": 1,
  "status": "updated",
  "title": "Buy groceries and fruits",
  "description": "Updated description"
}
```

**Error Cases:**
- Task not found → task_not_found
- Task not owned by user → unauthorized
- Validation error → validation_error
- Database error → database_error

---

## MCP Server Architecture

### Server Configuration
```python
# backend/mcp/server.py
from mcp.server import Server, stdio_server
from mcp.types import Tool

server = Server("todo-mcp-server")

# Register tools
server.register_tool(add_task_tool)
server.register_tool(list_tasks_tool)
server.register_tool(complete_task_tool)
server.register_tool(delete_task_tool)
server.register_tool(update_task_tool)

# Run server with stdio transport
if __name__ == "__main__":
    stdio_server(server)
```

### Tool Implementation Pattern
```python
@server.tool()
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the user"""
    try:
        # Validate input
        if not title or len(title) > 200:
            return {"error": "validation_error", "message": "Title required (1-200 chars)"}
        
        # Create task
        task = Task(user_id=user_id, title=title, description=description)
        session.add(task)
        session.commit()
        
        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title,
            "description": task.description
        }
    except Exception as e:
        return {"error": "database_error", "message": str(e)}
```

## Dependencies
- Official MCP Python SDK: `pip install mcp`
- Existing Task model (from Phase II)
- Database connection (from Phase II)
- SQLModel session

## Success Criteria
- [ ] MCP server runs and accepts stdio input
- [ ] All 5 tools are registered and callable
- [ ] Tools correctly interact with database
- [ ] User isolation enforced (users can't access others' tasks)
- [ ] Error handling works for all error cases
- [ ] Tools can be called by OpenAI agent
- [ ] Performance: < 500ms per tool call

## Out of Scope
- Web-based MCP transport (only stdio)
- Tool chaining within MCP server
- Caching of tool results
- Rate limiting (handled at API level)
- Authentication (user_id passed from authenticated API)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP SDK breaking changes | High | Pin SDK version in requirements.txt |
| Database connection issues | High | Retry logic, connection pooling |
| Tool execution timeout | Medium | Set timeout, async execution |
| User_id spoofing | High | Validate user_id at API level before passing to MCP |

## References
- MCP Protocol Specification: https://modelcontextprotocol.io
- Official MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- Existing Task model: `backend/models.py`