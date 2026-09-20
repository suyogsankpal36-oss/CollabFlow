import { prisma } from './prisma';

export async function logActivity(params: {
  boardId: string;
  userId: string;
  action: string;
  taskId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        boardId: params.boardId,
        userId: params.userId,
        action: params.action,
        taskId: params.taskId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
}
