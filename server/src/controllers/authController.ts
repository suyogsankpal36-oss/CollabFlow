import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: JWT_SECRET environment variable is missing in production!');
}
const ACTIVE_JWT_SECRET = JWT_SECRET || 'collabflow_dev_jwt_secret_key_change_in_production';

export const registerSchema = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email address format')
        .max(255, 'Email cannot exceed 255 characters')
        .trim()
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password cannot exceed 100 characters'),
      name: z
        .string({ required_error: 'Name is required' })
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .trim(),
      avatarUrl: z
        .string()
        .url('Avatar URL must be a valid URL')
        .max(500, 'Avatar URL cannot exceed 500 characters')
        .optional()
        .or(z.literal(''))
        .nullable(),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .email('Invalid email address format')
        .max(255, 'Email cannot exceed 255 characters')
        .trim()
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required')
        .max(100, 'Password cannot exceed 100 characters'),
    })
    .strict(),
});

function generateToken(user: { id: string; email: string; name: string; role: string; avatarUrl?: string | null }) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    ACTIVE_JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, avatarUrl } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: 'MEMBER',
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
}

export async function demoLogin(req: Request, res: Response) {
  try {
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@collabflow.dev' },
    });

    if (!demoUser) {
      const passwordHash = await bcrypt.hash('password123', 10);
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@collabflow.dev',
          name: 'Alex Rivera (Staff Lead)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          passwordHash,
          role: 'ADMIN',
        },
      });
    }

    const token = generateToken(demoUser);

    return res.json({
      message: 'Demo access granted',
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        avatarUrl: demoUser.avatarUrl,
      },
      token,
      isDemo: true,
    });
  } catch (error) {
    console.error('[AuthController.demoLogin] Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while launching demo.' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('[AuthController.getCurrentUser] Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ users });
  } catch (error) {
    console.error('[AuthController.listUsers] Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve team members.' });
  }
}
