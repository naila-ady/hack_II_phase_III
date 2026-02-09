// import axios from 'axios';
// import authService from './auth';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// export interface Todo {
//   id?: number;
//   title: string;
//   description?: string;
//   completed: boolean;
//   created_at?: string;
//   updated_at?: string;
// }

// const todoService = {
//   async getTodos(): Promise<Todo[]> {
//     const response = await axios.get<Todo[]>(
//       `${API_BASE_URL}/todos`,
//       {
//         headers: authService.getAuthHeader()
//       }
//     );
//     return response.data;
//   },

//   async createTodo(todo: Partial<Todo>): Promise<Todo> {
//     const response = await axios.post<Todo>(
//       `${API_BASE_URL}/todos`,
//       todo,
//       {
//         headers: authService.getAuthHeader()
//       }
//     );
//     return response.data;
//   },

//   async updateTodo(id: number, todo: Partial<Todo>): Promise<Todo> {
//     const response = await axios.put<Todo>(
//       `${API_BASE_URL}/todos/${id}`,
//       todo,
//       {
//         headers: authService.getAuthHeader()
//       }
//     );
//     return response.data;
//   },

//   async deleteTodo(id: number): Promise<void> {
//     await axios.delete(
//       `${API_BASE_URL}/todos/${id}`,
//       {
//         headers: authService.getAuthHeader()
//       }
//     );
//   }
// };

// export default todoService;

import axios from 'axios';
import authService from './auth';
import { Todo } from '../app/types/Todo';  // Import the same Todo type

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nkamdar-ai-task-tracker.hf.space/api/v1';

const todoService = {
  async getTodos(): Promise<Todo[]> {
    const response = await axios.get<Todo[]>(
      `${API_BASE_URL}/todos`,
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async createTodo(todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<Todo> {
    const response = await axios.post<Todo>(
      `${API_BASE_URL}/todos`,
      todo,
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async updateTodo(id: number, todo: Partial<Todo>): Promise<Todo> {
    const response = await axios.put<Todo>(
      `${API_BASE_URL}/todos/${id}`,
      todo,
      {
        headers: authService.getAuthHeader()
      }
    );
    return response.data;
  },

  async deleteTodo(id: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/todos/${id}`,
      {
        headers: authService.getAuthHeader()
      }
    );
  }
};

export default todoService;