// Authentication configuration for JWT-based auth
const authConfig = {
  // Base API URL
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nkamdar-ai-task-tracker.hf.space/api/v1',

  // Sign-in with email - calls backend API
  signIn: {
    email: async (email: string, password: string) => {
      const response = await fetch(`${authConfig.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      // Store the JWT token
      localStorage.setItem('token', data.access_token);

      // Get user info using the token
      const userInfo = await authConfig.checkSession();

      return {
        user: userInfo,
        token: data.access_token
      };
    },
  },

  // Sign-up with email - calls backend API
  signUp: {
    email: async (name: string, email: string, password: string) => {
      const response = await fetch(`${authConfig.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();

      // Store the JWT token
      localStorage.setItem('token', data.access_token);

      // Get user info using the token
      const userInfo = await authConfig.checkSession();

      return {
        user: userInfo,
        token: data.access_token
      };
    },
  },

  // Sign-out - clears local storage
  signOut: async () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return true;
  },

  // Check session - verifies token and gets user info
  checkSession: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      // Verify token with backend - send as form data which FastAPI expects for string param
      const response = await fetch(`${authConfig.baseUrl}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(token)}`
      });

      if (!response.ok) {
        // Token is invalid/expired, remove it
        localStorage.removeItem('token');
        return null;
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('token');
      return null;
    }
  },
};

export default authConfig;