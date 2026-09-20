import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface MoveTaskPayload {
  destinationColumnId: string;
  destinationOrder: number;
}
