import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as groupController from '../controllers/groupController';

const router = Router();

// ============================================================================
// PROTECTED ROUTES (require authentication)
// ============================================================================

// Groups
router.post('/groups', authMiddleware, groupController.createGroup);
router.get('/groups', authMiddleware, groupController.listGroups);
router.get('/groups/:id', authMiddleware, groupController.getGroup);
router.delete('/groups/:id', authMiddleware, groupController.deleteGroup);
router.post('/groups/sync', authMiddleware, groupController.syncGroups);

// Dynamic Links
router.post('/dynamic-links', authMiddleware, groupController.createDynamicLink);
router.get('/dynamic-links', authMiddleware, groupController.listDynamicLinks);
router.get('/dynamic-links/:id', authMiddleware, groupController.getDynamicLink);
router.delete('/dynamic-links/:id', authMiddleware, groupController.deleteDynamicLink);

// Broadcast
router.post('/broadcast', authMiddleware, groupController.broadcastMessage);
router.post('/broadcast/all', authMiddleware, groupController.broadcastToAll);

// ============================================================================
// PUBLIC ROUTES (no authentication required)
// ============================================================================

// Public invite link redirect - this is the "magic link" that auto-rotates groups
router.get('/invite/:slug', groupController.handleInviteRedirect);

export const groupRoutes = router;
export default router;
