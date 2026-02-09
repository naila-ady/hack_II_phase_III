'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import chatbotService, { Message } from '@/services/chatbot';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';

export default function ChatbotPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        setLoadingHistory(true);
        
        // Try to get conversation ID from localStorage
        const savedConversationId = localStorage.getItem('current_conversation_id');
        
        if (savedConversationId) {
          // Load messages for this conversation
          const conversationMessages = await chatbotService.getMessages(savedConversationId);
          setMessages(conversationMessages);
          setConversationId(savedConversationId);
        } else {
          // Try to get the most recent conversation
          const conversations = await chatbotService.getConversations();
          if (conversations && conversations.length > 0) {
            const latestConversation = conversations[0];
            const conversationMessages = await chatbotService.getMessages(String(latestConversation.id));
            setMessages(conversationMessages);
            setConversationId(String(latestConversation.id));
            localStorage.setItem('current_conversation_id', String(latestConversation.id));
          }
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  // Save conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('current_conversation_id', conversationId);
    }
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Partial<Message> = {
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(input, conversationId);
      
      if (!conversationId) {
        setConversationId(String(response.conversation_id));
      }

      const assistantMessage: Partial<Message> = {
        role: 'assistant',
        content: response.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId(undefined);
    setMessages([]);
    localStorage.removeItem('current_conversation_id');
  };

  if (loadingHistory) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-[color:rgb(var(--text-muted-rgb))]">Loading conversation...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto bg-[color:rgb(var(--card-rgb))] rounded-xl border border-[color:rgb(var(--border-rgb))] shadow-lg overflow-hidden">
        <div className="bg-[color:rgb(var(--primary-rgb))] p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">AI Task Assistant</h2>
            <p className="text-sm opacity-80">Ask me to add, list, or manage your tasks</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleNewConversation}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="New Conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <button 
              onClick={() => router.push('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close Assistant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loadingHistory && (
            <div className="text-center py-10 text-[color:rgb(var(--text-muted-rgb))]">
              <p className="text-lg">Hello! How can I help you manage your tasks today?</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["List my tasks", "Add a task to buy milk", "What's my priority for today?"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1 bg-[color:rgb(var(--background-rgb))] border border-[color:rgb(var(--border-rgb))] rounded-full text-sm hover:border-[color:rgb(var(--primary-rgb))] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[color:rgb(var(--primary-rgb))] text-white rounded-tr-none'
                    : 'bg-[color:rgb(var(--background-rgb))] border border-[color:rgb(var(--border-rgb))] text-[color:rgb(var(--text-primary-rgb))] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[color:rgb(var(--background-rgb))] border border-[color:rgb(var(--border-rgb))] p-3 rounded-2xl rounded-tl-none animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-[color:rgb(var(--border-rgb))] bg-[color:rgb(var(--background-rgb))]">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[color:rgb(var(--card-rgb))] border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[color:rgb(var(--primary-rgb))] text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}