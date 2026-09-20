import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../types';

export async function getBoardActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.length > 100) {
      return res.status(400).json({ error: 'Invalid board ID format' });
    }

    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = !isNaN(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 50;

    const activities = await prisma.activityLog.findMany({
      where: { boardId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return res.json({ activities });
  } catch (error) {
    console.error('[ActivityController.getBoardActivity] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve activity history' });
  }
}
