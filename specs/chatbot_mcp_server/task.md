# Tasks: MCP Server Implementation

## Task Breakdown

### Task 1: Install MCP SDK and Setup Project Structure
**Priority:** P0 (Blocker)  
**Estimate:** 20 minutes  
**Dependencies:** None  

**Description:**
Install the Official MCP Python SDK and create the MCP server directory structure.

**Acceptance Criteria:**
- [ ] MCP SDK installed: `pip install mcp`
- [ ] Directory created: `backend/mcp/`
- [ ] File created: `backend/mcp/__init__.py`
- [ ] File created: `backend/mcp/server.py`
- [ ] Dependencies added to `requirements.txt`

**Test Cases:**

```bash
# TC1.1: Verify MCP SDK installation
python -c "import mcp; print(mcp.__version__)"
# Should print version number

# TC1.2: Verify directory structure
ls backend/mcp/
# Should show: __init__.py, server.py
```

**Files to Create:**
- `backend/mcp/__init__.py` (empty file)
- `backend/mcp/server.py` (skeleton)
- Update `backend/requirements.txt`

**Commands:**
```bash
cd backend
pip install mcp
echo "mcp>=0.1.0" >> requirements.txt
mkdir -p mcp
touch mcp/__init__.py
touch mcp/server.py
```

---

### Task 2: Implement MCP Server Base Structure
**Priority:** P0 (Blocker)  
**Estimate:** 30 minutes  
**Dependencies:** Task 1  

**Description:**
Create the base MCP server with stdio transport and tool registration framework.

**Acceptance Criteria:**
- [ ] Server class instantiated with name "todo-mcp-server"
- [ ] Stdio transport configured
- [ ] Server can start and wait for input
- [ ] Logging configured
- [ ] Database connection imported

**Test Cases:**

```python
# TC2.1: Server starts without errors
async def test_server_startup():
    # Start server process
    proc = await start_mcp_server()
    assert proc.returncode is None  # Still running
    proc.terminate()

# TC2.2: Server responds to list_tools
async def test_list_tools():
    response = await call_mcp_method("tools/list")
    assert response["jsonrpc"] == "2.0"
    assert "result" in response
```

**Files to Modify:**
- `backend/mcp/server.py`

**Code Reference:**
```python
# backend/mcp/server.py

import logging
from mcp.server import Server
from mcp.server.stdio import stdio_server
from backend.db import get_session
from backend.models import Task

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create MCP server
app = Server("todo-mcp-server")

# Tool implementations will go here

async def main():
    """Run MCP server with stdio transport"""
    logger.info("Starting MCP server: todo-mcp-server")
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

---

### Task 3: Implement add_task Tool
**Priority:** P0 (Blocker)  
**Estimate:** 45 minutes  
**Dependencies:** Task 2  

**Description:**
Implement the add_task MCP tool with input validation and error handling.

**Acceptance Criteria:**
- [ ] Tool registered with MCP server
- [ ] Accepts user_id, title, description parameters
- [ ] Creates Task in database
- [ ] Returns task_id, status, title
- [ ] Validates title length (1-200 chars)
- [ ] Handles database errors gracefully

**Test Cases:**

```python
# TC3.1: Create task successfully
def test_add_task_success():
    result = add_task(user_id="test_user", title="Buy milk")
    assert result["status"] == "created"
    assert result["title"] == "Buy milk"
    assert "task_id" in result

# TC3.2: Validation - empty title
def test_add_task_empty_title():
    result = add_task(user_id="test_user", title="")
    assert result["error"] == "validation_error"

# TC3.3: Validation - title too long
def test_add_task_long_title():
    long_title = "x" * 201
    result = add_task(user_id="test_user", title=long_title)
    assert result["error"] == "validation_error"

# TC3.4: With description
def test_add_task_with_description():
    result = add_task(
        user_id="test_user",
        title="Buy groceries",
        description="Milk, eggs, bread"
    )
    assert result["status"] == "created"
    assert result["description"] == "Milk, eggs, bread"
```

**Files to Modify:**
- `backend/mcp/server.py` (add tool function)

**Code Reference:**
```python
@app.tool()
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """
    Create a new task for the user
    
    Args:
        user_id: User identifier
        title: Task title (1-200 characters)
        description: Optional task description
        
    Returns:
        dict: Task creation result with task_id, status, title
    """
    try:
        # Validate title
        if not title or len(title.strip()) == 0:
            return {
                "error": "validation_error",
                "message": "Title is required",
                "field": "title"
            }
        
        if len(title) > 200:
            return {
                "error": "validation_error",
                "message": "Title must be 200 characters or less",
                "field": "title"
            }
        
        # Validate description
        if description and len(description) > 1000:
            return {
                "error": "validation_error",
                "message": "Description must be 1000 characters or less",
                "field": "description"
            }
        
        # Create task
        session = get_session()
        task = Task(
            user_id=user_id,
            title=title.strip(),
            description=description.strip() if description else ""
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        
        logger.info(f"Created task {task.id} for user {user_id}")
        
        return {
            "task_id": task.id,
            "status": "created",
            "title": task.title,
            "description": task.description
        }
        
    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return {
            "error": "database_error",
            "message": "Failed to create task"
        }
```

---

### Task 4: Implement list_tasks Tool
**Priority:** P0 (Blocker)  
**Estimate:** 40 minutes  
**Dependencies:** Task 2  

**Description:**
Implement the list_tasks MCP tool with status filtering.

**Acceptance Criteria:**
- [ ] Tool registered with MCP server
- [ ] Accepts user_id and status parameters
- [ ] Filters by user_id (user isolation)
- [ ] Filters by status: all, pending, completed
- [ ] Returns array of task objects
- [ ] Handles empty results gracefully

**Test Cases:**

```python
# TC4.1: List all tasks
def test_list_tasks_all():
    # Create tasks
    add_task("user1", "Task 1")
    add_task("user1", "Task 2")
    
    result = list_tasks("user1", status="all")
    assert len(result) == 2

# TC4.2: Filter pending tasks
def test_list_tasks_pending():
    result = list_tasks("user1", status="pending")
    # All tasks should be pending initially
    assert all(not task["completed"] for task in result)

# TC4.3: User isolation
def test_list_tasks_isolation():
    add_task("user1", "User 1 Task")
    add_task("user2", "User 2 Task")
    
    user1_tasks = list_tasks("user1")
    assert len(user1_tasks) == 1
    assert user1_tasks[0]["title"] == "User 1 Task"

# TC4.4: Empty list
def test_list_tasks_empty():
    result = list_tasks("new_user", status="all")
    assert result == []
```

**Files to Modify:**
- `backend/mcp/server.py` (add tool function)

**Code Reference:**
```python
@app.tool()
async def list_tasks(user_id: str, status: str = "all") -> list:
    """
    List tasks for the user with optional status filter
    
    Args:
        user_id: User identifier
        status: Filter by status - "all", "pending", or "completed"
        
    Returns:
        list: Array of task objects
    """
    try:
        # Validate status
        if status not in ["all", "pending", "completed"]:
            return {
                "error": "validation_error",
                "message": "Status must be 'all', 'pending', or 'completed'",
                "field": "status"
            }
        
        session = get_session()
        query = session.query(Task).filter(Task.user_id == user_id)
        
        # Apply status filter
        if status == "pending":
            query = query.filter(Task.completed == False)
        elif status == "completed":
            query = query.filter(Task.completed == True)
        
        tasks = query.order_by(Task.created_at.desc()).all()
        
        logger.info(f"Listed {len(tasks)} tasks for user {user_id} (status={status})")
        
        return [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
            for task in tasks
        ]
        
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        return {
            "error": "database_error",
            "message": "Failed to list tasks"
        }
```

---

### Task 5: Implement complete_task Tool
**Priority:** P0 (Blocker)  
**Estimate:** 35 minutes  
**Dependencies:** Task 2  

**Description:**
Implement the complete_task MCP tool to mark tasks as done.

**Acceptance Criteria:**
- [ ] Tool registered with MCP server
- [ ] Accepts user_id and task_id parameters
- [ ] Updates task completed status to True
- [ ] Returns task_id, status, title
- [ ] Handles task not found error
- [ ] Handles unauthorized access (task belongs to different user)

**Test Cases:**

```python
# TC5.1: Complete task successfully
def test_complete_task_success():
    task_result = add_task("user1", "Task to complete")
    task_id = task_result["task_id"]
    
    result = complete_task("user1", task_id)
    assert result["status"] == "completed"
    assert result["task_id"] == task_id

# TC5.2: Task not found
def test_complete_task_not_found():
    result = complete_task("user1", task_id=99999)
    assert result["error"] == "task_not_found"

# TC5.3: Unauthorized access
def test_complete_task_unauthorized():
    task_result = add_task("user1", "User 1 Task")
    task_id = task_result["task_id"]
    
    result = complete_task("user2", task_id)
    assert result["error"] == "unauthorized"
```

**Files to Modify:**
- `backend/mcp/server.py` (add tool function)

**Code Reference:**
```python
@app.tool()
async def complete_task(user_id: str, task_id: int) -> dict:
    """
    Mark a task as completed
    
    Args:
        user_id: User identifier
        task_id: ID of the task to complete
        
    Returns:
        dict: Completion result with task_id, status, title
    """
    try:
        session = get_session()
        task = session.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if not task:
            # Check if task exists but belongs to different user
            other_task = session.query(Task).filter(Task.id == task_id).first()
            if other_task:
                return {
                    "error": "unauthorized",
                    "message": f"Task {task_id} does not belong to user",
                    "task_id": task_id
                }
            else:
                return {
                    "error": "task_not_found",
                    "message": f"Task with ID {task_id} does not exist",
                    "task_id": task_id
                }
        
        task.completed = True
        task.updated_at = datetime.utcnow()
        session.commit()
        
        logger.info(f"Completed task {task_id} for user {user_id}")
        
        return {
            "task_id": task.id,
            "status": "completed",
            "title": task.title
        }
        
    except Exception as e:
        logger.error(f"Error completing task: {e}")
        return {
            "error": "database_error",
            "message": "Failed to complete task"
        }
```

---

### Task 6: Implement delete_task Tool
**Priority:** P0 (Blocker)  
**Estimate:** 35 minutes  
**Dependencies:** Task 2  

**Description:**
Implement the delete_task MCP tool to remove tasks.

**Acceptance Criteria:**
- [ ] Tool registered with MCP server
- [ ] Accepts user_id and task_id parameters
- [ ] Deletes task from database
- [ ] Returns task_id, status, title
- [ ] Handles task not found error
- [ ] Handles unauthorized access

**Test Cases:**

```python
# TC6.1: Delete task successfully
def test_delete_task_success():
    task_result = add_task("user1", "Task to delete")
    task_id = task_result["task_id"]
    
    result = delete_task("user1", task_id)
    assert result["status"] == "deleted"
    
    # Verify task is gone
    tasks = list_tasks("user1")
    assert not any(t["id"] == task_id for t in tasks)

# TC6.2: Task not found
def test_delete_task_not_found():
    result = delete_task("user1", task_id=99999)
    assert result["error"] == "task_not_found"

# TC6.3: Unauthorized access
def test_delete_task_unauthorized():
    task_result = add_task("user1", "User 1 Task")
    task_id = task_result["task_id"]
    
    result = delete_task("user2", task_id)
    assert result["error"] == "unauthorized"
```

**Files to Modify:**
- `backend/mcp/server.py` (add tool function)

**Code Reference:**
```python
@app.tool()
async def delete_task(user_id: str, task_id: int) -> dict:
    """
    Delete a task
    
    Args:
        user_id: User identifier
        task_id: ID of the task to delete
        
    Returns:
        dict: Deletion result with task_id, status, title
    """
    try:
        session = get_session()
        task = session.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if not task:
            # Check if task exists but belongs to different user
            other_task = session.query(Task).filter(Task.id == task_id).first()
            if other_task:
                return {
                    "error": "unauthorized",
                    "message": f"Task {task_id} does not belong to user",
                    "task_id": task_id
                }
            else:
                return {
                    "error": "task_not_found",
                    "message": f"Task with ID {task_id} does not exist",
                    "task_id": task_id
                }
        
        title = task.title  # Save for response
        session.delete(task)
        session.commit()
        
        logger.info(f"Deleted task {task_id} for user {user_id}")
        
        return {
            "task_id": task_id,
            "status": "deleted",
            "title": title
        }
        
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return {
            "error": "database_error",
            "message": "Failed to delete task"
        }
```

---

### Task 7: Implement update_task Tool
**Priority:** P0 (Blocker)  
**Estimate:** 40 minutes  
**Dependencies:** Task 2  

**Description:**
Implement the update_task MCP tool to modify task details.

**Acceptance Criteria:**
- [ ] Tool registered with MCP server
- [ ] Accepts user_id, task_id, title, description parameters
- [ ] Updates task title and/or description
- [ ] At least one field (title or description) must be provided
- [ ] Returns task_id, status, updated title
- [ ] Validates title length if provided
- [ ] Handles task not found error
- [ ] Handles unauthorized access

**Test Cases:**

```python
# TC7.1: Update title only
def test_update_task_title():
    task_result = add_task("user1", "Original title")
    task_id = task_result["task_id"]
    
    result = update_task("user1", task_id, title="New title")
    assert result["status"] == "updated"
    assert result["title"] == "New title"

# TC7.2: Update description only
def test_update_task_description():
    task_result = add_task("user1", "Task")
    task_id = task_result["task_id"]
    
    result = update_task("user1", task_id, description="New desc")
    assert result["status"] == "updated"

# TC7.3: Update both fields
def test_update_task_both():
    task_result = add_task("user1", "Task")
    task_id = task_result["task_id"]
    
    result = update_task("user1", task_id, title="New", description="Desc")
    assert result["title"] == "New"

# TC7.4: Task not found
def test_update_task_not_found():
    result = update_task("user1", task_id=99999, title="New")
    assert result["error"] == "task_not_found"

# TC7.5: Unauthorized access
def test_update_task_unauthorized():
    task_result = add_task("user1", "Task")
    task_id = task_result["task_id"]
    
    result = update_task("user2", task_id, title="Hacked")
    assert result["error"] == "unauthorized"
```

**Files to Modify:**
- `backend/mcp/server.py` (add tool function)

**Code Reference:**
```python
@app.tool()
async def update_task(
    user_id: str,
    task_id: int,
    title: str = None,
    description: str = None
) -> dict:
    """
    Update task title and/or description
    
    Args:
        user_id: User identifier
        task_id: ID of the task to update
        title: New task title (optional)
        description: New task description (optional)
        
    Returns:
        dict: Update result with task_id, status, title
    """
    try:
        # At least one field must be provided
        if title is None and description is None:
            return {
                "error": "validation_error",
                "message": "At least one of title or description must be provided"
            }
        
        # Validate title if provided
        if title is not None:
            if len(title.strip()) == 0:
                return {
                    "error": "validation_error",
                    "message": "Title cannot be empty",
                    "field": "title"
                }
            if len(title) > 200:
                return {
                    "error": "validation_error",
                    "message": "Title must be 200 characters or less",
                    "field": "title"
                }
        
        # Validate description if provided
        if description is not None and len(description) > 1000:
            return {
                "error": "validation_error",
                "message": "Description must be 1000 characters or less",
                "field": "description"
            }
        
        session = get_session()
        task = session.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if not task:
            # Check if task exists but belongs to different user
            other_task = session.query(Task).filter(Task.id == task_id).first()
            if other_task:
                return {
                    "error": "unauthorized",
                    "message": f"Task {task_id} does not belong to user",
                    "task_id": task_id
                }
            else:
                return {
                    "error": "task_not_found",
                    "message": f"Task with ID {task_id} does not exist",
                    "task_id": task_id
                }
        
        # Update fields
        if title is not None:
            task.title = title.strip()
        if description is not None:
            task.description = description.strip()
        
        task.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(task)
        
        logger.info(f"Updated task {task_id} for user {user_id}")
        
        return {
            "task_id": task.id,
            "status": "updated",
            "title": task.title,
            "description": task.description
        }
        
    except Exception as e:
        logger.error(f"Error updating task: {e}")
        return {
            "error": "database_error",
            "message": "Failed to update task"
        }
```

---

### Task 8: Write Unit Tests
**Priority:** P1 (Important)  
**Estimate:** 60 minutes  
**Dependencies:** Tasks 3-7  

**Description:**
Create comprehensive unit tests for all MCP tools.

**Acceptance Criteria:**
- [ ] Test file created: `backend/tests/test_mcp_tools.py`
- [ ] Tests for all 5 tools
- [ ] Tests for success cases
- [ ] Tests for validation errors
- [ ] Tests for user isolation
- [ ] Tests for not found errors
- [ ] All tests pass

**Test Cases:**
See test cases in Tasks 3-7 above.

**Files to Create:**
- `backend/tests/test_mcp_tools.py`

---

### Task 9: Integration Testing
**Priority:** P1 (Important)  
**Estimate:** 30 minutes  
**Dependencies:** Task 8  

**Description:**
Test MCP server end-to-end with stdio transport.

**Acceptance Criteria:**
- [ ] Can start MCP server process
- [ ] Can send JSON-RPC requests via stdin
- [ ] Can receive JSON-RPC responses via stdout
- [ ] All tools callable via stdio
- [ ] Server handles errors gracefully

**Test Cases:**

```python
async def test_mcp_server_integration():
    # Start server
    proc = await asyncio.create_subprocess_exec(
        "python", "backend/mcp/server.py",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE
    )
    
    # Call add_task
    request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "add_task",
            "arguments": {"user_id": "test", "title": "Test task"}
        },
        "id": 1
    }
    
    proc.stdin.write(json.dumps(request).encode() + b'\n')
    await proc.stdin.drain()
    
    response = await proc.stdout.readline()
    data = json.loads(response)
    
    assert data["result"]["status"] == "created"
    
    proc.terminate()
```

**Files to Create:**
- `backend/tests/test_mcp_integration.py`

---

### Task 10: Documentation and Manual Testing
**Priority:** P2 (Nice to have)  
**Estimate:** 20 minutes  
**Dependencies:** Task 9  

**Description:**
Document the MCP server and test manually.

**Acceptance Criteria:**
- [ ] README created: `backend/mcp/README.md`
- [ ] Usage examples documented
- [ ] Manual testing performed
- [ ] Server can be started standalone

**Commands:**
```bash
# Start MCP server
cd backend
python mcp/server.py

# In another terminal, test manually
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_tasks","arguments":{"user_id":"test"}},"id":1}' | python mcp/server.py
```

---

## Task Summary

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| 1. Install MCP SDK | P0 | 20 min | None |
| 2. Server Base Structure | P0 | 30 min | Task 1 |
| 3. add_task Tool | P0 | 45 min | Task 2 |
| 4. list_tasks Tool | P0 | 40 min | Task 2 |
| 5. complete_task Tool | P0 | 35 min | Task 2 |
| 6. delete_task Tool | P0 | 35 min | Task 2 |
| 7. update_task Tool | P0 | 40 min | Task 2 |
| 8. Unit Tests | P1 | 60 min | Tasks 3-7 |
| 9. Integration Tests | P1 | 30 min | Task 8 |
| 10. Documentation | P2 | 20 min | Task 9 |

**Total Estimate:** 5 hours 35 minutes

---

## Execution Order

```
Task 1 (Install SDK) → Task 2 (Server Base)
                            ↓
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
        Task 3          Task 4          Task 5
      (add_task)    (list_tasks)   (complete_task)
            ↓               ↓               ↓
        Task 6          Task 7
     (delete_task)   (update_task)
            ↓               ↓
            └───────────────┼───────────────┘
                            ↓
                        Task 8 (Unit Tests)
                            ↓
                        Task 9 (Integration)
                            ↓
                        Task 10 (Docs)
```

---

## Definition of Done

All tasks completed AND:
- [ ] All 5 tools implemented and working
- [ ] All tests passing
- [ ] MCP server starts without errors
- [ ] Tools callable via stdio
- [ ] User isolation enforced
- [ ] Error handling complete
- [ ] Performance < 500ms per tool
- [ ] Documentation complete
- [ ] Ready for agent integration