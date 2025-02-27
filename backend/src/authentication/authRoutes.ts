// ===============================
// backend/src/authentication/authRoutes.ts (FULL UPDATED CODE)
// ===============================
import { Router } from 'express';
import { register, login, refresh } from './authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

export default router;
