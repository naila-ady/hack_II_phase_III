'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await signup(name, email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[color:rgb(var(--primary-rgb))] mb-2">
          Create Account
        </h1>
        <p className="text-[color:rgb(var(--text-muted-rgb))]">Join NADY'S TASK TRACKER today</p>
      </div>

      <div className="bg-[color:rgb(var(--card-rgb))] rounded-xl shadow-md border border-[color:rgb(var(--border-rgb))] p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
              placeholder="John Doe"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[color:rgb(var(--text-muted-rgb))] mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-[color:rgb(var(--border-rgb))] rounded-lg px-4 py-3 bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))] focus:ring-2 focus:ring-[color:rgb(var(--primary-rgb))] focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[color:rgb(var(--primary-rgb))] to-[color:rgb(var(--accent-rgb))] text-white px-6 py-3 rounded-lg font-medium hover:from-[color:rgb(var(--primary-rgb))] hover:to-[color:rgb(var(--accent-rgb))] transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[color:rgb(var(--text-muted-rgb))]">
            Already have an account?{' '}
            <Link href="/login" className="text-[color:rgb(var(--primary-rgb))] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}