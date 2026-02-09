# Architectural Plan: MCP Server for Task Management

## 1. Scope and Dependencies

### In Scope
- MCP server implementation using Official Python SDK
- 5 task management tools (add, list, complete, delete, update)
- Stdio transport for agent communication
- Database integration with existing Task model
- Error handling and input validation
- User isolation enforcement

### Out of Scope
- HTTP/WebSocket MCP transport
- Tool result caching
- Rate limiting (handled at API layer)
- Agent logic (separate feature)
- Authentication (handled at API layer)

### External Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| Official MCP Python SDK | MCP Community | ⚠️ Need to install |
| Task Model | Backend (Phase II) | ✅ Exists |
| Database Connection | Backend (Phase II) | ✅ Exists |
| SQLModel ORM | Backend (Phase II) | ✅ Installed |

## 2. Key Decisions and Rationale

### Decision 1: Stdio Transport vs HTTP

**Options Considered:**
1. Stdio (standard input/output)
2. HTTP REST endpoints
3. WebSocket transport

**Trade-offs:**

| Option | Pros | Cons |
|--------|------|------|
| Stdio ✅ | Simple, direct agent integration, standard MCP | Single process only |
| HTTP | Multiple clients, networkable | More complex, need auth |
| WebSocket | Real-time, bidirectional | Overkill for simple tools |

**Rationale:**
- Stdio chosen for simplicity and standard MCP usage
- Agent runs in same process/environment as MCP server
- Perfect for local/single-instance deployment
- Can upgrade to HTTP later if needed

**Principle:** Smallest viable change, standard protocol compliance

### Decision 2: Stateless Tools vs Stateful Server

**Options Considered:**
1. Stateless tools (no memory between calls)
2. Stateful server (remember previous calls)
3. Hybrid (cache some data)

**Rationale:**
- Stateless chosen for scalability and simplicity
- Each tool call is independent
- State stored in database, not server memory
- Server can restart without losing data
- Easier to test and debug

**Principle:** Stateless design, database as source of truth

### Decision 3: Direct Database Access vs API Calls

**Options Considered:**
1. Tools directly query database
2. Tools call existing REST API
3. Tools use shared service layer

**Rationale:**
- Direct database access chosen for performance
- Avoids HTTP overhead
- Reuses existing SQLModel models
- Simpler error handling
- Tools and API can share database session

**Principle:** Minimize latency, reuse existing code

### Decision 4: Error Format Standardization

**Options Considered:**
1. Exception-based errors
2. Result objects with success/failure
3. JSON error responses

**Rationale:**
- JSON error responses chosen for consistency
- AI can parse structured errors easily
- Consistent format across all tools
- Includes error code + human message
- No exception propagation to agent

**Principle:** Explicit errors, AI-friendly format

## 3. Interfaces and API Contracts

### MCP Server Interface

**Server Startup:**
```bash
python backend/mcp/server.py
# Waits for stdio input from agent
```

**Tool Call Format (JSON-RPC):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "add_task",
    "arguments": {
      "user_id": "user123",
      "title": "Buy milk"
    }
  },
  "id": 1
}
```

**Tool Response Format:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "task_id": 5,
    "status": "created",
    "title": "Buy milk"
  },
  "id": 1
}
```

**Error Response Format:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "error": "task_not_found",
    "message": "Task with ID 99 does not exist",
    "task_id": 99
  },
  "id": 1
}
```

### Tool Contracts

All tools MUST:
- Accept user_id as first parameter
- Return JSON object (success or error)
- Filter database queries by user_id
- Validate all inputs
- Handle all exceptions
- Execute in < 500ms

### Database Contract

Tools interact with database via:
- SQLModel session (existing from Phase II)
- Task model (existing from Phase II)
- Parameterized queries (SQL injection prevention)

## 4. Non-Functional Requirements and Budgets

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool execution time | < 500ms | Log timestamp before/after |
| Database query time | < 100ms | SQLAlchemy query logging |
| JSON serialization | < 10ms | Profile tool output |
| Startup time | < 2s | Time to first tool call |

**Performance Strategy:**
- Reuse database connection (don't recreate per call)
- Use indexes on task queries
- Batch operations where possible
- Profile slow tools

### Reliability

| SLO | Target |
|-----|--------|
| Tool success rate | > 95% |
| Database availability | > 99% (Neon SLA) |
| Error rate | < 5% |

**Degradation Strategy:**
- If database down, return database_error
- If tool times out, return timeout_error
- Agent can retry failed operations

### Security

- **Input Validation:** Validate all parameters before database access
- **User Isolation:** ALL queries filtered by user_id
- **SQL Injection:** Use parameterized queries only
- **Error Messages:** Don't expose internal details to agent
- **Secrets:** Database credentials from environment

### Cost

**Compute:**
- MCP server runs in same process as FastAPI
- Minimal additional CPU/memory
- Cost: $0 (no additional infrastructure)

**Database:**
- Uses existing Neon connection
- Standard CRUD queries (already budgeted)
- Cost: $0 (within existing usage)

## 5. Data Management and Migration

### Source of Truth
- Task data in database (Phase II schema)
- MCP server is stateless (no data storage)
- Tools are read-through to database

### Schema Evolution
- No new tables required (uses existing Task model)
- If Task schema changes, update tool responses accordingly
- Tools automatically reflect database state

### Data Consistency
- Tools use database transactions
- Multiple tool calls in sequence are independent
- No cross-tool state dependencies

## 6. Operational Readiness

### Observability

**Logs:**
```python
logger.info(f"Tool called: {tool_name}", extra={
    "user_id": user_id,
    "parameters": params,
    "execution_time_ms": elapsed
})
```

**Metrics:**
- Tool call count per tool
- Tool execution time (p50, p95, p99)
- Error rate per tool
- Database query count

**Traces:**
- Not applicable (synchronous tools)

### Alerting

- Tool error rate > 10% → Alert
- Database connection failures → Alert
- Tool execution > 1s → Warning

### Runbooks

**Common Tasks:**

1. **Start MCP Server:**
   ```bash
   cd backend
   python mcp/server.py
   ```

2. **Test Tool Manually:**
   ```bash
   echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"list_tasks","arguments":{"user_id":"test"}},"id":1}' | python mcp/server.py
   ```

3. **Check Tool Registration:**
   ```python
   from mcp.server import Server
   server = Server("todo-mcp-server")
   print(server.list_tools())
   ```

4. **Debug Tool Errors:**
   - Check logs for exception stack traces
   - Verify database connection
   - Test database query manually

### Deployment Strategy

- MCP server bundled with FastAPI app
- No separate deployment needed
- Started by chat API when needed
- Can run standalone for testing

### Feature Flags
- Not applicable (tools always available once deployed)
- Tools enabled/disabled via agent configuration

## 7. Risk Analysis and Mitigation

### Risk 1: MCP SDK API Changes
**Probability:** Medium  
**Impact:** High  
**Blast Radius:** MCP server non-functional  
**Mitigation:**
- Pin MCP SDK version: `mcp==0.1.0`
- Test with specific version before upgrade
- Monitor MCP SDK changelog
- Have rollback plan

**Kill Switch:** Revert to previous SDK version

### Risk 2: Database Connection Pool Exhaustion
**Probability:** Low  
**Impact:** High  
**Blast Radius:** All tools fail  
**Mitigation:**
- Reuse SQLModel session
- Don't create new connections per tool call
- Set max_overflow in connection pool
- Monitor connection count

**Guardrail:** Connection pool max size = 20

### Risk 3: Tool Execution Timeout
**Probability:** Medium  
**Impact:** Medium  
**Blast Radius:** Single tool call fails  
**Mitigation:**
- Set timeout on tool execution (5s)
- Optimize database queries
- Add indexes if needed
- Return timeout_error to agent

**Guardrail:** Timeout after 5 seconds

## 8. Evaluation and Validation

### Definition of Done
- [ ] MCP server runs with stdio transport
- [ ] All 5 tools registered and callable
- [ ] Tools query database correctly
- [ ] User isolation enforced
- [ ] Error handling for all error cases
- [ ] Input validation on all parameters
- [ ] Performance: < 500ms per tool
- [ ] Unit tests for all tools
- [ ] Integration tests with database
- [ ] Manual testing with sample data

### Tests

**Unit Tests:**
```python
def test_add_task_success():
    result = add_task(user_id="test", title="Buy milk")
    assert result["status"] == "created"
    assert result["title"] == "Buy milk"

def test_add_task_validation():
    result = add_task(user_id="test", title="")
    assert result["error"] == "validation_error"

def test_list_tasks_filter():
    # Create tasks
    add_task("user1", "Task 1")
    add_task("user2", "Task 2")
    
    # User1 should only see their task
    result = list_tasks("user1")
    assert len(result) == 1
```

**Integration Tests:**
```python
async def test_mcp_server_stdio():
    # Start server
    proc = await asyncio.create_subprocess_exec(
        "python", "mcp/server.py",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE
    )
    
    # Send tool call
    request = json.dumps({
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "list_tasks", "arguments": {"user_id": "test"}},
        "id": 1
    })
    
    proc.stdin.write(request.encode())
    response = await proc.stdout.readline()
    
    data = json.loads(response)
    assert data["jsonrpc"] == "2.0"
    assert "result" in data
```

### Output Validation
- All tools return valid JSON
- Error responses include error code and message
- Success responses match schema
- No unhandled exceptions

## 9. Architectural Decision Record

**Significant Decisions:**
1. Stdio transport for MCP server
2. Stateless tool design
3. Direct database access
4. Standardized error format

**ADR Recommendation:**
After implementation, create ADR if:
- MCP integration proves complex
- Performance issues require architecture changes
- Need to switch to HTTP transport