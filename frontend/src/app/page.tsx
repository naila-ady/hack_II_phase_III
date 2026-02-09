'use client';

import { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import FilterControls from './components/FilterControls';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Todo } from './types/Todo';
import todoService from '../services/todos';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });

  // Fetch todos from the API
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const data = await todoService.getTodos();
        setTodos(data);
        setFilteredTodos(data);
      } catch (err) {
        setError('Failed to fetch todos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  // Apply filters and sorting when todos, filters, or sort config change
  useEffect(() => {
    let result = [...todos];

    // Apply filters
    if (filters.completed !== undefined) {
      result = result.filter(todo => todo.completed === filters.completed);
    }
    if (filters.priority) {
      result = result.filter(todo => todo.priority === filters.priority);
    }
    if (filters.category) {
      result = result.filter(todo =>
        todo.category && todo.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let valA: string | number | Date = a[sortConfig.key as keyof Todo] as string | number | Date;
      let valB: string | number | Date = b[sortConfig.key as keyof Todo] as string | number | Date;

      if (sortConfig.key === 'due_date' || sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
        valA = new Date(valA as string);
        valB = new Date(valB as string);
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        if (sortConfig.direction === 'asc') {
          return valA.localeCompare(valB);
        } else {
          return valB.localeCompare(valA);
        }
      }

      if (sortConfig.direction === 'asc') {
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      } else {
        return valA > valB ? -1 : valA < valB ? 1 : 0;
      }
    });

    setFilteredTodos(result);
  }, [todos, filters, sortConfig]);

  // Add a new todo
  const addTodo = async (newTodo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const data = await todoService.createTodo(newTodo);
      setTodos([data, ...todos]);
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  // Update a todo
  const updateTodo = async (id: string, updatedTodo: Partial<Todo>) => {
    try {
      const data = await todoService.updateTodo(Number(id), updatedTodo);
      setTodos(todos.map(todo => (todo.id === id ? data : todo)));
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  // Delete a todo
  const deleteTodo = async (id: string) => {
    try {
      await todoService.deleteTodo(Number(id));
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  // Toggle completion status
  const toggleCompletion = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      await updateTodo(id, { completed: !todo.completed });
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: { completed?: boolean; priority?: 'low' | 'medium' | 'high'; category?: string }) => {
    setFilters(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (sortBy: string, order: 'asc' | 'desc') => {
    setSortConfig({ key: sortBy, direction: order });
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading todos...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[color:rgb(var(--primary-rgb))] mb-2">
            My Tasks
          </h1>
          <p className="text-[color:rgb(var(--text-muted-rgb))]">Organize your tasks with style</p>
        </header>

        <div className="space-y-8">
          <TodoForm onSubmit={addTodo} />
          <FilterControls onFilterChange={handleFilterChange} onSortChange={handleSortChange} />
          <TodoList
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onToggleCompletion={toggleCompletion}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}