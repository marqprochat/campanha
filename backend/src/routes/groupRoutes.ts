import { Router } from 'express';
import { groupController } from '../controllers/groupController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public Route
router.get('/invite/:slug', groupController.handleInviteLink);

// Protected Routes
router.use(authMiddleware);

router.post('/', groupController.create);
router.get('/', groupController.list);
router.post('/sync', groupController.sync);
router.post('/dynamic-link', groupController.createDynamicLink);
router.post('/broadcast', groupController.broadcast);

export { router as groupRoutes };
