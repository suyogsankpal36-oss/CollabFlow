import { Router } from 'express';
import {
  createTask,
  moveTask,
  updateTask,
  deleteTask,
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(authenticatedRateLimiter);

router.post('/', validateRequest(createTaskSchema), createTask);
router.patch('/:id/move', validateRequest(moveTaskSchema), moveTask);
router.patch('/:id', validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
