import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { logActivity, logDevActivity } from '../services/activityLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'syncscribe-dev-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'user',
        avatar: null,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    logActivity({
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user.id,
      details: `New user registered: ${name} (${email}) as ${user.role}`,
      userId: user.id,
      userName: name,
    });

    if (user.role === 'developer') {
      logDevActivity({
        developerName: name,
        actionType: 'FEATURE_BUILD',
        description: `Developer account created for ${name}`,
        status: 'completed',
      });
    }

    const { password: _, ...userWithoutPassword } = user as any;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    logActivity({
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      details: `User logged in: ${user.name} (${email})`,
      userId: user.id,
      userName: user.name,
    });

    const { password: _, ...userWithoutPassword } = user as any;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

export const developerLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.role !== 'developer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Developer or admin role required.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    logActivity({
      action: 'DEV_LOGIN',
      entityType: 'dev',
      entityId: user.id,
      details: `Developer logged in: ${user.name} (${email})`,
      userId: user.id,
      userName: user.name,
    });

    logDevActivity({
      developerName: user.name,
      actionType: 'FEATURE_BUILD',
      description: `Developer ${user.name} logged into developer portal`,
      status: 'completed',
    });

    const { password: _, ...userWithoutPassword } = user as any;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Developer Login Error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user as any;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};