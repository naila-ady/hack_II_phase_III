import { useState } from 'react';

interface FilterControlsProps {
  onFilterChange: (filters: {
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  }) => void;
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
}

export default function FilterControls({ onFilterChange, onSortChange }: FilterControlsProps) {
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleApplyFilters = () => {
    const filters: {
      completed?: boolean;
      priority?: 'low' | 'medium' | 'high';
      category?: string;
    } = {};

    if (completedFilter === 'completed') filters.completed = true;
    if (completedFilter === 'pending') filters.completed = false;

    if (priorityFilter !== 'all') {
      filters.priority = priorityFilter as 'low' | 'medium' | 'high';
    }

    if (categoryFilter.trim()) {
      filters.category = categoryFilter;
    }

    onFilterChange(filters);
  };

  const handleApplySorting = () => {
    onSortChange(sortBy, sortOrder);
  };

  const handleResetFilters = () => {
    setCompletedFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('');
    onFilterChange({});
  };

  return (
    <div className="mb-6 p-5 bg-[color:rgb(var(--card-rgb))] rounded-xl shadow-md border border-[color:rgb(var(--border-rgb))]">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] p-2 rounded-lg mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[color:rgb(var(--text-primary-rgb))]">Filters & Sorting</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Status Filter */}
        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">Status</label>
          <select
            value={completedFilter}
            onChange={(e) => setCompletedFilter(e.target.value as 'all' | 'completed' | 'pending')}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
          >
            <option value="all" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">All Tasks</option>
            <option value="pending" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Pending</option>
            <option value="completed" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
          >
            <option value="all" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">All Priorities</option>
            <option value="low" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Low</option>
            <option value="medium" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Medium</option>
            <option value="high" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">High</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">Category</label>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Search category"
            className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Sorting Controls */}
        <div>
          <label className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">Sort By</label>
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 border border-[color:rgb(var(--border-rgb))] rounded-lg px-3 py-2 text-sm bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
            >
              <option value="created_at" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Date Created</option>
              <option value="priority" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Priority</option>
              <option value="due_date" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Due Date</option>
              <option value="title" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Title</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-20 border border-[color:rgb(var(--border-rgb))] rounded-lg px-2 py-2 text-sm bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
            >
              <option value="desc" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Desc</option>
              <option value="asc" className="bg-[color:rgb(var(--card-rgb))] text-[color:rgb(var(--text-primary-rgb))]">Asc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={handleApplyFilters}
          className="bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] text-white px-5 py-2.5 rounded-lg font-medium hover:from-[color:rgb(var(--primary-rgb))] hover:to-[color:rgb(var(--accent-rgb))] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Apply Filters
        </button>
        <button
          onClick={handleApplySorting}
          className="bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] text-white px-5 py-2.5 rounded-lg font-medium hover:from-[color:rgb(var(--primary-rgb))] hover:to-[color:rgb(var(--accent-rgb))] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Apply Sorting
        </button>
        <button
          onClick={handleResetFilters}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}