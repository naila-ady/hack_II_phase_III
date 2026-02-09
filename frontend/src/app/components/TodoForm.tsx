import { useState } from 'react';
import { Todo } from '../types/Todo';

interface TodoFormData {
  title: string;
  description: string | undefined;
  priority: 'low' | 'medium' | 'high';
  category: string | undefined;
  due_date: string | undefined;
  completed: boolean;
}

interface TodoFormProps {
  onSubmit: (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => void;
}

export default function TodoForm({ onSubmit }: TodoFormProps) {
  const [formData, setFormData] = useState<TodoFormData>({
    title: '',
    description: undefined,
    priority: 'medium',
    category: undefined,
    due_date: undefined,
    completed: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || undefined  // Convert empty string to undefined
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare the todo data with proper format for backend
    const todoData: Omit<Todo, 'id' | 'created_at' | 'updated_at'> = {
      title: formData.title.trim(),  // Ensure title is trimmed
      description: formData.description || undefined,  // Convert empty string to undefined
      priority: formData.priority,
      category: formData.category || undefined,  // Convert empty string to undefined
      due_date: formData.due_date ? (() => {
        const date = new Date(formData.due_date + 'T00:00:00');
        return isNaN(date.getTime()) ? undefined : date.toISOString();
      })() : undefined,  // Format date as ISO string or undefined
      completed: formData.completed  // Use the completed state from form
    };

    onSubmit(todoData);
    // Reset form
    setFormData({
      title: '',
      description: undefined,
      priority: 'medium',
      category: undefined,
      due_date: undefined,
      completed: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-[color:rgb(var(--card-rgb))] rounded-xl shadow-md border border-[color:rgb(var(--border-rgb))] transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[color:rgb(var(--text-primary-rgb))]">Add New Task</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
            placeholder="What needs to be done?"
          />
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
            Priority Level
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
          >
            <option value="low" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Low Priority</option>
            <option value="medium" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Medium Priority</option>
            <option value="high" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">High Priority</option>
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
            placeholder="Work, Personal, Shopping, etc."
          />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date || ''}
            onChange={handleChange}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
            placeholder="Add more details about this task..."
          ></textarea>
        </div>
      </div>
      <button
        type="submit"
        className="mt-5 w-full bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] text-white px-6 py-3 rounded-lg font-medium hover:from-[color:rgb(var(--primary-rgb))] hover:to-[color:rgb(var(--accent-rgb))] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        Add New Task
      </button>
    </form>
  );
}