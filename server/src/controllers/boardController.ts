import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../services/activityService';

export const createBoardSchema = z.object({
  body: z
    .object({
      title: z
        .string({ required_error: 'Board title is required' })
        .min(1, 'Board title cannot be empty')
        .max(100, 'Board title cannot exceed 100 characters')
        .trim(),
      description: z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .trim()
        .optional()
        .nullable(),
    })
    .strict(),
});

export async function getBoards(req: AuthenticatedRequest, res: Response) {
  try {
    let boards = await prisma.board.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true, columns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (boards.length === 0 && req.user) {
      const defaultBoard = await prisma.board.create({
        data: {
          title: 'CollabFlow Core Engineering',
          description: 'Main project sprint board',
          ownerId: req.user.id,
          columns: {
            create: [
              { title: 'Backlog', order: 0, color: '#64748b' },
              { title: 'In Progress', order: 1, color: '#3b82f6' },
              { title: 'In Review', order: 2, color: '#f59e0b' },
              { title: 'Completed', order: 3, color: '#10b981' },
            ],
          },
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: {
            select: { tasks: true, columns: true },
          },
        },
      });
      boards = [defaultBoard];
    }

    return res.json({ boards });
  } catch (error) {
    console.error('[BoardController.getBoards] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve boards' });
  }
}

export async function getBoardById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.length > 100) {
      return res.status(400).json({ error: 'Invalid board ID format' });
    }

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        activities: {
          take: 30,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const formattedColumns = board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((task) => {
        let parsedTags = [];
        let parsedSubtasks = [];
        try {
          parsedTags = typeof task.tags === 'string' ? JSON.parse(task.tags || '[]') : task.tags;
        } catch {}
        try {
          parsedSubtasks = typeof task.subtasks === 'string' ? JSON.parse(task.subtasks || '[]') : task.subtasks;
        } catch {}

        return {
          ...task,
          tags: parsedTags,
          subtasks: parsedSubtasks,
        };
      }),
    }));

    return res.json({
      board: {
        ...board,
        columns: formattedColumns,
      },
    });
  } catch (error) {
    console.error('[BoardController.getBoardById] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve board details' });
  }
}

export async function createBoard(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description } = req.body;

    const board = await prisma.board.create({
      data: {
        title,
        description: description || null,
        ownerId: req.user.id,
        columns: {
          create: [
            { title: 'Backlog', order: 0, color: '#64748b' },
            { title: 'In Progress', order: 1, color: '#3b82f6' },
            { title: 'In Review', order: 2, color: '#f59e0b' },
            { title: 'Completed', order: 3, color: '#10b981' },
          ],
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        columns: {
          orderBy: { order: 'asc' },
        },
      },
    });

    await logActivity({
      boardId: board.id,
      userId: req.user.id,
      action: `created new board "${board.title}"`,
    });

    return res.status(201).json({ board });
  } catch (error) {
    console.error('[BoardController.createBoard] Error:', error);
    return res.status(500).json({ error: 'Failed to create board' });
  }
}
