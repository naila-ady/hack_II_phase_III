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
You are a helpful todo list assistant. Users can ask you to:
- Add tasks (e.g., "remember to buy milk")
- List tasks (e.g., "show my tasks", "what's pending?")
- Complete tasks (e.g., "mark task 3 as done")
- Delete tasks (e.g., "remove the meeting task")
- Update tasks (e.g., "change task 1 to 'call mom tonight'")

Always use the available tools to manage tasks. Confirm actions in a friendly way.
"""

async def run_agent(user_id: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT + f"\nUser ID: {user_id}"}
    ] + messages
    
    try:
        # Define tools for the agent
        tools = [
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
            {
                "type": "function",
                "function": {
                    "name": "list_tasks",
                    "description": "List all tasks for the user",
                    "parameters": {
                        "type": "object",
                        "properties": {}
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
            }
        ]
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
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