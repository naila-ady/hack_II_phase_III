import axios from 'axios';
import authService from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nkamdar-ai-task-tracker.hf.space/api/v1';

export interface Message {
  id?: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  conversation_id: number;
  response: string;
  tool_calls: any[];
}

const chatbotService = {
  async sendMessage(message: string, conversationId?: number): Promise<ChatResponse> {
    const response = await axios.post<ChatResponse>(
      `${API_BASE_URL}/chatbot/chat`,
      {
        message,
        conversation_id: conversationId
      },
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await axios.get<Conversation[]>(
      `${API_BASE_URL}/chatbot/conversations`,
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await axios.get<Message[]>(
      `${API_BASE_URL}/chatbot/conversations/${conversationId}/messages`,
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async deleteConversation(conversationId: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/chatbot/conversations/${conversationId}`,
      {
        headers: authService.getAuthHeader()
      }
    );
  }
};

export default chatbotService;
