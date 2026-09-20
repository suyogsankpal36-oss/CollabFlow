import { Router } from 'express';
import { register, login, demoLogin, getCurrentUser, listUsers, registerSchema, loginSchema } from '../controllers/authController';
import { validateRequest } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter, authSlowDown, authenticatedRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply auth rate limiting & progressive slowdown on login/register/demo endpoints
router.post('/register', authSlowDown, authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authSlowDown, authRateLimiter, validateRequest(loginSchema), login);
router.post('/demo', authSlowDown, authRateLimiter, demoLogin);

// Authenticated user queries
router.get('/me', authenticateToken, authenticatedRateLimiter, getCurrentUser);
router.get('/users', authenticateToken, authenticatedRateLimiter, listUsers);

export default router;
