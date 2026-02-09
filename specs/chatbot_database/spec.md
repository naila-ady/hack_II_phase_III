# Feature Spec: Chatbot Database Schema

## Overview
Extend the existing PostgreSQL database schema to support conversation persistence for the AI chatbot feature. This enables stateless server architecture where all conversation state is stored in the database.

## Problem Statement
Currently, the Phase II app has users and tasks tables. For Phase III (AI chatbot), we need to persist:
- Chat conversations (sessions)
- Individual messages within conversations (user and assistant messages)

Without conversation persistence, users would lose chat history on page refresh and the server couldn't maintain context across requests.

## User Stories

### US-1: Conversation Persistence
**As a** user  
**I want** my chat conversations to persist across sessions  
**So that** I can continue previous conversations and see my chat history

**Acceptance Criteria:**
- Conversations are stored in database with unique IDs
- Each conversation belongs to a specific user
- Conversations track creation and last update timestamps
- Conversations persist across browser refreshes and server restarts

### US-2: Message History
**As a** user  
**I want** all my messages and AI responses to be saved  
**So that** I can review past conversations and maintain context

**Acceptance Criteria:**
- Messages are stored with role (user/assistant)
- Messages are linked to specific conversations
- Messages maintain chronological order
- Messages persist across sessions

### US-3: User Data Isolation
**As a** user  
**I want** my conversations to be private  
**So that** other users cannot see my chat history

**Acceptance Criteria:**
- All conversations filtered by user_id
- All messages filtered by user_id
- Cascade delete when user is removed
- Foreign key constraints enforce data integrity

## Requirements

### Functional Requirements

#### FR-1: Conversations Table
- Must have auto-incrementing primary key
- Must reference users table via foreign key
- Must track created_at and updated_at timestamps
- Must cascade delete when user is deleted
- Must have index on user_id for fast lookups
- Must have index on updated_at for sorting recent conversations

#### FR-2: Messages Table
- Must have auto-incrementing primary key
- Must reference conversations table via foreign key
- Must reference users table via foreign key
- Must store role as either 'user' or 'assistant'
- Must store message content as text (unlimited length)
- Must track created_at timestamp
- Must cascade delete when conversation is deleted
- Must have index on conversation_id for fast history retrieval
- Must have index on created_at for chronological ordering

#### FR-3: Data Relationships
- One user has many conversations
- One conversation has many messages
- Each message belongs to one conversation and one user
- Referential integrity enforced via foreign keys

### Non-Functional Requirements

#### NFR-1: Performance
- Conversation lookup by user_id: < 100ms
- Message history retrieval: < 100ms for 100 messages
- Indexes optimized for common queries

#### NFR-2: Storage
- Text content unlimited (PostgreSQL TEXT type)
- Efficient storage for long conversations
- Estimated: ~250 bytes per message

#### NFR-3: Data Integrity
- Foreign key constraints prevent orphaned records
- Cascade deletes maintain referential integrity
- Check constraints enforce valid role values

## Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

### Messages Table

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

## SQLModel Definitions

### Conversation Model
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Message Model
```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, Literal

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    role: Literal["user", "assistant"] = Field(...)
    content: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
```

## Dependencies
- Existing `users` table (from Better Auth)
- PostgreSQL database connection
- SQLModel ORM
- Neon Serverless PostgreSQL

## Success Criteria
- [ ] Migration script creates both tables successfully
- [ ] Foreign key constraints are enforced
- [ ] Indexes improve query performance
- [ ] SQLModel models match database schema exactly
- [ ] Cascade delete works correctly
- [ ] Role check constraint prevents invalid values
- [ ] Sample data can be inserted and queried

## Out of Scope
- Message search functionality
- Conversation sharing between users
- Message encryption
- Conversation archiving
- Message editing or deletion by users
- Read receipts or typing indicators

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration fails on existing database | High | Test migration on dev database first |
| Performance issues with large conversations | Medium | Indexes on key fields; pagination if needed |
| Storage growth over time | Low | Document cleanup strategy for future |

## References
- Existing database schema (users, tasks tables)
- Phase II authentication system (Better Auth)
- PostgreSQL documentation
- SQLModel documentation