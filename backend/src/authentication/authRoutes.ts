// backend/src/authentication/authRoutes.ts
import { Router } from 'express';
import { register, login } from './authController';
import { refreshToken } from '../tokenBehaviour';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

export default router;
