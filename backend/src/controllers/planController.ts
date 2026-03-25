import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asaasService } from '../services/asaasService';

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

        // Se o usuário (ex: SUPERADMIN) não tiver um tenant selecionado,
        // não é possível buscar uma assinatura
        if (!tenantId) {
            return res.json(null);
        }

        const sub = await prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true }
        });
        res.json(sub || null);
    } catch (error: any) {
        console.error('getCurrentSubscription error:', error);
        res.status(500).json({ error: error.message });
    }
};

// TENANT: Create Subscription (via Asaas)
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant is required' });
        }

        const { planId, cpfCnpj } = req.body;
        if (!planId) {
            return res.status(400).json({ error: 'planId é obrigatório' });
        }

        const result = await asaasService.createSubscription(tenantId, planId, cpfCnpj);
        res.json({ url: result.invoiceUrl });
    } catch (error: any) {
        console.error('Asaas subscription error:', error);
        res.status(500).json({ error: error.message });
    }
};

// SUPERADMIN: Activate Subscription Manually
export const activateSubscriptionManually = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (user.role !== 'SUPERADMIN') return res.status(403).json({ error: 'Forbidden' });

        const { tenantId } = req.params;

        // Buscar o tenant
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

        // Buscar a assinatura
        const sub = await (prisma.subscription as any).findFirst({
            where: { tenantId } as any,
            include: { plan: true } as any,
        }) as any;

        if (!sub) {
            return res.status(404).json({ error: 'Assinatura não encontrada para este tenant' });
        }

        // Ativar a assinatura
        await (prisma.subscription as any).update({
            where: { id: sub.id } as any,
            data: {
                status: 'active',
                currentPeriodStart: new Date(),
            } as any,
        });

        // Ativar o tenant
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { active: true },
        });

        // Atualizar as quotas do tenant com base no plano
        if (sub.plan) {
            await prisma.tenantQuota.upsert({
                where: { tenantId },
                create: {
                    tenantId,
                    maxUsers: sub.plan.maxUsers,
                    maxContacts: sub.plan.maxContacts,
                    maxCampaigns: sub.plan.maxCampaigns,
                    maxConnections: sub.plan.maxConnections,
                    maxGroups: sub.plan.maxGroups,
                },
                update: {
                    maxUsers: sub.plan.maxUsers,
                    maxContacts: sub.plan.maxContacts,
                    maxCampaigns: sub.plan.maxCampaigns,
                    maxConnections: sub.plan.maxConnections,
                    maxGroups: sub.plan.maxGroups,
                },
            });
        }

        console.log(`✅ Assinatura do Tenant ${tenantId} ativada manualmente pelo SUPERADMIN ${user.email}`);

        res.json({
            success: true,
            message: `Tenant "${tenant.name}" e assinatura ativados com sucesso!`,
            tenantId,
            subscriptionId: sub.id,
            planName: sub.plan?.name,
        });
    } catch (error: any) {
        console.error('activateSubscriptionManually error:', error);
        res.status(500).json({ error: error.message });
    }
};
