from openai import OpenAI
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

# Import MCP tools from server
from mcp.server import (
    add_task,
    list_tasks,
    complete_task,
    delete_task,
    update_task
)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"  # Add this for Groq
)

# Define tools for OpenAI function calling (must match MCP tools)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID who owns the task"
                    },
                    "title": {
                        "type": "string",
                        "description": "Task title"
                    },
                    "description": {
                        "type": "string",
                        "description": "Task description"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "Task priority"
                    }
                },
                "required": ["user_id", "title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "Retrieve tasks from the list",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID whose tasks to retrieve"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["all", "pending", "completed"],
                        "description": "Filter by status"
                    }
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as complete",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID who owns the task"
                    },
                    "task_id": {
                        "type": "string",
                        "description": "Task ID to complete"
                    }
                },
                "required": ["user_id", "task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Remove a task from the list",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID who owns the task"
                    },
                    "task_id": {
                        "type": "string",
                        "description": "Task ID to delete"
                    }
                },
                "required": ["user_id", "task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Modify task properties",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID who owns the task"
                    },
                    "task_id": {
                        "type": "string",
                        "description": "Task ID to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "New task title"
                    },
                    "description": {
                        "type": "string",
                        "description": "New task description"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high"],
                        "description": "New task priority"
                    },
                    "category": {
                        "type": "string",
                        "description": "New task category"
                    }
                },
                "required": ["user_id", "task_id"]
            }
        }
    }
]

# Map function names to actual MCP tool functions
FUNCTION_MAP = {
    "add_task": add_task,
    "list_tasks": list_tasks,
    "complete_task": complete_task,
    "delete_task": delete_task,
    "update_task": update_task
}
    

def run_agent(messages: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
    """
    Run the OpenAI agent with conversation history and MCP tools
    
    Args:
        messages: List of conversation messages
        user_id: Current user ID
    
    Returns:
        Dictionary with response and tool_calls
    """
    try:
        print(f"=== Agent called with user_id: {user_id}")
        print(f"=== Messages: {messages}")
        
        # ... rest of the function
        
    except Exception as e:
        print(f"=== AGENT EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

    
    # System message for agent behavior
    system_message = {
        "role": "system",
        "content": """You are a helpful task management assistant. You help users manage their todo tasks through natural language conversation.

When users want to:
- Add/create/remember something → use add_task
- See/show/list tasks → use list_tasks (with appropriate filter)
- Complete/finish/done a task → use complete_task
- Delete/remove/cancel a task → use delete_task
- Change/update/rename a task → use update_task

Always confirm actions with friendly responses. Be conversational and helpful.
When listing tasks, present them in a clear, organized way.
If there are errors, explain them clearly to the user."""
    }
    
    # Combine system message with conversation history
    full_messages = [system_message] + messages
    
    tool_calls_made = []
    model="llama-3.3-70b-versatile"
    
    # Initial API call
    response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",  # Groq model
    messages=full_messages,
#     tools=TOOLS,
#     tool_choice="auto"
)
    
    assistant_message = response.choices[0].message
    
    # Handle tool calls
    if assistant_message.tool_calls:
        full_messages.append(assistant_message)
        
        for tool_call in assistant_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Ensure user_id is included
            if "user_id" not in function_args:
                function_args["user_id"] = user_id
            
            # Execute the MCP tool
            function_to_call = FUNCTION_MAP[function_name]
            function_response = function_to_call(**function_args)
            
            tool_calls_made.append({
                "tool": function_name,
                "arguments": function_args,
                "result": function_response
            })
            
            # Add tool response to messages
            full_messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": json.dumps(function_response)
            })
        
        # Get final response from agent
        second_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=full_messages
        )
        
        final_response = second_response.choices[0].message.content
    else:
        final_response = assistant_message.content
    
    return {
        "response": final_response,
        "tool_calls": tool_calls_made
    }