import { Todo } from '../types/Todo';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onUpdate: (id: string, updatedTodo: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onToggleCompletion: (id: string) => void;
}

export default function TodoList({ todos, onUpdate, onDelete, onToggleCompletion }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No todos yet. Add one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {todos.length === 0 ? (
        <div className="text-center py-12 bg-[color:rgb(var(--card-rgb))] rounded-xl shadow-sm border border-[color:rgb(var(--border-rgb))]">
          <div className="mx-auto w-16 h-16 bg-[color:rgb(var(--primary-rgb))] bg-opacity-20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[color:rgb(var(--primary-rgb))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[color:rgb(var(--text-primary-rgb))] mb-1">No tasks yet</h3>
          <p className="text-[color:rgb(var(--text-muted-rgb))]">Add a new task to get started</p>
        </div>
      ) : (
        todos.map((todo, index) => (
          <div key={todo.id} className={`animate-slide-up`} style={{ animationDelay: `${index * 50}ms` }}>
            <TodoItem
              todo={todo}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleCompletion={onToggleCompletion}
            />
          </div>
        ))
      )}
    </div>
  );
}