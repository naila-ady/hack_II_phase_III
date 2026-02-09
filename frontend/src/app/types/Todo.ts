export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}