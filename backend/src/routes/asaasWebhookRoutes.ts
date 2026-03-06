import { Router } from 'express';
import { handleAsaasWebhook } from '../controllers/asaasWebhookController';

const router = Router();

// Endpoint is prefixed with /api/webhooks/asaas in server.ts
router.post('/', handleAsaasWebhook);

export default router;
