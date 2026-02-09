// Authentication service using auth config
import authConfig from '../config/auth.config';

const authService = {
  async register(name: string, email: string, password: string) {
    return await authConfig.signUp.email(name, email, password);
  },

  async login(email: string, password: string) {
    return await authConfig.signIn.email(email, password);
  },

  async logout() {
    await authConfig.signOut();
  },

  // Get current user info
  async getCurrentUser() {
    const userData = await authConfig.checkSession();
    if (!userData) {
      throw new Error('No authentication token found');
    }
    return userData;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Store tokens in localStorage
  storeTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Get authorization header with token
  getAuthHeader(): { [key: string]: string } {
    const token = this.getToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json'
    };
  }
};

export default authService;