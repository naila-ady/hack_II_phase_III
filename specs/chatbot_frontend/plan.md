# Chatbot Frontend - Implementation Plan & Tasks

## Overview
OpenAI ChatKit React application for chat-based task management.

---

## Implementation Tasks

### Task 001: React Project Setup

**Objective:** Initialize React app with ChatKit

**Steps:**
1. Create React app:
```bash
npx create-react-app frontend
cd frontend
```

2. Install dependencies:
```bash
npm install @openai/chatkit react-router-dom axios
```

3. Create directory structure:
```bash
mkdir -p src/{components/{Chat,Auth,Common},services,hooks,config,styles}
```

4. Create `.env.example`:
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AUTH_URL=http://localhost:8000/auth
```



---

### Task 002: Authentication Service

**Objective:** Better Auth integration

**File:** `frontend/src/services/authService.js`

```javascript
const AUTH_URL = process.env.REACT_APP_AUTH_URL;

export async function login(email, password) {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
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
  
  if (!response.ok) throw new Error('Registration failed');
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

### Task 003: Chat Service

**Objective:** API communication

**File:** `frontend/src/services/chatService.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL;

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

### Task 004: Login Component

**File:** `frontend/src/components/Auth/Login.js`

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import '../../styles/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Todo Chatbot</h1>
        <h2>Login</h2>
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
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
```



---

### Task 005: Register Component

**File:** `frontend/src/components/Auth/Register.js`

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import '../../styles/Auth.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(email, password, name);
      navigate('/login');
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Todo Chatbot</h1>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            minLength="8"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
```



---

### Task 006: Protected Route Component

**File:** `frontend/src/components/Auth/ProtectedRoute.js`

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

### Task 007: Chat Interface Component

**File:** `frontend/src/components/Chat/ChatInterface.js`

```jsx
import React, { useState } from 'react';
import { ChatKit } from '@openai/chatkit';
import { sendMessage } from '../../services/chatService';
import { getAuth, logout } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import '../../styles/Chat.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();
  
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    setLoading(true);
    
    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send to API
      const response = await sendMessage(
        auth.userId,
        conversationId,
        messageText,
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
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Todo Chatbot</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="chat-container">
        <ChatKit
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
          placeholder="Ask me to manage your tasks..."
        />
      </div>
    </div>
  );
}

export default ChatInterface;
```

---

### Task 008: App Component & Routing

**File:** `frontend/src/App.js`

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatInterface from './components/Chat/ChatInterface';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```



---

### Task 009: Styling

**File:** `frontend/src/styles/Auth.css`

```css
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}

.auth-box h1 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.auth-box h2 {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.auth-box input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.auth-box button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
}

.auth-box button:hover {
  background: #5568d3;
}

.auth-box .error {
  color: red;
  text-align: center;
  margin: 10px 0;
}
```

**File:** `frontend/src/styles/Chat.css`

```css
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background: #667eea;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header button {
  background: white;
  color: #667eea;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
}

.chat-container {
  flex: 1;
  overflow: hidden;
}
```



---

### Task 010: Testing & Deployment

**Steps:**
1. Test locally: `npm start`
2. Test authentication flow
3. Test chat functionality
4. Create production build: `npm run build`
5. Deploy to hosting service
6. Configure ChatKit domain allowlist



---

## Complete Task List

1. ✅ Task 001: React Project Setup (30m)
2. ✅ Task 002: Auth Service (45m)
3. ✅ Task 003: Chat Service (30m)
4. ✅ Task 004: Login Component (30m)
5. ✅ Task 005: Register Component (30m)
6. ✅ Task 006: Protected Route (15m)
7. ✅ Task 007: Chat Interface (1h)
8. ✅ Task 008: App & Routing (20m)
9. ✅ Task 009: Styling (30m)
10. ✅ Task 010: Testing & Deploy (1h)



---

## Success Checklist

- [ ] React app runs locally
- [ ] Login/register works
- [ ] Chat interface displays
- [ ] Messages send/receive
- [ ] Authentication enforced
- [ ] UI is responsive
- [ ] Production build works
- [ ] Deployed successfully

---

**Version:** 1.0  
**Dependencies:** chatbot_api (backend running)