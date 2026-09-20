import { Router } from 'express';
import { getBoards, getBoardById, createBoard, createBoardSchema } from '../controllers/boardController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(authenticatedRateLimiter);

router.get('/', getBoards);
router.get('/:id', getBoardById);
router.post('/', validateRequest(createBoardSchema), createBoard);

export default router;
