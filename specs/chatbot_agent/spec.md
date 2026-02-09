# Feature Spec: OpenAI Agent for Task Management

## Overview
Configure and integrate the OpenAI Agents SDK to power the AI chatbot. The agent interprets user natural language, decides which MCP tools to call, and generates conversational responses.

## Problem Statement
Users want to manage tasks through natural conversation, not forms and buttons. The agent needs to:
- Understand natural language commands ("Add buy milk", "Show my tasks", "I finished task 3")
- Decide which MCP tool(s) to call based on user intent
- Call tools with correct parameters
- Generate friendly, conversational responses
- Handle ambiguous requests intelligently

Without the agent, MCP tools are just raw functions with no intelligence.

## User Stories

### US-1: Natural Language Task Creation
**As a** user  
**I want** to create tasks by saying what I need to do  
**So that** I can quickly capture tasks without filling out forms

**Acceptance Criteria:**
- Agent understands "Add buy milk" means call add_task
- Agent extracts title from user message
- Agent confirms task creation naturally
- Works with variations: "Remind me to...", "I need to...", "Create task for..."

### US-2: Intelligent Task Retrieval
**As a** user  
**I want** to ask about my tasks conversationally  
**So that** I can see what I need to do

**Acceptance Criteria:**
- Agent understands "Show my tasks", "What do I need to do?", "List pending items"
- Agent calls list_tasks with appropriate filter
- Agent formats results in readable list
- Agent mentions task count

### US-3: Contextual Task Completion
**As a** user  
**I want** to mark tasks complete conversationally  
**So that** I don't need to click buttons

**Acceptance Criteria:**
- Agent understands "I finished task 3", "Mark 5 as done", "Completed buying milk"
- Agent finds task by ID or title
- Agent confirms completion
- Works with fuzzy matching on titles

### US-4: Multi-Step Operations
**As a** user  
**I want** the agent to handle complex requests  
**So that** I can accomplish multiple things in one message

**Acceptance Criteria:**
- "Delete task 2 and show what's left" → delete, then list
- "Add buy milk and show all my tasks" → add, then list
- Agent chains multiple tool calls correctly

### US-5: Helpful Error Handling
**As a** user  
**I want** clear feedback when something goes wrong  
**So that** I know what to do next

**Acceptance Criteria:**
- Task not found → "I couldn't find task 99. Could you check the ID?"
- Ambiguous request → Agent asks clarifying question
- Tool failure → Friendly error message (not technical jargon)

## Requirements

### Functional Requirements

#### FR-1: Agent Configuration
- Must use OpenAI Agents SDK
- Must use gpt-4o model (or gpt-4-turbo)
- Must have clear system instructions
- Must integrate with MCP tools
- Must maintain conversation context

#### FR-2: Intent Recognition
Agent must recognize these intents:
- **Create task:** "Add", "Create", "Remind me", "I need to"
- **List tasks:** "Show", "List", "What are", "What do I have"
- **Complete task:** "Done", "Finished", "Completed", "Mark as complete"
- **Delete task:** "Delete", "Remove", "Cancel"
- **Update task:** "Change", "Update", "Rename", "Edit"

#### FR-3: Tool Calling
- Agent must call MCP tools with correct parameters
- Agent must handle tool responses
- Agent must chain multiple tools when needed
- Agent must pass user_id to all tool calls

#### FR-4: Response Generation
- Responses must be conversational and friendly
- Agent must confirm actions with details
- Agent must ask for clarification when ambiguous
- Agent must format lists and data readably

### Non-Functional Requirements

#### NFR-1: Performance
- Agent response time: < 3 seconds (includes tool calls)
- Tool calling overhead: < 500ms
- Total latency: < 4 seconds

#### NFR-2: Accuracy
- Intent recognition accuracy: > 90%
- Tool parameter extraction: > 95%
- Context retention: 100% within conversation

#### NFR-3: Cost
- Use gpt-4o (cheaper than gpt-4-turbo)
- Average tokens per request: ~500 input, ~150 output
- Target: < $0.002 per conversation turn

## Agent Configuration

### System Instructions

```markdown
You are a helpful task management assistant. You help users manage their todo list through natural conversation.

## Your Capabilities
You can:
- Create new tasks (add_task)
- List tasks with filters (list_tasks)
- Mark tasks as complete (complete_task)
- Delete tasks (delete_task)
- Update task titles and descriptions (update_task)

## Behavior Guidelines

### 1. Be Conversational
- Use friendly, natural language
- Acknowledge the user's request before executing
- Provide confirmations after actions
- Ask for clarification if the request is ambiguous

### 2. Infer User Intent
When users say:
- "Add...", "Create...", "Remember..." → Use add_task
- "Show...", "List...", "What are..." → Use list_tasks
- "Done with...", "Completed...", "Finished..." → Use complete_task
- "Remove...", "Delete...", "Cancel..." → Use delete_task
- "Change...", "Update...", "Rename..." → Use update_task

### 3. Handle Ambiguity
If the user says "delete the meeting task" but there are multiple tasks with "meeting":
- List the matching tasks
- Ask which specific task to delete
- Use task IDs to disambiguate

### 4. Provide Context
When listing tasks:
- Group by status if helpful (pending vs completed)
- Mention the total count
- Highlight urgent tasks if due dates exist

### 5. Confirm Actions
After creating, updating, or deleting:
- Confirm what you did
- Repeat the task title
- Provide next steps or ask if there's anything else

### 6. Handle Errors Gracefully
If a tool fails:
- Don't expose technical error messages
- Explain what went wrong in user-friendly terms
- Suggest alternatives or next steps

### 7. Stay Focused
- You are a todo assistant, not a general chatbot
- Politely redirect off-topic questions
- Keep responses concise and actionable

## Examples

User: "I need to buy groceries tomorrow"
You: I've added "Buy groceries tomorrow" to your task list. Anything else you'd like me to add?

User: "What do I need to do today?"
You: You have 3 pending tasks:
1. Buy groceries tomorrow
2. Call dentist
3. Finish project report
Would you like me to mark any of these as complete?

User: "I finished the report"
You: Great! I've marked "Finish project report" as complete. You now have 2 pending tasks remaining.

User: "What's the weather like?"
You: I'm a task management assistant, so I can't check the weather. But I can help you add a reminder to check the weather forecast if you'd like!
```

### Model Configuration

```python
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

agent_config = {
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000,
    "instructions": SYSTEM_INSTRUCTIONS,
    "tools": mcp_tools  # MCP tools converted to function calling format
}
```

## MCP Tool Integration

### Converting MCP Tools to Function Calling Format

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task for the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier"},
                    "title": {"type": "string", "description": "Task title (1-200 characters)"},
                    "description": {"type": "string", "description": "Optional task description"}
                },
                "required": ["user_id", "title"]
            }
        }
    },
    # ... other tools
]
```

## Agent Execution Flow

```python
def run_agent(user_id: str, messages: list[dict]) -> tuple[str, list]:
    """
    Run the agent with conversation history
    
    Args:
        user_id: Current user ID to inject into tool calls
        messages: Full conversation history
        
    Returns:
        (response_text, tool_calls_metadata)
    """
    
    # Add user_id context for tool calls
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    # Handle tool calls
    while response.choices[0].finish_reason == "tool_calls":
        tool_calls = response.choices[0].message.tool_calls
        
        for tool_call in tool_calls:
            # Execute MCP tool
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)
            
            # Inject user_id
            tool_args["user_id"] = user_id
            
            # Call MCP server
            result = call_mcp_tool(tool_name, tool_args)
            
            # Add tool result to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })
        
        # Continue conversation with tool results
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools
        )
    
    # Extract final response and metadata
    response_text = response.choices[0].message.content
    tool_calls_metadata = extract_tool_metadata(messages)
    
    return response_text, tool_calls_metadata
```

## Dependencies
- OpenAI Python SDK: `pip install openai`
- OpenAI API key (environment variable)
- MCP server (from chatbot-mcp-server feature)
- Conversation context (from chat API)

## Success Criteria
- [ ] Agent correctly interprets natural language commands
- [ ] Agent calls appropriate MCP tools
- [ ] Agent generates conversational responses
- [ ] Agent handles multi-tool chains
- [ ] Agent provides helpful error messages
- [ ] Agent stays on topic (task management)
- [ ] Intent recognition > 90% accuracy
- [ ] Response time < 3 seconds

## Out of Scope
- Multi-language support (English only)
- Voice input/output
- Proactive task suggestions
- Task prioritization/scheduling
- Integration with external calendars
- Sentiment analysis

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API rate limits | High | Implement exponential backoff |
| High cost with gpt-4 | Medium | Use gpt-4o (cheaper), set token limits |
| Intent misinterpretation | Medium | Improve system instructions, add examples |
| Tool calling errors | Medium | Robust error handling, retry logic |

## References
- OpenAI Agents SDK: https://platform.openai.com/docs/assistants
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- MCP Tools (chatbot-mcp-server feature)