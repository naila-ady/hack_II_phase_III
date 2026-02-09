# Chatbot Frontend Specification

## Overview
OpenAI ChatKit-based UI for natural language task management chat interface.

## Technology Stack
- **Frontend Framework:** OpenAI ChatKit (React-based)
- **Language:** JavaScript/TypeScript
- **Styling:** ChatKit default + custom CSS
- **API Client:** Fetch/Axios
- **Authentication:** Better Auth

---

## Features

### 1. Authentication
- Login page
- Registration page
- JWT token storage (localStorage)
- Auto-redirect if not authenticated

### 2. Chat Interface
- Message input box
- Message history display
- Real-time message updates
- Loading indicators during AI response

### 3. Tool Call Display (Optional)
- Show what actions the AI took
- Display tool calls in UI
- Visual feedback for task operations

### 4. Conversation Management
- Create new conversation
- Load existing conversations
- Conversation persistence

---

## ChatKit Configuration

### Installation
```bash
npm install @openai/chatkit
```

### Basic Setup
```jsx
import { ChatKit } from '@openai/chatkit';

function App() {
  return (
    <ChatKit
      apiEndpoint="http://localhost:8000/api"
      onSendMessage={handleSendMessage}
      messages={messages}
    />
  );
}
```

---

## Components Structure

### 1. App.js
Main application component

```jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatInterface from './components/Chat/ChatInterface';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatInterface />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### 2. ChatInterface Component

```jsx
import React, { useState, useEffect } from 'react';
import { ChatKit } from '@openai/chatkit';
import { sendMessage } from '../../services/chatService';
import { getAuth } from '../../services/authService';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const auth = getAuth();
  
  const handleSendMessage = async (message) => {
    setLoading(true);
    
    // Add user message to UI immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    
    try {
      // Send to API
      const response = await sendMessage(
        auth.userId,
        conversationId,
        message,
        auth.token
      );
      
      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }
      
      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        toolCalls: response.tool_calls,
        timestamp: new Date()
      };
      setMessages([...messages, userMessage, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="chat-container">
      <ChatKit
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loading}
        placeholder="Ask me to manage your tasks..."
      />
    </div>
  );
}

export default ChatInterface;
```

---

### 3. Login Component

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };
  
  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
      <a href="/register">Don't have an account? Register</a>
    </div>
  );
}

export default Login;
```

---

### 4. ProtectedRoute Component

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;
```

---

## Services

### 1. Chat Service

**File:** `frontend/src/services/chatService.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function sendMessage(userId, conversationId, message, token) {
  const response = await fetch(`${API_BASE_URL}/api/${userId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message: message
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return await response.json();
}
```

---

### 2. Auth Service

**File:** `frontend/src/services/authService.js`

```javascript
const AUTH_URL = process.env.REACT_APP_AUTH_URL || 'http://localhost:8000/auth';

export async function login(email, password) {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const data = await response.json();
  
  // Store token and user info
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', data.user_id);
  
  return data;
}

export async function register(email, password, name) {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  
  return await response.json();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function getAuth() {
  return {
    token: localStorage.getItem('token'),
    userId: localStorage.getItem('userId')
  };
}
```

---

## ChatKit Configuration

### Domain Allowlist Setup

**Required for hosted ChatKit:**

```javascript
// In ChatKit config
{
  allowedDomains: [
    'http://localhost:3000',  // Development
    'https://your-app.com'     // Production
  ]
}
```

---

## Styling

### Custom CSS

**File:** `frontend/src/styles/Chat.css`

```css
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.message-user {
  background-color: #007bff;
  color: white;
  padding: 10px;
  border-radius: 10px;
  margin: 5px 0;
  align-self: flex-end;
}

.message-assistant {
  background-color: #f1f1f1;
  color: black;
  padding: 10px;
  border-radius: 10px;
  margin: 5px 0;
  align-self: flex-start;
}

.tool-call {
  font-size: 0.8em;
  color: #666;
  font-style: italic;
  margin-top: 5px;
}

.loading {
  text-align: center;
  padding: 20px;
}
```

---

## Environment Variables

**File:** `frontend/.env`

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AUTH_URL=http://localhost:8000/auth
```

---

## Build & Deployment

### Development
```bash
npm install
npm start
```

### Production Build
```bash
npm run build
```

### Deploy
```bash
# Deploy build/ directory to hosting service
# Configure domain in ChatKit allowlist
```

---

## Testing

### Component Tests

**File:** `frontend/src/tests/ChatInterface.test.js`

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInterface from '../components/Chat/ChatInterface';

test('renders chat input', () => {
  render(<ChatInterface />);
  const input = screen.getByPlaceholderText(/Ask me to manage/i);
  expect(input).toBeInTheDocument();
});

test('sends message on submit', async () => {
  render(<ChatInterface />);
  const input = screen.getByPlaceholderText(/Ask me to manage/i);
  const button = screen.getByText(/Send/i);
  
  fireEvent.change(input, { target: { value: 'Add task to buy milk' } });
  fireEvent.click(button);
  
  // Assert message sent
});
```

---

## Deliverables

1. **React App:**
   - `frontend/src/App.js`
   - `frontend/src/index.js`

2. **Components:**
   - `frontend/src/components/Chat/ChatInterface.js`
   - `frontend/src/components/Auth/Login.js`
   - `frontend/src/components/Auth/Register.js`
   - `frontend/src/components/Auth/ProtectedRoute.js`

3. **Services:**
   - `frontend/src/services/chatService.js`
   - `frontend/src/services/authService.js`

4. **Styling:**
   - `frontend/src/styles/Chat.css`
   - `frontend/src/styles/Auth.css`

5. **Config:**
   - `frontend/package.json`
   - `frontend/.env.example`

---

## Success Criteria

✅ User can login/register  
✅ Chat interface loads  
✅ Messages send and receive  
✅ Authentication works  
✅ Tool calls display (optional)  
✅ Conversations persist  
✅ UI is responsive  
✅ Production deployment ready  

---

**Version:** 1.0  
**Dependencies:** chatbot_api (backend must be running)