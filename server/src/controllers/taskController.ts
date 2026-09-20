import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../types';
import { logActivity } from '../services/activityService';
import { emitToBoard } from '../sockets/boardSocket';

export const createTaskSchema = z.object({
  body: z
    .object({
      boardId: z.string().min(1, 'Board ID is required').max(100),
      columnId: z.string().min(1, 'Column ID is required').max(100),
      title: z
        .string({ required_error: 'Task title is required' })
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .trim(),
      description: z.string().max(10000, 'Description cannot exceed 10,000 characters').trim().optional().nullable(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      dueDate: z
        .string()
        .datetime({ message: 'Due date must be a valid ISO datetime format' })
        .optional()
        .nullable()
        .or(z.literal('')),
      assigneeId: z.string().max(100).optional().nullable().or(z.literal('')),
      tags: z
        .array(z.string().min(1).max(30, 'Tag cannot exceed 30 characters').trim())
        .max(10, 'Maximum of 10 tags allowed')
        .default([]),
      subtasks: z
        .array(
          z.object({
            id: z.string().min(1).max(100),
            title: z.string().min(1, 'Subtask title cannot be empty').max(200).trim(),
            completed: z.boolean(),
          })
        )
        .max(50, 'Maximum of 50 subtasks allowed')
        .default([]),
    })
    .strict(),
});

export const moveTaskSchema = z.object({
  body: z
    .object({
      destinationColumnId: z.string().min(1).max(100),
      destinationOrder: z.number().int().min(0).max(1000),
    })
    .strict(),
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .trim()
        .optional(),
      description: z.string().max(10000).trim().optional().nullable(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z
        .string()
        .datetime({ message: 'Due date must be a valid ISO datetime format' })
        .optional()
        .nullable()
        .or(z.literal('')),
      assigneeId: z.string().max(100).optional().nullable().or(z.literal('')),
      tags: z
        .array(z.string().min(1).max(30).trim())
        .max(10)
        .optional(),
      subtasks: z
        .array(
          z.object({
            id: z.string().min(1).max(100),
            title: z.string().min(1).max(200).trim(),
            completed: z.boolean(),
          })
        )
        .max(50)
        .optional(),
    })
    .strict(),
});

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId, columnId, title, description, priority, dueDate, assigneeId, tags, subtasks } = req.body;
    const user = req.user;

    const highestOrderTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const order = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        boardId,
        columnId,
        title,
        description: description || '',
        priority,
        order,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        tags: JSON.stringify(tags || []),
        subtasks: JSON.stringify(subtasks || []),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    const formattedTask = {
      ...task,
      tags: typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags,
      subtasks: typeof task.subtasks === 'string' ? JSON.parse(task.subtasks) : task.subtasks,
    };

    if (user) {
      const activity = await logActivity({
        boardId,
        taskId: task.id,
        userId: user.id,
        action: `created task "${task.title}"`,
      });

      if (activity) {
        emitToBoard(boardId, 'activity:logged', { activity });
      }
    }

    emitToBoard(boardId, 'task:created', { task: formattedTask });

    return res.status(201).json({ task: formattedTask });
  } catch (error) {
    console.error('[TaskController.createTask] Error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}

export async function moveTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { destinationColumnId, destinationOrder } = req.body;
    const user = req.user;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        column: true,
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const sourceColumnId = existingTask.columnId;
    const sourceOrder = existingTask.order;
    const boardId = existingTask.boardId;

    const destinationColumn = await prisma.column.findUnique({
      where: { id: destinationColumnId },
    });

    if (!destinationColumn) {
      return res.status(404).json({ error: 'Destination column not found' });
    }

    await prisma.$transaction(async (tx) => {
      if (sourceColumnId === destinationColumnId) {
        if (sourceOrder < destinationOrder) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColumnId,
              order: { gt: sourceOrder, lte: destinationOrder },
            },
            data: { order: { decrement: 1 } },
          });
        } else if (sourceOrder > destinationOrder) {
          await tx.task.updateMany({
            where: {
              columnId: sourceColumnId,
              order: { gte: destinationOrder, lt: sourceOrder },
            },
            data: { order: { increment: 1 } },
          });
        }
      } else {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            order: { gt: sourceOrder },
          },
          data: { order: { decrement: 1 } },
        });

        await tx.task.updateMany({
          where: {
            columnId: destinationColumnId,
            order: { gte: destinationOrder },
          },
          data: { order: { increment: 1 } },
        });
      }

      await tx.task.update({
        where: { id },
        data: {
          columnId: destinationColumnId,
          order: destinationOrder,
        },
      });
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!updatedTask) {
      return res.status(500).json({ error: 'Failed to retrieve moved task' });
    }

    const formattedTask = {
      ...updatedTask,
      tags: typeof updatedTask.tags === 'string' ? JSON.parse(updatedTask.tags) : updatedTask.tags,
      subtasks: typeof updatedTask.subtasks === 'string' ? JSON.parse(updatedTask.subtasks) : updatedTask.subtasks,
    };

    if (user && sourceColumnId !== destinationColumnId) {
      const activity = await logActivity({
        boardId,
        taskId: updatedTask.id,
        userId: user.id,
        action: `moved task "${updatedTask.title}" to ${destinationColumn.title}`,
        metadata: {
          sourceColumn: existingTask.column.title,
          destinationColumn: destinationColumn.title,
        },
      });

      if (activity) {
        emitToBoard(boardId, 'activity:logged', { activity });
      }
    }

    emitToBoard(boardId, 'task:moved', {
      taskId: id,
      task: formattedTask,
      sourceColumnId,
      sourceOrder,
      destinationColumnId,
      destinationOrder,
    });

    return res.json({ task: formattedTask });
  } catch (error) {
    console.error('[TaskController.moveTask] Error:', error);
    return res.status(500).json({ error: 'Failed to move task' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, assigneeId, tags, subtasks } = req.body;
    const user = req.user;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) dataToUpdate.assigneeId = assigneeId || null;
    if (tags !== undefined) dataToUpdate.tags = JSON.stringify(tags);
    if (subtasks !== undefined) dataToUpdate.subtasks = JSON.stringify(subtasks);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    const formattedTask = {
      ...updatedTask,
      tags: typeof updatedTask.tags === 'string' ? JSON.parse(updatedTask.tags) : updatedTask.tags,
      subtasks: typeof updatedTask.subtasks === 'string' ? JSON.parse(updatedTask.subtasks) : updatedTask.subtasks,
    };

    if (user) {
      let actionText = `updated details for task "${updatedTask.title}"`;
      if (priority && priority !== existingTask.priority) {
        actionText = `changed priority of "${updatedTask.title}" to ${priority}`;
      } else if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
        if (updatedTask.assignee) {
          actionText = `assigned "${updatedTask.title}" to ${updatedTask.assignee.name}`;
        } else {
          actionText = `unassigned "${updatedTask.title}"`;
        }
      }

      const activity = await logActivity({
        boardId: updatedTask.boardId,
        taskId: updatedTask.id,
        userId: user.id,
        action: actionText,
      });

      if (activity) {
        emitToBoard(updatedTask.boardId, 'activity:logged', { activity });
      }
    }

    emitToBoard(updatedTask.boardId, 'task:updated', { task: formattedTask });

    return res.json({ task: formattedTask });
  } catch (error) {
    console.error('[TaskController.updateTask] Error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { boardId, columnId, order, title } = task;

    await prisma.$transaction([
      prisma.task.delete({ where: { id } }),
      prisma.task.updateMany({
        where: { columnId, order: { gt: order } },
        data: { order: { decrement: 1 } },
      }),
    ]);

    if (user) {
      const activity = await logActivity({
        boardId,
        userId: user.id,
        action: `deleted task "${title}"`,
      });

      if (activity) {
        emitToBoard(boardId, 'activity:logged', { activity });
      }
    }

    emitToBoard(boardId, 'task:deleted', { taskId: id, columnId });

    return res.json({ message: 'Task deleted successfully', taskId: id });
  } catch (error) {
    console.error('[TaskController.deleteTask] Error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}
