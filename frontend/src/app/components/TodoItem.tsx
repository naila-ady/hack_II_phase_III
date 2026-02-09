import { useState } from 'react';
import { Todo } from '../types/Todo';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, updatedTodo: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onToggleCompletion: (id: string) => void;
}

export default function TodoItem({ todo, onUpdate, onDelete, onToggleCompletion }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority,
    category: todo.category || '',
    due_date: todo.due_date || ''
  });

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = () => {
    onUpdate(todo.id, editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category || '',
      due_date: todo.due_date || ''
    });
    setIsEditing(false);
  };

  const handleToggleCompletion = () => {
    onToggleCompletion(todo.id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-xl p-5 shadow-md border transition-all duration-300 hover:shadow-lg ${
      todo.completed
        ? 'bg-[color:rgb(var(--completed-bg))] border-emerald-200 todo-completed'
        : 'bg-[color:rgb(var(--card-rgb))] border-[color:rgb(var(--border-rgb))] todo-pending'
    }`}>
      {isEditing ? (
        <div className="space-y-4 animate-fade-in">
          <input
            type="text"
            name="title"
            value={editForm.title}
            onChange={handleEditChange}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200 text-lg font-medium bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]"
            placeholder="Task title"
          />
          <textarea
            name="description"
            value={editForm.description}
            onChange={handleEditChange}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]"
            placeholder="Task description"
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              name="priority"
              value={editForm.priority}
              onChange={handleEditChange}
              className="border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]"
            >
              <option value="low" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Low Priority</option>
              <option value="medium" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Medium Priority</option>
              <option value="high" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">High Priority</option>
            </select>
            <input
              type="text"
              name="category"
              value={editForm.category}
              onChange={handleEditChange}
              className="border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]"
              placeholder="Category"
            />
            <input
              type="date"
              name="due_date"
              value={editForm.due_date.split('T')[0]}
              onChange={handleEditChange}
              className="border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] text-white px-5 py-2.5 rounded-lg font-medium hover:from-[color:rgb(var(--primary-rgb))] hover:to-[color:rgb(var(--accent-rgb))] transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={handleToggleCompletion}
                  className="h-5 w-5 text-[color:rgb(var(--primary-rgb))] rounded focus:ring-[color:rgb(var(--primary-rgb))] border-[color:rgb(var(--border-rgb))]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold truncate ${
                  todo.completed ? 'line-through text-[color:rgb(var(--text-muted-rgb))]' : 'text-[color:rgb(var(--text-primary-rgb))]'
                }`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={`mt-1 text-[color:rgb(var(--text-muted-rgb))] ${todo.completed ? 'line-through' : ''}`}>
                    {todo.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3 ml-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[color:rgb(var(--primary-rgb))] hover:text-[color:rgb(var(--primary-rgb))] p-1 rounded-full hover:bg-[color:rgb(var(--background-rgb))] transition-colors duration-200"
                title="Edit task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="text-[color:rgb(var(--accent-rgb))] hover:text-[color:rgb(var(--accent-rgb))] p-1 rounded-full hover:bg-[color:rgb(var(--background-rgb))] transition-colors duration-200"
                title="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`priority-${todo.priority} text-xs font-medium px-2.5 py-1 rounded-full`}>
              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} priority
            </span>
            {todo.category && (
              <span className="bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-muted-rgb))] text-xs font-medium px-2.5 py-1 rounded-full border border-[color:rgb(var(--border-rgb))]">
                {todo.category}
              </span>
            )}
            {todo.due_date && (
              <span className="bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-muted-rgb))] text-xs font-medium px-2.5 py-1 rounded-full flex items-center border border-[color:rgb(var(--border-rgb))]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(todo.due_date)}
              </span>
            )}
            {todo.completed && (
              <span className="bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-muted-rgb))] text-xs font-medium px-2.5 py-1 rounded-full flex items-center border border-[color:rgb(var(--border-rgb))]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Completed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}