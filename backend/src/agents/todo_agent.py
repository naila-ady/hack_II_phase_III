import json
import os
import logging
from typing import List, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv
from backend.src.services.mcp_client import mcp_client

load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are a helpful task management assistant. You help users manage their todo list through natural conversation.

## Your Capabilities
You can:
- Create new tasks (add_task)
- List tasks with filters (list_tasks)
- Mark tasks as complete (complete_task)
- Delete tasks (delete_task)
- Update task titles and descriptions (update_task)

## Behavior Guidelines
1. Be Conversational: Use friendly, natural language.
2. Infer User Intent: Map natural language to tool calls.
3. Handle Ambiguity: Ask clarifying questions if needed.
4. Confirm Actions: Always confirm what you did.
"""

async def run_agent(user_id: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"
User ID: {user_id}"}
    ] + messages
    
    try:
        # Define tools for the agent
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "add_task",
                    "description": "Create a new task for the user",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Task title"},
                            "description": {"type": "string", "description": "Optional task description"}
                        },
                        "required": ["title"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "List tasks for the user",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {"type": "string", "enum": ["all", "pending", "completed"], "default": "all"}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "complete_task",
                    "description": "Mark a task as completed",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "integer"}
                        },
                        "required": ["task_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Delete a task",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "integer"}
                        },
                        "required": ["task_id"]
                    }
                }
            }
        ]
        
        response = client.chat.completions.create(
            model="gpt-4o", # Using GPT-4o as per specs
            messages=full_messages,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        
        tool_results = []
        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                function_args["user_id"] = user_id
                
                result = await mcp_client.call_tool(function_name, **function_args)
                tool_results.append({
                    "tool": function_name,
                    "input": function_args,
                    "output": result
                })
            
            # (In a more advanced implementation, we would send results back to LLM for final response)
            return {
                "content": response_message.content or "I've processed your request with the task manager.",
                "tool_calls": tool_results
            }
            
        return {
            "content": response_message.content,
            "tool_calls": []
        }
        
    except Exception as e:
        logger.error(f"Agent error: {e}")
        return {
            "content": f"I encountered an error: {str(e)}",
            "tool_calls": []
        }
