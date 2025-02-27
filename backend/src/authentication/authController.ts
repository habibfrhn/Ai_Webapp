// ===============================
// CHANGED: authController.ts (FULL UPDATED CODE)
// ===============================

// Remove the explicit Promise<void> return type and just let TS infer.
// Also ensure we do not do `return res.json(...)` but call it instead.
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../database/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Missing email/password' });
      return;
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ email, passwordHash });
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

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
