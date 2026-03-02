import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { stripeService } from '../services/stripeService';

const prisma = new PrismaClient();

// ADMIN: Create Plan
export const createPlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'SUPERADMIN') return res.status(403).json({ error: 'Forbidden' });

        const plan = await prisma.plan.create({ data: req.body });
        res.status(201).json(plan);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ADMIN: Update Plan
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'SUPERADMIN') return res.status(403).json({ error: 'Forbidden' });

        const plan = await prisma.plan.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// EVERYONE: List Plans
export const listPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({ where: { active: true } });
        res.json(plans);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// TENANT: Get Current Subscription
export const getCurrentSubscription = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const sub = await prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true }
        });
        res.json(sub || null);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// TENANT: Create Checkout Session
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const { planId, successUrl, cancelUrl } = req.body;
        if (!planId || !successUrl || !cancelUrl) {
            return res.status(400).json({ error: 'planId, successUrl, and cancelUrl are required' });
        }

        const url = await stripeService.createCheckoutSession(tenantId, planId, successUrl, cancelUrl);
        res.json({ url });
    } catch (error: any) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message });
    }
};

// TENANT: Create Portal Session
export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const { returnUrl } = req.body;
        if (!returnUrl) {
            return res.status(400).json({ error: 'returnUrl is required' });
        }

        const url = await stripeService.createPortalSession(tenantId, returnUrl);
        res.json({ url });
    } catch (error: any) {
        console.error('Portal error:', error);
        res.status(500).json({ error: error.message });
    }
};
