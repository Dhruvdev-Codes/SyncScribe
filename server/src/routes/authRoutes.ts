import { Router } from 'express';
import { register, login, developerLogin, getMe } from '../controllers/authController';

const router = Router();

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/login/developer', developerLogin);
router.get('/me', getMe);

export default router;