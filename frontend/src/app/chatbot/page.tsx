
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import chatbotService, { Message } from '@/services/chatbot';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import FilterControls from '../components/FilterControls';
import { Todo } from '../types/Todo';

export default function ChatbotPage() {
  const { user } = useAuth();

  // -------- TASK STATE --------
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [filters, setFilters] = useState<{ completed?: boolean; priority?: 'low' | 'medium' | 'high'; category?: string }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

  // -------- CHAT STATE --------
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [input, setInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [showChat, setShowChat] = useState(true); // ✅ CHANGED FROM false TO true
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // -------- TASK FUNCTIONS --------
  const fetchTodos = async () => {
    // Implement fetch from backend if needed
    setLoadingTasks(false);
  };

  const addTodo = (newTodo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    const todo: Todo = { ...newTodo, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setTodos([todo, ...todos]);
    setFilteredTodos([todo, ...todos]);
  };

  const updateTodo = (id: string, updatedTodo: Partial<Todo>) => {
    const updated = todos.map(todo => (todo.id === id ? { ...todo, ...updatedTodo } : todo));
    setTodos(updated);
    setFilteredTodos(updated);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter(todo => todo.id !== id);
    setTodos(updated);
    setFilteredTodos(updated);
  };

  const toggleCompletion = (id: string) => {
    const updated = todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    setTodos(updated);
    setFilteredTodos(updated);
  };

  const handleFilterChange = (newFilters: { completed?: boolean; priority?: 'low' | 'medium' | 'high'; category?: string }) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortBy: string, order: 'asc' | 'desc') => {
    setSortConfig({ key: sortBy, direction: order });
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    let result = [...todos];

    if (filters.completed !== undefined) result = result.filter(t => t.completed === filters.completed);
    if (filters.priority) result = result.filter(t => t.priority === filters.priority);
    if (filters.category) result = result.filter(
      t => t.category && t.category.toLowerCase().includes(filters.category!.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Todo];
      let valB: any = b[sortConfig.key as keyof Todo];

      if (['created_at', 'updated_at', 'due_date'].includes(sortConfig.key)) {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });

    setFilteredTodos(result);
  }, [todos, filters, sortConfig]);

  // -------- CHAT FUNCTIONS --------
  const suggestionButtons = [
    "Add a Task",
    "List tasks",
    "Delete a Task",
    "Update a Task",
    "What's my priority for today?"
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingChat) return;

    const userMessage: Partial<Message> = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingChat(true);

    try {
      const response = await chatbotService.sendMessage(input, conversationId);
      if (!conversationId) setConversationId(response.conversation_id);

      const assistantMessage: Partial<Message> = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-[color:rgb(var(--background-rgb))]">

        {/* Main task UI */}
        <div className="max-w-4xl mx-auto p-4">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold text-[color:rgb(var(--primary-rgb))] mb-2">My Tasks</h1>
            <p className="text-[color:rgb(var(--text-muted-rgb))]">Organize your tasks with style</p>
          </header>

          <TodoForm onSubmit={addTodo} />
          <FilterControls onFilterChange={handleFilterChange} onSortChange={handleSortChange} />
          <TodoList
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onToggleCompletion={toggleCompletion}
          />
        </div>

        {/* Chatbot floating box */}
        {showChat && (
          <div className="fixed bottom-4 right-4 w-[360px] h-[500px] flex flex-col bg-[color:rgb(var(--card-rgb))] rounded-xl border border-[color:rgb(var(--border-rgb))] shadow-lg overflow-hidden z-50">

            {/* Chat header */}
            <div className="bg-[color:rgb(var(--primary-rgb))] p-4 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Nady's Smart Task Assistant</h2>
                <p className="text-sm opacity-80">Ask me to manage your tasks, I'm here to help!</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="bg-red-500 hover:bg-red-700 text-white px-6 py-1 rounded-md font-bold"
              >
                Exit
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10 text-[color:rgb(var(--text-muted-rgb))]">
                  <p className="text-md">Hello! How can I help you manage your tasks today?</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-[color:rgb(var(--primary-rgb))] text-white rounded-tr-none'
                      : 'bg-[color:rgb(var(--background-rgb))] border border-[color:rgb(var(--border-rgb))] text-[color:rgb(var(--text-primary-rgb))] rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-[color:rgb(var(--background-rgb))] border border-[color:rgb(var(--border-rgb))] p-3 rounded-2xl rounded-tl-none animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion buttons + input */}
            <div className="p-4 border-t border-[color:rgb(var(--border-rgb))] bg-[color:rgb(var(--background-rgb))] flex flex-wrap gap-2 items-center">
              {suggestionButtons.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 bg-[color:rgb(var(--card-rgb))] border border-[color:rgb(var(--border-rgb))] rounded-full text-sm hover:border-[color:rgb(var(--primary-rgb))] transition-colors"
                >
                  {suggestion}
                </button>
              ))}

              <form onSubmit={handleSend} className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-[color:rgb(var(--card-rgb))] border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))]"
                  disabled={loadingChat}
                />
                <button
                  type="submit"
                  disabled={loadingChat || !input.trim()}
                  className="bg-[color:rgb(var(--primary-rgb))] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ❌ REMOVED THIS ENTIRE SECTION - No more bottom right button! */}

      </div>
    </ProtectedRoute>
  );
}