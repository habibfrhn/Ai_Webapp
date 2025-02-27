// ===============================
// CHANGED: authRoutes.ts (FULL UPDATED CODE)
// ===============================

// Use the non-async references to the controller functions directly.
// This avoids the Express type mismatch with arrow functions returning a Promise.
import { Router } from 'express';
import { register, login } from './authController';

const router = Router();

// Just pass `register` and `login` directly:
router.post('/register', register);
router.post('/login', login);

export default router;
