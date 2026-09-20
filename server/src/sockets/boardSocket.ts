import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthUser } from '../types';

export interface PresenceUser {
  socketId: string;
  user: AuthUser;
  joinedAt: string;
}

let ioInstance: SocketIOServer | null = null;

// Map boardId -> Map socketId -> PresenceUser
const boardPresence = new Map<string, Map<string, PresenceUser>>();

export function initSocketServer(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    let currentBoardId: string | null = null;
    let currentUser: AuthUser | null = null;

    socket.on('join_board', ({ boardId, user }: { boardId: string; user: AuthUser }) => {
      if (!boardId || !user) return;

      // Leave previous board room if any
      if (currentBoardId) {
        socket.leave(`board:${currentBoardId}`);
        removePresence(currentBoardId, socket.id);
        broadcastPresence(currentBoardId);
      }

      currentBoardId = boardId;
      currentUser = user;

      socket.join(`board:${boardId}`);

      // Add to presence map
      if (!boardPresence.has(boardId)) {
        boardPresence.set(boardId, new Map());
      }
      boardPresence.get(boardId)!.set(socket.id, {
        socketId: socket.id,
        user,
        joinedAt: new Date().toISOString(),
      });

      // Broadcast updated presence to all sockets in board
      broadcastPresence(boardId);

      console.log(`🔌 User ${user.name} (${user.email}) joined board room board:${boardId}`);
    });

    socket.on('leave_board', ({ boardId }: { boardId: string }) => {
      if (boardId) {
        socket.leave(`board:${boardId}`);
        removePresence(boardId, socket.id);
        broadcastPresence(boardId);
      }
      currentBoardId = null;
    });

    socket.on('disconnect', () => {
      if (currentBoardId) {
        removePresence(currentBoardId, socket.id);
        broadcastPresence(currentBoardId);
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
}

function removePresence(boardId: string, socketId: string) {
  const roomPresence = boardPresence.get(boardId);
  if (roomPresence) {
    roomPresence.delete(socketId);
    if (roomPresence.size === 0) {
      boardPresence.delete(boardId);
    }
  }
}

function broadcastPresence(boardId: string) {
  if (!ioInstance) return;
  const roomPresence = boardPresence.get(boardId);
  const users: PresenceUser[] = roomPresence ? Array.from(roomPresence.values()) : [];
  
  // Deduplicate presence users by user.id for UI display
  const uniqueUsers: PresenceUser[] = [];
  const seenIds = new Set<string>();
  for (const p of users) {
    if (!seenIds.has(p.user.id)) {
      seenIds.add(p.user.id);
      uniqueUsers.push(p);
    }
  }

  ioInstance.to(`board:${boardId}`).emit('presence:sync', {
    boardId,
    activeUsers: uniqueUsers,
  });
}

export function emitToBoard(boardId: string, event: string, payload: any, senderSocketId?: string) {
  if (!ioInstance) return;
  if (senderSocketId) {
    ioInstance.to(`board:${boardId}`).except(senderSocketId).emit(event, payload);
  } else {
    ioInstance.to(`board:${boardId}`).emit(event, payload);
  }
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}
