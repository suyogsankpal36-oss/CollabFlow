import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';

// Configurable thresholds via environment variables with safe production defaults
const AUTH_WINDOW_MS = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10); // 15 minutes
const AUTH_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '15', 10); // 15 attempts per 15 min

const API_WINDOW_MS = parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '900000', 10); // 15 minutes
const API_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_API_MAX || '300', 10); // 300 requests per 15 min

const PUBLIC_WINDOW_MS = parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || '60000', 10); // 1 minute
const PUBLIC_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '60', 10); // 60 requests per min

/**
 * Helper to get normalized client IP supporting IPv6/IPv4
 */
function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Progressive slow-down for authentication routes before hitting hard limit.
 * Implements exponential-style response delay as failed/repeated attempts accumulate.
 */
export const authSlowDown = slowDown({
  windowMs: AUTH_WINDOW_MS,
  delayAfter: 5, // Begin delaying after 5 requests in the window
  delayMs: (hits) => (hits - 5) * 500, // Progressive delay: 500ms, 1000ms, 1500ms...
  maxDelayMs: 4000,
  validate: false,
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return email ? `${ip}:${email}` : ip;
  },
});

/**
 * Strict Rate Limiter for Authentication Routes (login, register, demo)
 */
export const authRateLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return email ? `${ip}:${email}` : ip;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil(AUTH_WINDOW_MS / 1000),
    });
  },
});

/**
 * Moderate Rate Limiter for Public Endpoints (e.g., health check)
 */
export const publicRateLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
    });
  },
});

/**
 * Looser Rate Limiter for Authenticated User Actions (boards, tasks, activity)
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  max: API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    const userReq = req as any;
    if (userReq.user?.id) {
      return `user:${userReq.user.id}`;
    }
    return getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'API rate limit exceeded. Please try again shortly.',
    });
  },
});
