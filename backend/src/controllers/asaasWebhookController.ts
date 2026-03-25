import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { settingsService } from '../services/settingsService';

const prisma = new PrismaClient();

export const handleAsaasWebhook = async (req: Request, res: Response) => {
    try {
        // Validate webhook token
        const config = await settingsService.getAsaasConfig();
        const receivedToken = req.headers['asaas-access-token'] as string;

        if (config.webhookToken && receivedToken !== config.webhookToken) {
            console.error('Asaas Webhook: Token inválido');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { event, payment } = req.body;

        if (!event || !payment) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        console.log(`Asaas Webhook: ${event} - Payment: ${payment.id}`);

        switch (event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED':
            case 'PAYMENT_RECEIVED_IN_CASH_CONFIRMED':
                console.log(`✅ Asaas Webhook: Pagamento confirmado para ${payment.id}`);
                await handlePaymentConfirmed(payment);
                break;

            case 'PAYMENT_OVERDUE':
                console.log(`⚠️ Asaas Webhook: Pagamento em atraso - ${payment.id}`);
                await handlePaymentOverdue(payment);
                break;

            case 'PAYMENT_DELETED':
            case 'PAYMENT_REFUNDED':
            case 'PAYMENT_CHARGEBACK_REQUESTED':
                console.log(`❌ Asaas Webhook: Pagamento cancelado/estornado - ${payment.id}`);
                await handlePaymentCanceled(payment);
                break;

            case 'PAYMENT_CREATED':
                console.log(`ℹ️ Asaas Webhook: Nova cobrança criada - ${payment.id}`);
                break;

            default:
                console.log(`❓ Asaas Webhook: Evento não tratado - ${event}`);
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Asaas Webhook Error: ${err.message}`);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

async function handlePaymentConfirmed(payment: any) {
    const subscriptionId = payment.subscription;
    if (!subscriptionId) {
        console.log('Asaas Webhook: Pagamento sem assinatura associada, ignorando.');
        return;
    }

    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscriptionId } as any,
    });

    if (!sub) {
        console.log(`🔍 Asaas Webhook: Assinatura ${subscriptionId} não encontrada no banco. Tentando externalReference...`);
        // Try to find by externalReference (tenantId:planId)
        if (payment.externalReference) {
            const [tenantId, planId] = payment.externalReference.split(':');
            if (tenantId && planId) {
                console.log(`✨ Asaas Webhook: Criando assinatura via externalReference para Tenant ${tenantId}`);
                await (prisma.subscription as any).upsert({
                    where: { tenantId } as any,
                    create: {
                        tenantId,
                        planId,
                        asaasSubscriptionId: subscriptionId,
                        asaasCustomerId: payment.customer || '',
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: payment.dueDate ? new Date(payment.dueDate) : undefined,
                    } as any,
                    update: {
                        asaasSubscriptionId: subscriptionId,
                        asaasCustomerId: payment.customer || '',
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: payment.dueDate ? new Date(payment.dueDate) : undefined,
                    } as any,
                });

                // Garantir que o tenant está ativo
                await (prisma.tenant as any).update({
                    where: { id: tenantId } as any,
                    data: { active: true } as any
                });

                await updateTenantQuotas(tenantId, planId);
            }
        } else {
            console.log('❌ Asaas Webhook: Assinatura não encontrada e sem externalReference para recuperação.');
        }
        return;
    }

    console.log(`🚀 Asaas Webhook: Ativando assinatura ${sub.id} para Tenant ${sub.tenantId}`);
    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: payment.dueDate ? new Date(payment.dueDate) : undefined,
        } as any,
    });

    // Garantir que o tenant está ativo
    await (prisma.tenant as any).update({
        where: { id: sub.tenantId } as any,
        data: { active: true } as any
    });

    await updateTenantQuotas(sub.tenantId, sub.planId);
}

async function handlePaymentOverdue(payment: any) {
    const subscriptionId = payment.subscription;
    if (!subscriptionId) return;

    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscriptionId } as any,
    });
    if (!sub) return;

    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: { status: 'past_due' } as any,
    });
}

async function handlePaymentCanceled(payment: any) {
    const subscriptionId = payment.subscription;
    if (!subscriptionId) return;

    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscriptionId } as any,
    });

    if (!sub) return;

    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: { status: 'canceled' } as any,
    });
}


async function updateTenantQuotas(tenantId: string, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return;

    await prisma.tenantQuota.upsert({
        where: { tenantId },
        create: {
            tenantId,
            maxUsers: plan.maxUsers,
            maxContacts: plan.maxContacts,
            maxCampaigns: plan.maxCampaigns,
            maxConnections: plan.maxConnections,
            maxGroups: plan.maxGroups,
        },
        update: {
            maxUsers: plan.maxUsers,
            maxContacts: plan.maxContacts,
            maxCampaigns: plan.maxCampaigns,
            maxConnections: plan.maxConnections,
            maxGroups: plan.maxGroups,
        },
    });
}
