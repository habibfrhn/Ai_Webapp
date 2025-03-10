// backend/src/tokenBehaviour.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from './database/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

/**
 * Middleware to verify JWT and attach the userId to the request.
 * This ensures secure token validation on the server side.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Missing authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

/**
 * Refreshes the JWT for a user.
 * The backend now handles issuing a new token on demand rather than
 * relying on client-side token refresh logic.
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, message: 'Missing authorization header' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Check if the user still exists in the database.
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    
    // Issue a new token with 8-hour expiration.
    const newToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token: newToken });
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
