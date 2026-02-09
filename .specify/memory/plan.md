# Todo AI Chatbot - Implementation Plan

## Project Overview
**Phase:** III - AI Chatbot Interface  
**Approach:** Agentic Dev Stack (Spec → Plan → Tasks → Claude Code)  
**No Manual Coding:** All implementation via Claude Code

---

## Technology Stack - NON-NEGOTIABLE

These technologies are **locked in** and cannot be substituted:

| Component | Technology | Implementation Phase |
|-----------|-----------|---------------------|
| **Frontend** | OpenAI ChatKit | Phase 5 |
| **Backend** | Python FastAPI | Phase 3 |
| **AI Framework** | OpenAI Agents SDK | Phase 4 |
| **MCP Server** | Official MCP SDK | Phase 2 |
| **ORM** | SQLModel | Phase 1, 2, 3 |
| **Database** | Neon Serverless PostgreSQL | Phase 1 |
| **Authentication** | Better Auth | Phase 3.3 |

**Stack Constraints:**
- ❌ No alternative frontend frameworks (React, Vue, etc.)
- ❌ No alternative AI frameworks (LangChain, custom agents, etc.)
- ❌ No alternative ORMs (SQLAlchemy, Prisma, etc.)
- ❌ No alternative databases (MySQL, MongoDB, etc.)
- ❌ No alternative auth solutions (Auth0, Clerk, custom JWT, etc.)
- ✅ Only the listed technologies are permitted

---

## Phase 1: Foundation Setup (Database & Core Models)

### 1.1 Database Schema Setup
**Deliverable:** Working PostgreSQL database with all tables

**Tasks:**
- [ ] Set up Neon Serverless PostgreSQL instance
- [ ] Create SQLModel base configuration
- [ ] Define `Task` model with fields: user_id, id, title, description, completed, created_at, updated_at
- [ ] Define `Conversation` model with fields: user_id, id, created_at, updated_at
- [ ] Define `Message` model with fields: user_id, id, conversation_id, role, content, created_at
- [ ] Create database migration scripts
- [ ] Add foreign key relationships (Message → Conversation)
- [ ] Add indexes for user_id and conversation_id
- [ ] Test database connection and CRUD operations

**Acceptance Criteria:**
- ✅ All three tables created successfully
- ✅ Foreign keys enforce referential integrity
- ✅ Timestamps auto-populate on create/update
- ✅ Migration scripts are idempotent

---

## Phase 2: MCP Server Implementation

### 2.1 MCP Server Core Setup
**Deliverable:** Functional MCP server with Official MCP SDK

**Tasks:**
- [ ] Initialize MCP server project structure
- [ ] Install Official MCP SDK dependencies
- [ ] Configure MCP server to connect to Neon database
- [ ] Set up SQLModel database session management
- [ ] Create MCP server initialization and startup logic
- [ ] Implement stateless architecture (no in-memory state)

**Acceptance Criteria:**
- ✅ MCP server starts without errors
- ✅ Database connection successful
- ✅ Server restarts don't lose data

### 2.2 Implement MCP Tools
**Deliverable:** Five working MCP tools for task operations

**Tool 1: add_task**
- [ ] Define tool schema (user_id, title, description)
- [ ] Implement database insert logic
- [ ] Return format: {task_id, status: "created", title}
- [ ] Add error handling for validation failures

**Tool 2: list_tasks**
- [ ] Define tool schema (user_id, status: all/pending/completed)
- [ ] Implement query with status filtering
- [ ] Return array of task objects
- [ ] Handle empty results gracefully

**Tool 3: complete_task**
- [ ] Define tool schema (user_id, task_id)
- [ ] Implement update logic (set completed=true, updated_at)
- [ ] Return format: {task_id, status: "completed", title}
- [ ] Handle task-not-found errors

**Tool 4: delete_task**
- [ ] Define tool schema (user_id, task_id)
- [ ] Implement soft or hard delete
- [ ] Return format: {task_id, status: "deleted", title}
- [ ] Handle task-not-found errors

**Tool 5: update_task**
- [ ] Define tool schema (user_id, task_id, title?, description?)
- [ ] Implement partial update logic
- [ ] Return format: {task_id, status: "updated", title}
- [ ] Handle validation and not-found errors

**Acceptance Criteria:**
- ✅ All 5 tools registered with MCP SDK
- ✅ Tools are stateless (query DB on every call)
- ✅ Consistent response schemas
- ✅ user_id enforced on all operations
- ✅ Error messages are clear and user-friendly

### 2.3 MCP Server Testing
**Tasks:**
- [ ] Write unit tests for each tool
- [ ] Test tool chaining scenarios
- [ ] Test concurrent requests (stateless verification)
- [ ] Test error handling paths
- [ ] Verify database state after operations

---

## Phase 3: FastAPI Backend

### 3.1 FastAPI Server Setup
**Deliverable:** Working FastAPI server with routes

**Tasks:**
- [ ] Initialize FastAPI project
- [ ] Install dependencies (FastAPI, uvicorn, SQLModel, OpenAI Agents SDK)
- [ ] Configure CORS for ChatKit frontend
- [ ] Set up environment variables (.env file)
- [ ] Create database connection middleware
- [ ] Implement health check endpoint

**Acceptance Criteria:**
- ✅ Server starts on specified port
- ✅ CORS configured for frontend domain
- ✅ Environment variables loaded correctly

### 3.2 Chat Endpoint Implementation
**Deliverable:** POST /api/{user_id}/chat endpoint

**Tasks:**
- [ ] Create chat endpoint route handler
- [ ] Implement request validation (conversation_id?, message)
- [ ] Fetch conversation history from database
- [ ] Create new conversation if conversation_id not provided
- [ ] Build message array (history + new user message)
- [ ] Store user message in database BEFORE calling agent
- [ ] Integrate OpenAI Agents SDK
- [ ] Configure agent with MCP tools
- [ ] Run agent and capture response
- [ ] Store assistant response in database
- [ ] Return response with conversation_id and tool_calls
- [ ] Implement error handling and rollback logic

**Acceptance Criteria:**
- ✅ Endpoint accepts correct request format
- ✅ Creates conversation on first message
- ✅ Fetches and uses conversation history
- ✅ Messages persist before responding
- ✅ Returns correct response format
- ✅ Server remains stateless between requests

### 3.3 Better Auth Integration
**Deliverable:** Authentication layer

**Tasks:**
- [ ] Install Better Auth SDK
- [ ] Configure Better Auth with Neon database
- [ ] Set up user registration flow
- [ ] Set up user login flow
- [ ] Implement JWT token validation middleware
- [ ] Protect chat endpoint with auth middleware
- [ ] Extract user_id from auth token
- [ ] Test authenticated and unauthenticated requests

**Acceptance Criteria:**
- ✅ Users can register and login
- ✅ Chat endpoint requires valid token
- ✅ user_id automatically extracted from token
- ✅ Unauthorized requests rejected with 401

---

## Phase 4: OpenAI Agent Configuration

### 4.1 Agent Setup
**Deliverable:** Configured OpenAI agent with MCP tools

**Tasks:**
- [ ] Initialize OpenAI Agents SDK
- [ ] Configure agent with system prompt for task management
- [ ] Register all 5 MCP tools with agent
- [ ] Define agent behavior rules (see Agent Behavior Specification)
- [ ] Implement tool result handling
- [ ] Add conversation history management
- [ ] Configure agent parameters (temperature, model, etc.)

**Acceptance Criteria:**
- ✅ Agent can call all MCP tools
- ✅ Agent interprets natural language correctly
- ✅ Agent maintains conversation context
- ✅ Agent provides confirmations after actions

### 4.2 Natural Language Understanding
**Deliverable:** Agent handles all command patterns

**Tasks:**
- [ ] Test implicit task creation ("remember to...")
- [ ] Test explicit task creation ("add task...")
- [ ] Test listing commands ("show tasks", "what's pending")
- [ ] Test completion commands ("mark done", "finished task 3")
- [ ] Test deletion commands ("delete task", "remove the meeting")
- [ ] Test update commands ("change task 1 to...", "rename...")
- [ ] Test ambiguous references (fuzzy matching)
- [ ] Refine system prompt based on test results

**Acceptance Criteria:**
- ✅ 90%+ accuracy on natural language commands
- ✅ Agent confirms actions in friendly language
- ✅ Graceful handling of unclear requests
- ✅ No direct database access from agent

---

## Phase 5: Frontend (ChatKit)

### 5.1 ChatKit Setup
**Deliverable:** Working ChatKit UI

**Tasks:**
- [ ] Install OpenAI ChatKit dependencies
- [ ] Configure ChatKit with backend API endpoint
- [ ] Set up authentication flow in frontend
- [ ] Implement chat message sending
- [ ] Implement chat message receiving and display
- [ ] Add loading states for agent responses
- [ ] Display tool calls in UI (optional but recommended)
- [ ] Style chat interface

**Acceptance Criteria:**
- ✅ Users can send and receive messages
- ✅ Chat history loads correctly
- ✅ Authentication works end-to-end
- ✅ UI is responsive and user-friendly

### 5.2 Domain Allowlist Configuration
**Tasks:**
- [ ] Configure allowed domains for hosted ChatKit
- [ ] Test CORS and domain restrictions
- [ ] Update frontend build configuration
- [ ] Deploy frontend to allowed domain

---

## Phase 6: Integration & Testing

### 6.1 End-to-End Testing
**Deliverable:** Fully tested system

**Test Scenarios:**
- [ ] User creates account and logs in
- [ ] User adds task via natural language
- [ ] User lists tasks (all, pending, completed)
- [ ] User completes task
- [ ] User updates task
- [ ] User deletes task
- [ ] User has multi-turn conversation
- [ ] Server restarts → conversation resumes
- [ ] Concurrent users don't see each other's tasks
- [ ] Error handling (invalid task IDs, etc.)

**Acceptance Criteria:**
- ✅ All test scenarios pass
- ✅ No data loss on server restart
- ✅ No cross-user data leakage
- ✅ Error messages are user-friendly

### 6.2 Stateless Architecture Verification
**Tasks:**
- [ ] Kill server mid-conversation
- [ ] Restart server
- [ ] Continue conversation from frontend
- [ ] Verify all context restored from database
- [ ] Confirm no in-memory state dependencies

**Acceptance Criteria:**
- ✅ Conversations survive server restarts
- ✅ No state held in memory between requests
- ✅ Each request is fully self-contained

---

## Phase 7: Documentation & Deployment

### 7.1 Documentation
**Deliverable:** Complete README and docs

**Tasks:**
- [ ] Write README with project overview
- [ ] Document environment setup
- [ ] Document database migration steps
- [ ] Document API endpoints and schemas
- [ ] Document MCP tools and usage
- [ ] Add architecture diagrams
- [ ] Create developer setup guide
- [ ] Add troubleshooting section

### 7.2 Deployment Preparation
**Tasks:**
- [ ] Create deployment scripts
- [ ] Configure production environment variables
- [ ] Set up production database (Neon)
- [ ] Deploy FastAPI backend
- [ ] Deploy ChatKit frontend
- [ ] Configure Better Auth for production
- [ ] Test production deployment end-to-end
- [ ] Set up monitoring and logging

---

## Development Workflow (Per Task)

### Claude Code Execution Process
For each task above:

1. **Write Spec** (Spec-Kit Plus format)
   - Define inputs, outputs, acceptance criteria
   - Specify edge cases and error handling
   - Include code structure requirements

2. **Generate Plan** (Claude Code)
   - Break spec into implementation steps
   - Identify files to create/modify
   - Define test cases

3. **Break into Tasks** (Claude Code)
   - Atomic, testable units
   - Clear dependencies between tasks
   - Estimated complexity

4. **Implement** (Claude Code)
   - Generate code
   - Review prompts used
   - Document iterations required
   - NO manual coding allowed

5. **Review & Iterate**
   - Test against acceptance criteria
   - Document what worked/what didn't
   - Refine prompts for next task

---

## Project Milestones

| Milestone | Completion Criteria | Estimated Duration |
|-----------|---------------------|-------------------|
| M1: Database Ready | All tables created, migrations work | 2-3 days |
| M2: MCP Server Working | All 5 tools functional | 3-4 days |
| M3: Backend Complete | Chat endpoint working with agent | 4-5 days |
| M4: Frontend Live | ChatKit connected to backend | 2-3 days |
| M5: Testing Done | All scenarios pass | 2-3 days |
| M6: Production Deploy | Live and documented | 1-2 days |

**Total Estimated Duration:** 14-20 days

---

## Risk Mitigation

### Technical Risks
1. **MCP SDK Integration Complexity**
   - Mitigation: Start with simple tool, iterate
   - Fallback: Use MCP documentation examples

2. **Stateless Architecture Challenges**
   - Mitigation: Test server restarts early and often
   - Validation: Add specific test for state persistence

3. **Agent NLU Accuracy**
   - Mitigation: Iterative prompt engineering
   - Fallback: Add explicit command keywords

4. **ChatKit CORS Issues**
   - Mitigation: Configure CORS early
   - Testing: Test from actual frontend domain

### Process Risks
1. **Claude Code Iterations**
   - Mitigation: Track prompts and iterations per task
   - Learning: Document what prompts work best

2. **Spec Clarity**
   - Mitigation: Review specs before implementation
   - Validation: Include acceptance criteria in every spec

---

## Success Metrics

### Functional
- ✅ User can manage complete todo lifecycle via chat
- ✅ 90%+ natural language command accuracy
- ✅ Zero data loss on server restart
- ✅ All MCP tools respond within 2 seconds

### Technical
- ✅ Server is truly stateless (verified by restart tests)
- ✅ Database handles all state persistence
- ✅ Agent never directly accesses database
- ✅ Clean separation: UI → API → Agent → MCP → DB

### Process
- ✅ 100% code generated via Claude Code
- ✅ All prompts and iterations documented
- ✅ Specs written before implementation
- ✅ No manual coding violations

---

## Deliverables Checklist

### Code
- [ ] `/frontend` - ChatKit UI
- [ ] `/backend` - FastAPI + Agents SDK
- [ ] `/mcp-server` - MCP SDK + tools
- [ ] `/specs` - All specification files
- [ ] Database migration scripts

### Documentation
- [ ] README.md with setup instructions
- [ ] API documentation
- [ ] MCP tools documentation
- [ ] Architecture diagrams
- [ ] Deployment guide

### Repository Structure
```

```
# Phase III Hackathon 2 - Complete Repository Structure

```
phase_III_hackthon_2/
│
├── README.md                           # Project overview and setup instructions
├── CONSTITUTION.md                     # Project principles and rules
├── PLAN.md                            # Master implementation plan
├── .gitignore                         # Git ignore rules
├── docker-compose.yml                 # Docker setup for local development (optional)
│
├── specs/                             # All component specifications
│   │
│   ├── chatbot_agent/                 # OpenAI Agents SDK specification
│   │   ├── spec/
│   │   │   ├── agent_spec.md          # Agent behavior, NLU, system prompts
│   │   │   └── agent_tools_config.md  # MCP tools registration config
│   │   ├── plan/
│   │   │   └── agent_plan.md          # Implementation plan for agent
│   │   └── task/
│   │       ├── task_001_agent_init.md
│   │       ├── task_002_tool_registration.md
│   │       ├── task_003_nlu_prompts.md
│   │       └── task_004_agent_testing.md
│   │
│   ├── chatbot_api/                   # FastAPI Backend specification
│   │   ├── spec/
│   │   │   ├── api_spec.md            # API endpoints, request/response schemas
│   │   │   ├── auth_spec.md           # Better Auth integration spec
│   │   │   └── middleware_spec.md     # CORS, error handling, logging
│   │   ├── plan/
│   │   │   └── api_plan.md            # Implementation plan for FastAPI
│   │   └── task/
│   │       ├── task_001_fastapi_setup.md
│   │       ├── task_002_chat_endpoint.md
│   │       ├── task_003_auth_integration.md
│   │       ├── task_004_error_handling.md
│   │       └── task_005_api_testing.md
│   │
│   ├── chatbot_database/              # Database & SQLModel specification
│   │   ├── spec/
│   │   │   ├── database_spec.md       # Schema, models, relationships
│   │   │   ├── migration_spec.md      # Migration strategy
│   │   │   └── indexes_spec.md        # Performance indexes
│   │   ├── plan/
│   │   │   └── database_plan.md       # Implementation plan for DB
│   │   └── task/
│   │       ├── task_001_neon_setup.md
│   │       ├── task_002_models_creation.md
│   │       ├── task_003_migrations.md
│   │       └── task_004_db_testing.md
│   │
│   ├── chatbot_frontend/              # OpenAI ChatKit specification
│   │   ├── spec/
│   │   │   ├── frontend_spec.md       # UI components, routing, state
│   │   │   ├── chatkit_config_spec.md # ChatKit configuration
│   │   │   └── styling_spec.md        # UI/UX design spec
│   │   ├── plan/
│   │   │   └── frontend_plan.md       # Implementation plan for frontend
│   │   └── task/
│   │       ├── task_001_chatkit_setup.md
│   │       ├── task_002_auth_flow.md
│   │       ├── task_003_chat_ui.md
│   │       ├── task_004_tool_display.md
│   │       └── task_005_deployment.md
│   │
│   └── chatbot_mcp_server/            # MCP Server specification
│       ├── spec/
│       │   ├── mcp_server_spec.md     # MCP SDK setup, architecture
│       │   ├── tools_spec.md          # All 5 MCP tools detailed specs
│       │   └── stateless_spec.md      # Stateless design requirements
│       ├── plan/
│       │   └── mcp_server_plan.md     # Implementation plan for MCP
│       └── task/
│           ├── task_001_mcp_init.md
│           ├── task_002_add_task_tool.md
│           ├── task_003_list_tasks_tool.md
│           ├── task_004_complete_task_tool.md
│           ├── task_005_delete_task_tool.md
│           ├── task_006_update_task_tool.md
│           └── task_007_mcp_testing.md
│
├── backend/                           # FastAPI Backend Implementation
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app initialization
│   │   ├── config.py                  # Environment & settings
│   │   │
│   │   ├── models/                    # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── task.py                # Task model
│   │   │   ├── conversation.py        # Conversation model
│   │   │   └── message.py             # Message model
│   │   │
│   │   ├── routes/                    # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── chat.py                # POST /api/{user_id}/chat
│   │   │   ├── health.py              # Health check endpoint
│   │   │   └── auth.py                # Auth endpoints (if needed)
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── agent_service.py       # OpenAI Agent integration
│   │   │   ├── conversation_service.py # Conversation management
│   │   │   └── mcp_client.py          # MCP server client
│   │   │
│   │   ├── middleware/                # FastAPI middleware
│   │   │   ├── __init__.py
│   │   │   ├── cors.py                # CORS configuration
│   │   │   ├── auth.py                # Better Auth middleware
│   │   │   └── error_handler.py       # Global error handling
│   │   │
│   │   └── database/                  # Database utilities
│   │       ├── __init__.py
│   │       ├── connection.py          # DB connection management
│   │       └── session.py             # Session dependency
│   │
│   ├── tests/                         # Backend tests
│   │   ├── __init__.py
│   │   ├── test_chat_endpoint.py
│   │   ├── test_agent.py
│   │   ├── test_models.py
│   │   └── test_auth.py
│   │
│   ├── requirements.txt               # Python dependencies
│   ├── requirements-dev.txt           # Development dependencies
│   ├── .env.example                   # Example environment variables
│   └── Dockerfile                     # Docker configuration
│
├── mcp-server/                        # MCP Server Implementation
│   ├── src/
│   │   ├── __init__.py
│   │   ├── server.py                  # MCP server initialization
│   │   ├── config.py                  # MCP configuration
│   │   │
│   │   ├── tools/                     # MCP tool implementations
│   │   │   ├── __init__.py
│   │   │   ├── add_task.py            # add_task tool
│   │   │   ├── list_tasks.py          # list_tasks tool
│   │   │   ├── complete_task.py       # complete_task tool
│   │   │   ├── delete_task.py         # delete_task tool
│   │   │   └── update_task.py         # update_task tool
│   │   │
│   │   ├── database/                  # Database access layer
│   │   │   ├── __init__.py
│   │   │   ├── connection.py          # Neon connection
│   │   │   └── operations.py          # CRUD operations
│   │   │
│   │   └── schemas/                   # Tool input/output schemas
│   │       ├── __init__.py
│   │       ├── task_schemas.py
│   │       └── response_schemas.py
│   │
│   ├── tests/                         # MCP server tests
│   │   ├── __init__.py
│   │   ├── test_add_task.py
│   │   ├── test_list_tasks.py
│   │   ├── test_complete_task.py
│   │   ├── test_delete_task.py
│   │   ├── test_update_task.py
│   │   └── test_stateless.py
│   │
│   ├── requirements.txt               # MCP dependencies
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                          # OpenAI ChatKit Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── index.js                   # Entry point
│   │   ├── App.js                     # Main app component
│   │   │
│   │   ├── components/                # React components
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.js   # Main chat UI
│   │   │   │   ├── MessageList.js     # Message display
│   │   │   │   ├── MessageInput.js    # Input box
│   │   │   │   └── ToolCallDisplay.js # Show tool calls
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── Login.js           # Login form
│   │   │   │   ├── Register.js        # Registration form
│   │   │   │   └── ProtectedRoute.js  # Auth guard
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── Header.js
│   │   │       ├── Loading.js
│   │   │       └── ErrorBoundary.js
│   │   │
│   │   ├── services/                  # API services
│   │   │   ├── api.js                 # API client
│   │   │   ├── chatService.js         # Chat API calls
│   │   │   └── authService.js         # Auth API calls
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useChat.js
│   │   │   └── useAuth.js
│   │   │
│   │   ├── config/                    # Configuration
│   │   │   ├── chatkit.config.js      # ChatKit setup
│   │   │   └── api.config.js          # API endpoints
│   │   │
│   │   └── styles/                    # CSS/styling
│   │       ├── App.css
│   │       ├── Chat.css
│   │       └── Auth.css
│   │
│   ├── tests/                         # Frontend tests
│   │   └── App.test.js
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── .eslintrc.js
│   └── Dockerfile
│
├── migrations/                        # Database migrations
│   ├── versions/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_indexes.sql
│   │   └── 003_add_timestamps.sql
│   ├── migrate.py                     # Migration runner
│   └── README.md                      # Migration instructions
│
├── docs/                              # Documentation
│   ├── architecture/
│   │   ├── system_design.md           # Overall architecture
│   │   ├── data_flow.md               # Request/response flow
│   │   └── stateless_architecture.md  # Stateless design explanation
│   │
│   ├── api/
│   │   ├── endpoints.md               # API endpoint documentation
│   │   ├── authentication.md          # Auth flow documentation
│   │   └── error_codes.md             # Error handling reference
│   │
│   ├── mcp/
│   │   ├── tools_reference.md         # MCP tools documentation
│   │   ├── tool_schemas.md            # Input/output schemas
│   │   └── examples.md                # Usage examples
│   │
│   ├── development/
│   │   ├── setup_guide.md             # Local setup instructions
│   │   ├── testing_guide.md           # How to run tests
│   │   └── deployment_guide.md        # Production deployment
│   │
│   └── prompts/                       # Claude Code prompts used
│       ├── agent_prompts.md
│       ├── api_prompts.md
│       ├── mcp_prompts.md
│       └── iterations_log.md          # What worked/didn't work
│
├── scripts/                           # Utility scripts
│   ├── setup_dev_env.sh               # Local environment setup
│   ├── run_migrations.sh              # Run database migrations
│   ├── seed_database.py               # Seed test data
│   ├── test_all.sh                    # Run all tests
│   └── deploy.sh                      # Deployment script
│
├── .github/                           # GitHub configuration
│   └── workflows/
│       ├── ci.yml                     # CI/CD pipeline
│       └── deploy.yml                 # Deployment automation
│
└── deployment/                        # Deployment configurations
    ├── docker-compose.prod.yml        # Production Docker setup
    ├── kubernetes/                    # K8s configs (if needed)
    │   ├── backend-deployment.yaml
    │   ├── frontend-deployment.yaml
    │   └── mcp-server-deployment.yaml
    └── env/
        ├── production.env.example
        └── staging.env.example
```

## Key Directories Explained

### `/specs/` - Component Specifications
Each of the 5 components has its own folder with:
- **spec/** - Detailed specifications
- **plan/** - Implementation plan
- **task/** - Broken down tasks for Claude Code

### `/backend/` - FastAPI Application
- **app/models/** - SQLModel database models
- **app/routes/** - API endpoints
- **app/services/** - Business logic (Agent, MCP client)
- **app/middleware/** - CORS, Auth, Error handling

### `/mcp-server/` - MCP Server
- **src/tools/** - All 5 MCP tools (add, list, complete, delete, update)
- **src/database/** - Database operations layer
- **src/schemas/** - Tool input/output validation

### `/frontend/` - ChatKit UI
- **src/components/** - React components (Chat, Auth, Common)
- **src/services/** - API integration
- **src/config/** - ChatKit and API configuration

### `/migrations/` - Database Migrations
- SQL migration scripts
- Migration runner
- Version control for schema changes

### `/docs/` - Documentation
- Architecture diagrams
- API documentation
- MCP tools reference
- Development guides
- **Prompts used with Claude Code**

### `/scripts/` - Automation
- Environment setup
- Database seeding
- Testing automation
- Deployment scripts

## File Count Summary
- **Specification files:** ~20 files (spec, plan, task for each component)
- **Backend files:** ~25 Python files
- **MCP server files:** ~15 Python files
- **Frontend files:** ~20 JS/JSX files
- **Documentation:** ~15 markdown files
- **Configuration:** ~10 config files
- **Tests:** ~15 test files

**Total:** ~120 files across the complete project structure