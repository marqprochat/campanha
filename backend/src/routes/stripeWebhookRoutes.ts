import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/stripeWebhookController';

const router = Router();

// Endpoint is already prefixed with /api/webhooks/stripe in server.ts
router.post('/', handleStripeWebhook);

export default router;
