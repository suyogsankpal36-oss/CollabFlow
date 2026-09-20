import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, avatarUrl?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('collabflow_token'),
  isAuthenticated: !!localStorage.getItem('collabflow_token'),
  isLoading: true,
  isDemo: localStorage.getItem('collabflow_is_demo') === 'true',

  login: async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('collabflow_token', data.token);
    localStorage.removeItem('collabflow_is_demo');
    set({ user: data.user, token: data.token, isAuthenticated: true, isDemo: false });
  },

  register: async (email, password, name, avatarUrl) => {
    const data = await api.register({ email, password, name, avatarUrl });
    localStorage.setItem('collabflow_token', data.token);
    localStorage.removeItem('collabflow_is_demo');
    set({ user: data.user, token: data.token, isAuthenticated: true, isDemo: false });
  },

  demoLogin: async () => {
    const data = await api.demoLogin();
    localStorage.setItem('collabflow_token', data.token);
    localStorage.setItem('collabflow_is_demo', 'true');
    set({ user: data.user, token: data.token, isAuthenticated: true, isDemo: true });
  },

  logout: () => {
    localStorage.removeItem('collabflow_token');
    localStorage.removeItem('collabflow_is_demo');
    set({ user: null, token: null, isAuthenticated: false, isDemo: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('collabflow_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const data = await api.getCurrentUser();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('collabflow_token');
      localStorage.removeItem('collabflow_is_demo');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
