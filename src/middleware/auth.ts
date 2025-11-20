import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth.js';

export interface AuthRequest extends Request {
  userId?: string;
  clientId?: string;
  body?: any;
  params?: any;
  query?: any;
  headers: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }

  req.userId = (decoded as any).userId;
  req.clientId = (decoded as any).clientId;
  next();
};
