// ===============================
// backend/src/authentication/authController.ts (FULL UPDATED CODE)
// ===============================
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../database/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, companyName } = req.body;
    if (!email || !password || !companyName) {
      res.status(400).json({ success: false, message: 'Missing email, password, or company name' });
      return;
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ email, passwordHash, companyName });
    await newUser.save();

    res.json({ success: true, message: 'Registered successfully' });
  } catch (err: any) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Missing email/password' });
      return;
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Issue token valid for 8 hours
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Refresh endpoint:
 * Validates the current token (including checking the user in the DB)
 * and then issues a new token with 8h expiration.
 */
export async function refresh(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, message: 'Missing authorization header' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    // Verify that the user still exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    // Issue a new token with 8h expiry
    const newToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token: newToken });
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
