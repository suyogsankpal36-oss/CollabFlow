import { Board, Task, User, ActivityLog } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('collabflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  async login(payload: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; user: User; token: string }>(res);
  },

  async register(payload: { email: string; password: string; name: string; avatarUrl?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string; user: User; token: string }>(res);
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<{ message: string; user: User; token: string; isDemo: boolean }>(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ users: User[] }>(res);
  },

  // Boards
  async getBoards() {
    const res = await fetch(`${API_BASE}/boards`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ boards: Board[] }>(res);
  },

  async getBoardById(id: string) {
    const res = await fetch(`${API_BASE}/boards/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ board: Board }>(res);
  },

  async createBoard(payload: { title: string; description?: string }) {
    const res = await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ board: Board }>(res);
  },

  // Tasks
  async createTask(payload: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    tags?: string[];
    subtasks?: { id: string; title: string; completed: boolean }[];
  }) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ task: Task }>(res);
  },

  async moveTask(id: string, payload: { destinationColumnId: string; destinationOrder: number }) {
    const res = await fetch(`${API_BASE}/tasks/${id}/move`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ task: Task }>(res);
  },

  async updateTask(
    id: string,
    payload: {
      title?: string;
      description?: string | null;
      priority?: string;
      dueDate?: string | null;
      assigneeId?: string | null;
      tags?: string[];
      subtasks?: { id: string; title: string; completed: boolean }[];
    }
  ) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ task: Task }>(res);
  },

  async deleteTask(id: string) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; taskId: string }>(res);
  },

  // Activities
  async getBoardActivity(boardId: string) {
    const res = await fetch(`${API_BASE}/activity/boards/${boardId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ activities: ActivityLog[] }>(res);
  },
};
