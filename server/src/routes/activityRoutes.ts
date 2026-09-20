import { Router } from 'express';
import { getBoardActivity } from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';
import { authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticateToken);
router.use(authenticatedRateLimiter);

router.get('/boards/:id', getBoardActivity);

export default router;
