// backend/src/authentication/authRoutes.ts
import { Router } from 'express';
import { register, login, refresh } from './authController';
import { refreshToken } from '../tokenBehaviour';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken); // or you can use refresh from authController if you prefer

export default router;
