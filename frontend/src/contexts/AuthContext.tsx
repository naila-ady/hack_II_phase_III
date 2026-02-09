'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../services/auth';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Since backend doesn't have auth endpoints, we'll use mock auth
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Still set as authenticated for mock auth
        setIsAuthenticated(authService.isAuthenticated());
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize auth state based on mock auth
    checkSession();

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = () => {
      const token = authService.getToken();
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      authService.storeTokens(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      // Small delay to ensure state updates properly before navigation
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || 'An error occurred during login');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.register(name, email, password);
      authService.storeTokens(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      // Small delay to ensure state updates properly before navigation
      setTimeout(() => {
        router.push('/');
      }, 100);
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || 'An error occurred during signup');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
    // Note: router.refresh() might not be available in all Next.js versions
    // If you get an error, remove this line
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}