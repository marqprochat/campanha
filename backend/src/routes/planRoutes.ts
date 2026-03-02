import { Router } from 'express';
import { createPlan, updatePlan, listPlans, getCurrentSubscription, createCheckoutSession, createPortalSession } from '../controllers/planController';

const router = Router();

// Plan Management
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.get('/', listPlans);

// Subscriptions
router.get('/subscription/current', getCurrentSubscription);
router.post('/subscription/checkout', createCheckoutSession);
router.post('/subscription/portal', createPortalSession);

export default router;
