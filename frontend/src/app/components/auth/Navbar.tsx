'use client';

import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-[color:rgb(var(--card-rgb))] border-b border-[color:rgb(var(--border-rgb))] py-4">
      <div className="container mx-auto px-4 max-w-4xl flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-[color:rgb(var(--primary-rgb))]">
          NADY'S SMART TASK TRACKER
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/chatbot" className="text-[color:rgb(var(--primary-rgb))] hover:underline font-medium">
                Chat Assistant
              </Link>
              <span className="text-[color:rgb(var(--text-muted-rgb))]">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-[color:rgb(var(--primary-rgb))] text-white rounded-lg hover:bg-[color:rgb(var(--primary-rgb))] transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-[color:rgb(var(--primary-rgb))] hover:text-[color:rgb(var(--primary-rgb))] font-medium">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-[color:rgb(var(--primary-rgb))] text-white rounded-lg hover:bg-[color:rgb(var(--primary-rgb))] transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}