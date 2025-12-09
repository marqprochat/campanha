import express from 'express';
import {
    createLeadPage,
    updateLeadPage,
    deleteLeadPage,
    getLeadPages,
    getLeadPageById,
    getPublicLeadPage,
    submitLead
} from '../controllers/leadPageController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/public/:slug', getPublicLeadPage);
router.post('/public/:slug/submit', submitLead);

// Protected routes (Admin)
router.post('/', authMiddleware, createLeadPage);
router.get('/', authMiddleware, getLeadPages);
router.get('/:id', authMiddleware, getLeadPageById);
router.put('/:id', authMiddleware, updateLeadPage);
router.delete('/:id', authMiddleware, deleteLeadPage);

export default router;
