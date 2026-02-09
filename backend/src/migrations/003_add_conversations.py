# Migration: Add Conversations and Messages tables
import asyncio
from backend.src.database import engine
from sqlmodel import text

async def upgrade():
    async with engine.connect() as conn:
        # Create conversations table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create messages table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                user_id VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        await conn.commit()

async def downgrade():
    async with engine.connect() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS messages"))
        await conn.execute(text("DROP TABLE IF EXISTS conversations"))
        await conn.commit()

if __name__ == "__main__":
    # This is a simplified migration runner
    print("Running migration 003_add_conversations...")
    # SQLModel's create_all is actually used in main.py startup
