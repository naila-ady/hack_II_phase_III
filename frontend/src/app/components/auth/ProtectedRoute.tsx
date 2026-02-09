'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  // Check the current path using window.location
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'currentPath:', currentPath);

    // Prevent redirect loop by checking if we're already on login page
    if (!isLoading && !isAuthenticated && currentPath !== '/login' && currentPath !== '/signup') {
      console.log('Redirecting to login from ProtectedRoute');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, currentPath]);

  // Add a safety mechanism to prevent infinite loading
  useEffect(() => {
    if (isLoading && retryCount < 10) { // Retry up to 10 times
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000); // Check every second
      return () => clearTimeout(timer);
    }
  }, [isLoading, retryCount]);

  if (isLoading && retryCount < 10) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4">Loading authentication... ({retryCount}s)</p>
    </div>;
  }

  // If still loading after retries, try to render anyway
  if (isLoading && retryCount >= 10) {
    console.warn('Authentication loading timeout, attempting to render');
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing redirect message');
    return <div className="flex justify-center items-center min-h-screen">
      <p>Not authenticated, redirecting to login...</p>
    </div>;
  }

  console.log('Rendering protected content');
  return <>{children}</>;
}