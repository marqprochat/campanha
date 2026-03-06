import { Router } from 'express';
import { groupCampaignController } from '../controllers/groupCampaignController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas de group campaigns requerem autenticação
router.use(authMiddleware);

// Rotas CRUD
router.post('/', groupCampaignController.create);
router.get('/', groupCampaignController.list);
router.post('/:id/cancel', groupCampaignController.cancel);

export default router;
