# Tasks: Chatbot Database Schema Implementation

## Task Breakdown

### Task 1: Add SQLModel Definitions to models.py
**Priority:** P0 (Blocker)  
**Estimate:** 30 minutes  
**Dependencies:** None  

**Description:**
Add `Conversation` and `Message` SQLModel classes to `backend/models.py` following the schema specification.

**Acceptance Criteria:**
- [ ] `Conversation` model added with all fields (id, user_id, created_at, updated_at)
- [ ] `Message` model added with all fields (id, conversation_id, user_id, role, content, created_at)
- [ ] Foreign keys defined with `Field(foreign_key="table.column")`
- [ ] Indexes defined with `Field(index=True)` where needed
- [ ] Role field uses `Literal["user", "assistant"]` type
- [ ] Models follow existing code style in models.py

**Test Cases:**

```python
# TC1.1: Conversation model instantiation
def test_conversation_creation():
    conv = Conversation(user_id="test_user_123")
    assert conv.user_id == "test_user_123"
    assert conv.id is None  # Not yet in database
    assert conv.created_at is not None
    assert conv.updated_at is not None

# TC1.2: Message model instantiation
def test_message_creation():
    msg = Message(
        conversation_id=1,
        user_id="test_user_123",
        role="user",
        content="Hello world"
    )
    assert msg.role == "user"
    assert msg.content == "Hello world"
    assert msg.created_at is not None

# TC1.3: Invalid role rejected
def test_invalid_role():
    # Type checker should catch this
    msg = Message(
        conversation_id=1,
        user_id="test_user_123",
        role="invalid",  # Should fail type check
        content="Test"
    )
    # This should raise validation error
```

**Files to Modify:**
- `backend/models.py` (add models at end)

**Code Reference:**
```python
# Add after existing Task model in backend/models.py

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    role: Literal["user", "assistant"] = Field(...)
    content: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
```

---

### Task 2: Create Migration Script
**Priority:** P0 (Blocker)  
**Estimate:** 45 minutes  
**Dependencies:** Task 1  

**Description:**
Create migration script `003_add_conversations.py` that creates both tables with proper indexes and constraints.

**Acceptance Criteria:**
- [ ] File created at `backend/migrations/003_add_conversations.py`
- [ ] `upgrade()` function creates conversations table with indexes
- [ ] `upgrade()` function creates messages table with indexes
- [ ] Check constraint added for role field
- [ ] Foreign key constraints defined correctly
- [ ] All CREATE statements use `IF NOT EXISTS` (idempotent)
- [ ] `downgrade()` function drops tables in correct order
- [ ] Migration is reversible

**Test Cases:**

```python
# TC2.1: Migration creates tables
async def test_migration_creates_tables():
    await upgrade(connection)
    
    # Verify conversations table exists
    result = await connection.fetch(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations')"
    )
    assert result[0]['exists'] is True
    
    # Verify messages table exists
    result = await connection.fetch(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages')"
    )
    assert result[0]['exists'] is True

# TC2.2: Migration creates indexes
async def test_migration_creates_indexes():
    await upgrade(connection)
    
    # Check conversations indexes
    indexes = await connection.fetch(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'conversations'"
    )
    index_names = [row['indexname'] for row in indexes]
    assert 'idx_conversations_user_id' in index_names
    assert 'idx_conversations_updated_at' in index_names

# TC2.3: Migration is idempotent
async def test_migration_idempotent():
    await upgrade(connection)
    # Run again - should not error
    await upgrade(connection)
    # Tables should still exist
    result = await connection.fetch(
        "SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('conversations', 'messages')"
    )
    assert result[0]['count'] == 2

# TC2.4: Downgrade removes tables
async def test_migration_downgrade():
    await upgrade(connection)
    await downgrade(connection)
    
    result = await connection.fetch(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations')"
    )
    assert result[0]['exists'] is False
```

**Files to Create:**
- `backend/migrations/003_add_conversations.py`

**Code Reference:**
See migration script in plan.md Section 5

---

### Task 3: Run Migration on Development Database
**Priority:** P0 (Blocker)  
**Estimate:** 15 minutes  
**Dependencies:** Task 2  

**Description:**
Execute the migration script against the development Neon database and verify tables are created correctly.

**Acceptance Criteria:**
- [ ] Migration executed successfully
- [ ] No errors in migration logs
- [ ] Both tables exist in database
- [ ] All indexes created
- [ ] Foreign keys enforced
- [ ] Check constraint on role field works

**Test Cases:**

```sql
-- TC3.1: Verify table structure
\d conversations
-- Should show: id, user_id, created_at, updated_at

\d messages
-- Should show: id, conversation_id, user_id, role, content, created_at

-- TC3.2: Verify indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('conversations', 'messages');
-- Should show all 5 indexes

-- TC3.3: Verify foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' 
AND conrelid::regclass::text IN ('conversations', 'messages');
-- Should show foreign key constraints

-- TC3.4: Test check constraint
INSERT INTO messages (conversation_id, user_id, role, content)
VALUES (1, 'test_user', 'invalid_role', 'Test');
-- Should fail with check constraint violation

-- TC3.5: Test cascade delete
INSERT INTO conversations (user_id) VALUES ('test_user') RETURNING id;
-- Note the id (e.g., 1)
INSERT INTO messages (conversation_id, user_id, role, content)
VALUES (1, 'test_user', 'user', 'Hello');
DELETE FROM conversations WHERE id = 1;
-- Messages should be deleted automatically
SELECT COUNT(*) FROM messages WHERE conversation_id = 1;
-- Should return 0
```

**Commands:**
```bash
cd backend
python -m migrations.run 003

# Or if using Alembic:
alembic upgrade head
```

---

### Task 4: Create Database Helper Functions
**Priority:** P1 (Important)  
**Estimate:** 30 minutes  
**Dependencies:** Task 3  

**Description:**
Create helper functions in `backend/db.py` or new file for common conversation/message operations.

**Acceptance Criteria:**
- [ ] Function to create new conversation
- [ ] Function to get conversation by ID
- [ ] Function to get user's conversations
- [ ] Function to create new message
- [ ] Function to get conversation messages
- [ ] Function to update conversation timestamp
- [ ] All functions filter by user_id for security

**Test Cases:**

```python
# TC4.1: Create conversation
async def test_create_conversation():
    conv_id = await create_conversation(user_id="test_user")
    assert conv_id > 0
    
    conv = await get_conversation(conv_id, user_id="test_user")
    assert conv.user_id == "test_user"

# TC4.2: Get user's conversations
async def test_get_user_conversations():
    await create_conversation(user_id="user1")
    await create_conversation(user_id="user1")
    await create_conversation(user_id="user2")
    
    user1_convs = await get_user_conversations(user_id="user1")
    assert len(user1_convs) == 2

# TC4.3: Create message
async def test_create_message():
    conv_id = await create_conversation(user_id="test_user")
    msg_id = await create_message(
        conversation_id=conv_id,
        user_id="test_user",
        role="user",
        content="Hello"
    )
    assert msg_id > 0

# TC4.4: Get conversation messages
async def test_get_messages():
    conv_id = await create_conversation(user_id="test_user")
    await create_message(conv_id, "test_user", "user", "Hello")
    await create_message(conv_id, "test_user", "assistant", "Hi there")
    
    messages = await get_conversation_messages(conv_id, user_id="test_user")
    assert len(messages) == 2
    assert messages[0].role == "user"
    assert messages[1].role == "assistant"

# TC4.5: User isolation
async def test_user_isolation():
    conv_id = await create_conversation(user_id="user1")
    
    # User2 should not access user1's conversation
    conv = await get_conversation(conv_id, user_id="user2")
    assert conv is None
```

**Files to Create/Modify:**
- `backend/db_helpers.py` (new file) OR
- Add functions to `backend/db.py`

**Code Reference:**
```python
# backend/db_helpers.py or backend/db.py

async def create_conversation(user_id: str) -> int:
    """Create new conversation and return ID"""
    conv = Conversation(user_id=user_id)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv.id

async def get_conversation(conv_id: int, user_id: str) -> Optional[Conversation]:
    """Get conversation if owned by user"""
    return session.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == user_id
    ).first()

async def get_user_conversations(user_id: str, limit: int = 20) -> List[Conversation]:
    """Get user's recent conversations"""
    return session.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(Conversation.updated_at.desc()).limit(limit).all()

async def create_message(
    conversation_id: int,
    user_id: str,
    role: str,
    content: str
) -> int:
    """Create message and update conversation timestamp"""
    msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content
    )
    session.add(msg)
    
    # Update conversation timestamp
    conv = session.query(Conversation).filter_by(id=conversation_id).first()
    conv.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(msg)
    return msg.id

async def get_conversation_messages(
    conversation_id: int,
    user_id: str
) -> List[Message]:
    """Get all messages in conversation"""
    return session.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.user_id == user_id
    ).order_by(Message.created_at.asc()).all()
```

---

### Task 5: Write Unit Tests
**Priority:** P1 (Important)  
**Estimate:** 45 minutes  
**Dependencies:** Task 4  

**Description:**
Create comprehensive unit tests for models and helper functions.

**Acceptance Criteria:**
- [ ] Test file created: `backend/tests/test_conversations.py`
- [ ] Tests for Conversation model
- [ ] Tests for Message model
- [ ] Tests for helper functions
- [ ] Tests for cascade delete
- [ ] Tests for user isolation
- [ ] All tests pass

**Test Cases:**
See test cases defined in Tasks 1-4 above.

**Files to Create:**
- `backend/tests/test_conversations.py`

---

### Task 6: Manual Verification and Documentation
**Priority:** P2 (Nice to have)  
**Estimate:** 20 minutes  
**Dependencies:** Task 5  

**Description:**
Manually verify the database schema and document the changes.

**Acceptance Criteria:**
- [ ] Connect to database with psql or GUI tool
- [ ] Verify table structures match spec
- [ ] Insert test data and verify queries work
- [ ] Test cascade delete manually
- [ ] Update README or docs with schema changes
- [ ] Screenshot of table structure (optional)

**Test Cases:**

```sql
-- TC6.1: Manual table verification
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('conversations', 'messages')
ORDER BY table_name, ordinal_position;

-- TC6.2: Insert test data
INSERT INTO conversations (user_id) 
VALUES ('manual_test_user') 
RETURNING *;

INSERT INTO messages (conversation_id, user_id, role, content)
VALUES (1, 'manual_test_user', 'user', 'Test message')
RETURNING *;

-- TC6.3: Query test
SELECT c.id, c.created_at, COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.user_id = 'manual_test_user'
GROUP BY c.id;

-- TC6.4: Cleanup test data
DELETE FROM conversations WHERE user_id = 'manual_test_user';
```

**Documentation Updates:**
- Add schema diagram to README
- Document new tables in database documentation
- Add migration notes

---

## Task Summary

| Task | Priority | Estimate | Dependencies |
|------|----------|----------|--------------|
| 1. Add SQLModel Definitions | P0 | 30 min | None |
| 2. Create Migration Script | P0 | 45 min | Task 1 |
| 3. Run Migration | P0 | 15 min | Task 2 |
| 4. Create Helper Functions | P1 | 30 min | Task 3 |
| 5. Write Unit Tests | P1 | 45 min | Task 4 |
| 6. Manual Verification | P2 | 20 min | Task 5 |

**Total Estimate:** 3 hours 5 minutes

---

## Execution Order

```
Task 1 (Models) → Task 2 (Migration) → Task 3 (Run Migration)
                                              ↓
                                         Task 4 (Helpers)
                                              ↓
                                         Task 5 (Tests)
                                              ↓
                                         Task 6 (Verify)
```

---

## Definition of Done

All tasks completed AND:
- [ ] All tests passing
- [ ] Migration successful on dev database
- [ ] Code reviewed (self-review or peer)
- [ ] Documentation updated
- [ ] No linter errors
- [ ] Ready for next feature (MCP server)