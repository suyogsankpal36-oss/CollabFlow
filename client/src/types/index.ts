export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type UserRole = 'ADMIN' | 'MEMBER';
export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: UserRole;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  description?: string | null;
  priority: Priority;
  order: number;
  dueDate?: string | null;
  assigneeId?: string | null;
  assignee?: User | null;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  color: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  boardId: string;
  taskId?: string | null;
  task?: { id: string; title: string } | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  action: string;
  metadata?: string | null;
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  owner: User;
  columns: Column[];
  activities?: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface PresenceUser {
  socketId: string;
  user: User;
  joinedAt: string;
}

export interface FilterState {
  searchQuery: string;
  onlyMyTasks: boolean;
  highAndUrgent: boolean;
  dueThisWeek: boolean;
  selectedTag?: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
