import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UserPayload, UserRole } from '../types';
import { getJwtSecret } from '../config/jwt';

// Middleware to verify JWT token
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.message && error.message.includes('FATAL: JWT_SECRET')) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Middleware to check role authorization
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission to perform this action.`
      });
    }

    next();
  };
};
