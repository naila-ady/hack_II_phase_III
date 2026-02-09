# from fastapi import FastAPI
# from api.todo_router import router as todo_router
# from api.auth_router import router as auth_router
# from api.chatbot_router import router as chatbot_router
# from fastapi.middleware.cors import CORSMiddleware
# import uvicorn
# from database import engine
# from models.todo_model import Todo
# from models.user_model import User
# from models.chatbot_model import Conversation, Message

# app = FastAPI(
#     title="Todo API",
#     description="A simple todo application API with authentication",
#     version="1.0.0"
# )

# # Add CORS middleware
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # Get allowed origins from environment variables
# allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
# if not allowed_origins or allowed_origins == [""]:
#     # Default to allowing all in development, but in production specify exact origins
#     if os.getenv("DEBUG", "True").lower() == "true":
#         allowed_origins = ["*"]
#     else:
#         # In production, allow common origins including Vercel deployments
#         allowed_origins = [
#             "https://nkamdar-chatbot-task-tracker.hf.space",
#             "https://phase-iii-hackthon-2.vercel.app/",
#         ]
# else:
#     # Clean up any empty strings from the split
#     allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#         "https://nkamdar-chatbot-task-tracker.hf.space",
#         "https://phase-iii-hackthon-2.vercel.app"
#     ],
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
#     allow_headers=["*"],
# )
# # Create database tables
# @app.on_event("startup")
# def on_startup():
#     Todo.metadata.create_all(bind=engine)
#     User.metadata.create_all(bind=engine)
#     Conversation.metadata.create_all(bind=engine)
#     Message.metadata.create_all(bind=engine)

# # Include routers
# app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
# app.include_router(todo_router, prefix="/api/v1", tags=["todos"])
# app.include_router(chatbot_router, prefix="/api/v1", tags=["chatbot"])

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to the Todo API"}

# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)
from fastapi import FastAPI
from api.todo_router import router as todo_router
from api.auth_router import router as auth_router
from api.chatbot_router import router as chatbot_router
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine
from models.todo_model import Todo
from models.user_model import User
from models.chatbot_model import Conversation, Message

app = FastAPI(
    title="Todo API",
    description="A simple todo application API with authentication",
    version="1.0.0"
)

# CORS - MUST be before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
@app.on_event("startup")
def on_startup():
    Todo.metadata.create_all(bind=engine)
    User.metadata.create_all(bind=engine)
    Conversation.metadata.create_all(bind=engine)
    Message.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(todo_router, prefix="/api/v1", tags=["todos"])
# app.include_router(chatbot_router, prefix="/api/v1", tags=["chatbot"])
app.include_router(chatbot_router, prefix="/api/v1/chatbot", tags=["chatbot"])
@app.get("/api/v1/health")
def health():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Todo API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)