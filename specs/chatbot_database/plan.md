# Architectural Plan: Chatbot Database Schema

## 1. Scope and Dependencies

### In Scope
- Create `conversations` table with proper foreign keys and indexes
- Create `messages` table with proper foreign keys and indexes
- Add SQLModel models for both tables
- Create database migration script
- Test migration on development database

### Out of Scope
- Modifying existing `users` or `tasks` tables
- Message search or full-text indexing
- Data encryption at rest
- Backup/restore procedures (handled by Neon)
- Connection pooling (already configured in Phase II)

### External Dependencies
| Dependency | Owner | Status |
|------------|-------|--------|
| Neon PostgreSQL Database | Infrastructure | ✅ Exists (Phase II) |
| Better Auth users table | Better Auth | ✅ Exists (Phase II) |
| SQLModel ORM | Python Backend | ✅ Installed (Phase II) |
| Database connection in db.py | Backend | ✅ Exists (Phase II) |

## 2. Key Decisions and Rationale

### Decision 1: Separate Conversations and Messages Tables

**Options Considered:**
1. Single table with conversation_id + message content
2. Two tables: conversations (metadata) + messages (content)
3. Document store (JSON) approach

**Trade-offs:**

| Option | Pros | Cons |
|--------|------|------|
| Single table | Simpler schema | Can't track conversation metadata separately |
| Two tables ✅ | Clear separation, better indexing | Slightly more complex queries |
| Document store | Flexible schema | Harder to query, no relational integrity |

**Rationale:**
- Two tables chosen for clear separation of concerns
- Enables efficient queries for "list recent conversations" without loading all messages
- Better indexing strategy (conversation-level vs message-level)
- Follows relational database best practices

**Principle:** Normalize data to 3NF, optimize with indexes

### Decision 2: Cascade Delete Strategy

**Options Considered:**
1. Soft delete (mark as deleted, keep data)
2. Cascade delete (automatic cleanup)
3. Prevent delete (require manual cleanup)

**Rationale:**
- Cascade delete chosen for automatic cleanup
- When user deleted, all conversations and messages automatically removed
- Simplifies data management
- Reduces orphaned data
- GDPR compliance (user can be fully removed)

**Principle:** Smallest viable change, automatic cleanup, data integrity

### Decision 3: Role Constraint (user | assistant)

**Options Considered:**
1. Free-text role field
2. Enum constraint with only 'user' and 'assistant'
3. Separate tables for user_messages and assistant_messages

**Rationale:**
- Check constraint ensures only valid roles
- Database-level validation prevents bad data
- Simpler than separate tables
- Extensible if needed (can add 'system' role later)

**Principle:** Fail fast, data integrity at database level

### Decision 4: Timestamp Strategy

**Options Considered:**
1. Single created_at on messages only
2. created_at + updated_at on both tables
3. Automatic triggers for updated_at

**Rationale:**
- `created_at` on both tables (immutable timestamp)
- `updated_at` on conversations only (for sorting recent chats)
- No automatic triggers (kept simple, updated in application code)
- UTC timestamps (database default)

**Principle:** Smallest viable change, explicit over implicit

## 3. Interfaces and API Contracts

### Database Schema Contract

#### Conversations Table
```sql
Field: id (SERIAL PRIMARY KEY)
Field: user_id (VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE)
Field: created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
Field: updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

Index: idx_conversations_user_id (user_id)
Index: idx_conversations_updated_at (updated_at DESC)
```

#### Messages Table
```sql
Field: id (SERIAL PRIMARY KEY)
Field: conversation_id (INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE)
Field: user_id (VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE)
Field: role (VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')))
Field: content (TEXT NOT NULL)
Field: created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

Index: idx_messages_conversation_id (conversation_id)
Index: idx_messages_created_at (created_at)
Index: idx_messages_user_id (user_id)
```

### SQLModel Contract

Models MUST match database schema exactly:
- Field names match column names
- Types match SQL types
- Foreign keys defined with Field(foreign_key="table.column")
- Indexes defined with Field(index=True)

### Migration Contract

Migration script MUST:
- Check if tables already exist (idempotent)
- Create tables in correct order (conversations before messages)
- Create indexes after table creation
- Be reversible (provide downgrade function)

## 4. Non-Functional Requirements and Budgets

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Conversation lookup by user_id | < 100ms | EXPLAIN ANALYZE query |
| Message history retrieval (100 msgs) | < 100ms | EXPLAIN ANALYZE query |
| Insert message | < 50ms | Database log |
| Update conversation timestamp | < 50ms | Database log |

**Performance Strategy:**
- Indexes on all foreign keys
- Index on updated_at for sorting
- No N+1 queries (fetch messages with single query)

### Reliability

| SLO | Target |
|-----|--------|
| Data durability | 99.99% (Neon guarantees) |
| Foreign key integrity | 100% (enforced by database) |
| Migration success rate | 100% (tested on dev first) |

**Degradation Strategy:**
- If migration fails, rollback and investigate
- If constraints fail, fix data before enforcing

### Security

- **Authentication:** All queries filtered by authenticated user_id
- **Authorization:** User can only access their own conversations
- **Data Handling:** No PII in messages (user content responsibility)
- **Secrets:** Database credentials in environment variables (already configured)
- **Auditing:** created_at timestamps for all records

### Cost

**Storage Estimate:**
- Average message: ~250 bytes
- 10,000 users × 50 messages each = 500,000 messages
- Total: ~125 MB
- Neon free tier: 3 GB (well within limits)

**Unit Economics:**
- Storage cost: $0 (within free tier)
- Query cost: Negligible (indexed queries)

## 5. Data Management and Migration

### Source of Truth
- Database schema = source of truth
- SQLModel models generated from schema (not vice versa)
- Migration scripts are version controlled

### Schema Evolution
- Use numbered migration files: `001_initial.py`, `002_add_tasks.py`, `003_add_conversations.py`
- Each migration is idempotent (checks existence before creating)
- Migrations run on application startup or via CLI

### Migration Strategy

**File:** `backend/migrations/003_add_conversations.py`

```python
async def upgrade(conn):
    # Create conversations table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
        ON conversations(user_id)
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
        ON conversations(updated_at DESC)
    """)
    
    # Create messages table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
        ON messages(conversation_id)
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_created_at 
        ON messages(created_at)
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_user_id 
        ON messages(user_id)
    """)

async def downgrade(conn):
    await conn.execute("DROP TABLE IF EXISTS messages CASCADE")
    await conn.execute("DROP TABLE IF EXISTS conversations CASCADE")
```

### Rollback Strategy
- Downgrade function drops tables
- Data loss on rollback (acceptable for new feature)
- Backup production database before migration

### Data Retention
- No automatic cleanup (keep all conversations)
- Future: Add cleanup job for conversations older than 90 days
- Document cleanup strategy for operations team

## 6. Operational Readiness

### Observability

**Logs:**
- Migration start/completion logged
- Table creation logged
- Index creation logged
- Any errors logged with full stack trace

**Metrics:**
- Table row counts (conversations, messages)
- Query performance (via EXPLAIN ANALYZE)
- Index usage (pg_stat_user_indexes)

**Traces:**
- Not applicable (one-time migration)

### Alerting
- Migration failure → Alert developer
- Foreign key violation → Alert developer (indicates application bug)

### Runbooks

**Common Tasks:**

1. **Run Migration:**
   ```bash
   cd backend
   python -m migrations.run 003
   ```

2. **Verify Tables:**
   ```sql
   \d conversations
   \d messages
   ```

3. **Check Indexes:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename IN ('conversations', 'messages');
   ```

4. **Rollback Migration:**
   ```bash
   python -m migrations.rollback 003
   ```

### Deployment Strategy
- Run migration on development database first
- Verify with test data
- Run on staging (if available)
- Run on production during low-traffic window
- Monitor for errors

### Feature Flags
- Not applicable (schema change, not feature)
- New tables only used by Phase III features (not yet deployed)

## 7. Risk Analysis and Mitigation

### Risk 1: Migration Fails on Production
**Probability:** Low  
**Impact:** High (blocks Phase III deployment)  
**Blast Radius:** Database only  
**Mitigation:**
- Test on development database first
- Test on staging database
- Have rollback script ready
- Run during low-traffic window
- Monitor migration logs

**Kill Switch:** Rollback migration if errors detected

### Risk 2: Performance Degradation
**Probability:** Low  
**Impact:** Medium  
**Blast Radius:** Database queries slower  
**Mitigation:**
- Indexes on all foreign keys
- Test with sample data (1000+ conversations)
- Use EXPLAIN ANALYZE to verify query plans
- Monitor query performance after deployment

**Guardrail:** Set alert threshold at 200ms for queries

### Risk 3: Data Integrity Issues
**Probability:** Very Low  
**Impact:** High  
**Blast Radius:** Orphaned records, data loss  
**Mitigation:**
- Foreign key constraints prevent orphaned messages
- Cascade delete ensures automatic cleanup
- Check constraint prevents invalid roles
- Test constraint enforcement

**Guardrail:** Database-level constraints cannot be bypassed

## 8. Evaluation and Validation

### Definition of Done
- [ ] Migration script created and tested on dev database
- [ ] Both tables created successfully with correct schema
- [ ] All indexes created
- [ ] Foreign key constraints enforced
- [ ] Check constraint on role field enforced
- [ ] SQLModel models created and match schema
- [ ] Sample data inserted successfully
- [ ] Queries return expected results
- [ ] Cascade delete tested
- [ ] Migration is idempotent (can run multiple times)
- [ ] Rollback script tested

### Tests

**Unit Tests:**
```python
def test_conversation_model():
    conv = Conversation(user_id="test_user")
    assert conv.user_id == "test_user"
    assert conv.created_at is not None

def test_message_model():
    msg = Message(
        conversation_id=1,
        user_id="test_user",
        role="user",
        content="Hello"
    )
    assert msg.role in ["user", "assistant"]
```

**Integration Tests:**
```python
async def test_cascade_delete():
    # Create conversation
    conv = Conversation(user_id="test_user")
    session.add(conv)
    session.commit()
    
    # Create message
    msg = Message(conversation_id=conv.id, user_id="test_user", role="user", content="Hi")
    session.add(msg)
    session.commit()
    
    # Delete conversation
    session.delete(conv)
    session.commit()
    
    # Verify message deleted
    assert session.query(Message).filter_by(id=msg.id).first() is None
```

### Output Validation
- Schema matches specification exactly
- Indexes exist on all specified fields
- Foreign keys enforce referential integrity
- Check constraint prevents invalid roles
- Timestamps default to current time

## 9. Architectural Decision Record

**Link to ADR:** TBD (create after implementation if significant decisions made)

**Significant Decisions:**
1. Two-table design (conversations + messages)
2. Cascade delete strategy
3. Role constraint enforcement
4. Indexing strategy

These decisions should be documented in an ADR if they prove to have long-term implications.
