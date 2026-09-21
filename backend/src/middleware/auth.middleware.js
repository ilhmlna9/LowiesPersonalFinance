import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'lowies-dev-secret-key';

export async function authMiddleware(req, res, next) {
  try {
    // Check for token in cookie
    let token = req.cookies.auth_token;

    // Also check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - missing token' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profiles: {
          select: {
            id: true,
            avatarUrl: true,
            currency: true,
            telegramUsername: true,
            notificationsEnabled: true,
            dailyReminder: true,
            budgetAlerts: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profiles: user.profiles[0] || {},
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error in auth middleware' });
  }
}

// ============ Optional: Public access for auth routes ============
export function optionalAuth(req, res, next) {
  // Try to authenticate, but don't fail if no token
  let token = req.cookies.auth_token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(); // Continue without user
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }
  } catch (error) {
    // Invalid token, but continue without user
  }

  next();
}

// ============ Admin middleware ============
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - admin access required' });
  }
  next();
}

export { authMiddleware, optionalAuth, adminMiddleware };