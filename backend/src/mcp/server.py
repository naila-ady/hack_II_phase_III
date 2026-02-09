# # import uuid
# # from datetime import datetime
# # from typing import Dict, List, Optional

# # # In-memory task storage
# # tasks_db: Dict[str, List[Dict]] = {}

# # def add_task(user_id: str, title: str, description: str = "", priority: str = "medium") -> Dict:
# #     if user_id not in tasks_db:
# #         tasks_db[user_id] = []
    
# #     task = {
# #         "id": str(uuid.uuid4()),
# #         "title": title,
# #         "description": description,
# #         "priority": priority,
# #         "status": "pending",
# #         "created_at": datetime.now().isoformat(),
# #         "completed_at": None
# #     }
    
# #     tasks_db[user_id].append(task)
# #     return {"success": True, "task": task}

# # def list_tasks(user_id: str, status: str = "all") -> Dict:
# #     user_tasks = tasks_db.get(user_id, [])
    
# #     if status == "pending":
# #         filtered = [t for t in user_tasks if t["status"] == "pending"]
# #     elif status == "completed":
# #         filtered = [t for t in user_tasks if t["status"] == "completed"]
# #     else:
# #         filtered = user_tasks
    
# #     return {"success": True, "tasks": filtered}

# # def complete_task(user_id: str, task_id: str) -> Dict:
# #     user_tasks = tasks_db.get(user_id, [])
    
# #     for task in user_tasks:
# #         if task["id"] == task_id:
# #             task["status"] = "completed"
# #             task["completed_at"] = datetime.now().isoformat()
# #             return {"success": True, "task": task}
    
# #     return {"success": False, "error": "Task not found"}

# # def delete_task(user_id: str, task_id: str) -> Dict:
# #     user_tasks = tasks_db.get(user_id, [])
    
# #     for i, task in enumerate(user_tasks):
# #         if task["id"] == task_id:
# #             deleted = user_tasks.pop(i)
# #             return {"success": True, "task": deleted}
    
# #     return {"success": False, "error": "Task not found"}

# # def update_task(user_id: str, task_id: str, **kwargs) -> Dict:
# #     user_tasks = tasks_db.get(user_id, [])
    
# #     for task in user_tasks:
# #         if task["id"] == task_id:
# #             if "title" in kwargs:
# #                 task["title"] = kwargs["title"]
# #             if "description" in kwargs:
# #                 task["description"] = kwargs["description"]
# #             if "priority" in kwargs:
# #                 task["priority"] = kwargs["priority"]
# #             if "category" in kwargs:
# #                 task["category"] = kwargs.get("category", "")
            
# #             return {"success": True, "task": task}
    
# #     return {"success": False, "error": "Task not found"}
# from sqlmodel import Session, select
# from database import engine
# from models.todo_model import Todo
# import uuid
# from datetime import datetime
# from typing import Dict

# def add_task(user_id: str, title: str, description: str = "", priority: str = "medium") -> Dict:
#     with Session(engine) as session:
#         todo = Todo(
#             user_id=uuid.UUID(user_id),
#             title=title,
#             description=description,
#             priority=priority,
#             completed=False
#         )
#         session.add(todo)
#         session.commit()
#         session.refresh(todo)
        
#         return {
#             "success": True, 
#             "task": {
#                 "id": str(todo.id),
#                 "title": todo.title,
#                 "description": todo.description,
#                 "priority": todo.priority,
#                 "completed": todo.completed
#             }
#         }

# def list_tasks(user_id: str, status: str = "all") -> Dict:
#     with Session(engine) as session:
#         statement = select(Todo).where(Todo.user_id == uuid.UUID(user_id))
        
#         if status == "pending":
#             statement = statement.where(Todo.completed == False)
#         elif status == "completed":
#             statement = statement.where(Todo.completed == True)
        
#         todos = session.exec(statement).all()
        
#         tasks = [
#             {
#                 "id": str(t.id),
#                 "title": t.title,
#                 "description": t.description,
#                 "priority": t.priority,
#                 "completed": t.completed
#             }
#             for t in todos
#         ]
        
#         return {"success": True, "tasks": tasks}

# def complete_task(user_id: str, task_id: str) -> Dict:
#     with Session(engine) as session:
#         todo = session.get(Todo, uuid.UUID(task_id))
        
#         if not todo or str(todo.user_id) != user_id:
#             return {"success": False, "error": "Task not found"}
        
#         todo.completed = True
#         session.add(todo)
#         session.commit()
#         session.refresh(todo)
        
#         return {"success": True, "task": {"id": str(todo.id), "title": todo.title, "completed": todo.completed}}

# def delete_task(user_id: str, task_id: str) -> Dict:
#     with Session(engine) as session:
#         todo = session.get(Todo, uuid.UUID(task_id))
        
#         if not todo or str(todo.user_id) != user_id:
#             return {"success": False, "error": "Task not found"}
        
#         session.delete(todo)
#         session.commit()
        
#         return {"success": True, "task": {"id": task_id, "title": todo.title}}

# def update_task(user_id: str, task_id: str, **kwargs) -> Dict:
#     with Session(engine) as session:
#         todo = session.get(Todo, uuid.UUID(task_id))
        
#         if not todo or str(todo.user_id) != user_id:
#             return {"success": False, "error": "Task not found"}
        
#         if "title" in kwargs:
#             todo.title = kwargs["title"]
#         if "description" in kwargs:
#             todo.description = kwargs["description"]
#         if "priority" in kwargs:
#             todo.priority = kwargs["priority"]
        
#         session.add(todo)
#         session.commit()
#         session.refresh(todo)
        
#         return {"success": True, "task": {"id": str(todo.id), "title": todo.title}}
from sqlmodel import Session, select
from database import engine
from models.todo_model import Todo
import uuid
from datetime import datetime
from typing import Dict

def add_task(user_id: str, title: str, description: str = "", priority: str = "medium") -> Dict:
    with Session(engine) as session:
        todo = Todo(
            user_id=uuid.UUID(user_id),
            title=title,
            description=description,
            priority=priority,
            completed=False
        )
        session.add(todo)
        session.commit()
        session.refresh(todo)
        
        return {
            "success": True, 
            "task": {
                "id": str(todo.id),
                "title": todo.title,
                "description": todo.description,
                "priority": todo.priority,
                "completed": todo.completed
            }
        }

def list_tasks(user_id: str, status: str = "all") -> Dict:
    with Session(engine) as session:
        statement = select(Todo).where(Todo.user_id == uuid.UUID(user_id))
        
        if status == "pending":
            statement = statement.where(Todo.completed == False)
        elif status == "completed":
            statement = statement.where(Todo.completed == True)
        
        todos = session.exec(statement).all()
        
        tasks = [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "completed": t.completed
            }
            for t in todos
        ]
        
        return {"success": True, "tasks": tasks}

def complete_task(user_id: str, task_id: str) -> Dict:
    with Session(engine) as session:
        todo = session.get(Todo, uuid.UUID(task_id))
        
        if not todo or str(todo.user_id) != user_id:
            return {"success": False, "error": "Task not found"}
        
        todo.completed = True
        session.add(todo)
        session.commit()
        session.refresh(todo)
        
        return {"success": True, "task": {"id": str(todo.id), "title": todo.title, "completed": todo.completed}}

def delete_task(user_id: str, task_id: str) -> Dict:
    with Session(engine) as session:
        todo = session.get(Todo, uuid.UUID(task_id))
        
        if not todo or str(todo.user_id) != user_id:
            return {"success": False, "error": "Task not found"}
        
        session.delete(todo)
        session.commit()
        
        return {"success": True, "task": {"id": task_id, "title": todo.title}}

def update_task(user_id: str, task_id: str, **kwargs) -> Dict:
    with Session(engine) as session:
        todo = session.get(Todo, uuid.UUID(task_id))
        
        if not todo or str(todo.user_id) != user_id:
            return {"success": False, "error": "Task not found"}
        
        if "title" in kwargs:
            todo.title = kwargs["title"]
        if "description" in kwargs:
            todo.description = kwargs["description"]
        if "priority" in kwargs:
            todo.priority = kwargs["priority"]
        
        session.add(todo)
        session.commit()
        session.refresh(todo)
        
        return {"success": True, "task": {"id": str(todo.id), "title": todo.title}}