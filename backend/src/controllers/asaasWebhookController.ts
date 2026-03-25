import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { settingsService } from '../services/settingsService';

const prisma = new PrismaClient();

export const handleAsaasWebhook = async (req: Request, res: Response) => {
    try {
        // Log completo do payload recebido para debug
        console.log('📨 Asaas Webhook recebido:', JSON.stringify(req.body, null, 2));

        // Validate webhook token
        const config = await settingsService.getAsaasConfig();
        const receivedToken = req.headers['asaas-access-token'] as string;

        if (config.webhookToken && receivedToken !== config.webhookToken) {
            console.error('Asaas Webhook: Token inválido');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { event } = req.body;

        if (!event) {
            console.error('Asaas Webhook: Evento não encontrado no payload');
            return res.status(400).json({ error: 'Invalid webhook payload: event is required' });
        }

        console.log(`📩 Asaas Webhook: Evento recebido: ${event}`);

        // =====================================================================
        // SUBSCRIPTION EVENTS (subscription object in body)
        // =====================================================================
        if (event.startsWith('SUBSCRIPTION_')) {
            const subscription = req.body.subscription;
            if (!subscription) {
                console.error('Asaas Webhook: Evento de assinatura sem dados de subscription');
                return res.status(400).json({ error: 'Invalid webhook payload: subscription is required for SUBSCRIPTION events' });
            }

            switch (event) {
                case 'SUBSCRIPTION_CREATED':
                    console.log(`✅ Asaas Webhook: Assinatura criada - ${subscription.id}`);
                    await handleSubscriptionCreated(subscription);
                    break;

                case 'SUBSCRIPTION_UPDATED':
                    console.log(`🔄 Asaas Webhook: Assinatura atualizada - ${subscription.id}`);
                    await handleSubscriptionUpdated(subscription);
                    break;

                case 'SUBSCRIPTION_DELETED':
                case 'SUBSCRIPTION_INACTIVATED':
                    console.log(`❌ Asaas Webhook: Assinatura cancelada/inativada - ${subscription.id}`);
                    await handleSubscriptionCanceled(subscription);
                    break;

                case 'SUBSCRIPTION_RENEWED':
                    console.log(`🔄 Asaas Webhook: Assinatura renovada - ${subscription.id}`);
                    await handleSubscriptionRenewed(subscription);
                    break;

                default:
                    console.log(`❓ Asaas Webhook: Evento de assinatura não tratado - ${event}`);
            }

            return res.json({ received: true });
        }

        // =====================================================================
        // PAYMENT EVENTS (payment object in body)
        // =====================================================================
        const payment = req.body.payment;
        if (!payment) {
            // Não é um evento de pagamento nem de assinatura que conhecemos
            console.log(`❓ Asaas Webhook: Evento sem dados válidos - ${event}`);
            return res.json({ received: true });
        }

        console.log(`💰 Asaas Webhook: ${event} - Payment: ${payment.id}`);

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
                console.log(`❓ Asaas Webhook: Evento de pagamento não tratado - ${event}`);
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error(`Asaas Webhook Error:`, err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// =============================================================================
// SUBSCRIPTION EVENT HANDLERS
// =============================================================================

async function handleSubscriptionCreated(subscription: any) {
    const subscriptionId = subscription.id;
    const customerId = subscription.customer;
    const externalReference = subscription.externalReference;

    if (!externalReference) {
        console.log('⚠️ Asaas Webhook: SUBSCRIPTION_CREATED sem externalReference, não é possível vincular ao tenant.');
        return;
    }

    const [tenantId, planId] = externalReference.split(':');
    if (!tenantId || !planId) {
        console.log(`⚠️ Asaas Webhook: externalReference inválido: ${externalReference}`);
        return;
    }

    console.log(`🚀 Asaas Webhook: Ativando assinatura ${subscriptionId} para Tenant ${tenantId}, Plano ${planId}`);

    // Calcular período com base no nextDueDate
    const now = new Date();
    const nextDueDate = subscription.nextDueDate ? new Date(subscription.nextDueDate) : null;

    await (prisma.subscription as any).upsert({
        where: { tenantId } as any,
        create: {
            tenantId,
            planId,
            asaasSubscriptionId: subscriptionId,
            asaasCustomerId: customerId || '',
            status: subscription.status === 'ACTIVE' ? 'active' : 'pending',
            currentPeriodStart: now,
            currentPeriodEnd: nextDueDate,
        } as any,
        update: {
            planId,
            asaasSubscriptionId: subscriptionId,
            asaasCustomerId: customerId || '',
            status: subscription.status === 'ACTIVE' ? 'active' : 'pending',
            currentPeriodStart: now,
            currentPeriodEnd: nextDueDate,
        } as any,
    });

    // Se a assinatura está ACTIVE, ativar tenant e atualizar quotas
    if (subscription.status === 'ACTIVE') {
        await (prisma.tenant as any).update({
            where: { id: tenantId } as any,
            data: { active: true } as any,
        });

        await updateTenantQuotas(tenantId, planId);
        console.log(`✅ Asaas Webhook: Tenant ${tenantId} ativado com sucesso!`);
    }
}

async function handleSubscriptionUpdated(subscription: any) {
    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscription.id } as any,
    });

    if (!sub) {
        console.log(`⚠️ Asaas Webhook: Assinatura ${subscription.id} não encontrada para atualização, tentando via externalReference...`);
        // Tentar criar via externalReference
        await handleSubscriptionCreated(subscription);
        return;
    }

    const statusMap: Record<string, string> = {
        'ACTIVE': 'active',
        'INACTIVE': 'canceled',
        'EXPIRED': 'canceled',
    };

    const newStatus = statusMap[subscription.status] || sub.status;
    const nextDueDate = subscription.nextDueDate ? new Date(subscription.nextDueDate) : sub.currentPeriodEnd;

    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: {
            status: newStatus,
            currentPeriodEnd: nextDueDate,
        } as any,
    });

    if (newStatus === 'active') {
        await (prisma.tenant as any).update({
            where: { id: sub.tenantId } as any,
            data: { active: true } as any,
        });
        await updateTenantQuotas(sub.tenantId, sub.planId);
    }

    console.log(`🔄 Asaas Webhook: Assinatura ${sub.id} atualizada -> status: ${newStatus}`);
}

async function handleSubscriptionCanceled(subscription: any) {
    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscription.id } as any,
    });

    if (!sub) {
        console.log(`⚠️ Asaas Webhook: Assinatura ${subscription.id} não encontrada para cancelamento.`);
        return;
    }

    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: { status: 'canceled' } as any,
    });

    console.log(`❌ Asaas Webhook: Assinatura ${sub.id} cancelada para Tenant ${sub.tenantId}`);
}

async function handleSubscriptionRenewed(subscription: any) {
    const sub = await (prisma.subscription as any).findFirst({
        where: { asaasSubscriptionId: subscription.id } as any,
    });

    if (!sub) {
        console.log(`⚠️ Asaas Webhook: Assinatura ${subscription.id} não encontrada para renovação.`);
        await handleSubscriptionCreated(subscription);
        return;
    }

    const nextDueDate = subscription.nextDueDate ? new Date(subscription.nextDueDate) : null;

    await (prisma.subscription as any).update({
        where: { id: sub.id } as any,
        data: {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: nextDueDate,
        } as any,
    });

    await (prisma.tenant as any).update({
        where: { id: sub.tenantId } as any,
        data: { active: true } as any,
    });

    await updateTenantQuotas(sub.tenantId, sub.planId);
    console.log(`🔄 Asaas Webhook: Assinatura ${sub.id} renovada para Tenant ${sub.tenantId}`);
}

// =============================================================================
// PAYMENT EVENT HANDLERS
// =============================================================================

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

                await (prisma.tenant as any).update({
                    where: { id: tenantId } as any,
                    data: { active: true } as any,
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

    await (prisma.tenant as any).update({
        where: { id: sub.tenantId } as any,
        data: { active: true } as any,
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

// =============================================================================
// HELPERS
// =============================================================================

async function updateTenantQuotas(tenantId: string, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
        console.log(`⚠️ Asaas Webhook: Plano ${planId} não encontrado para atualizar quotas.`);
        return;
    }

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

    console.log(`📊 Asaas Webhook: Quotas atualizadas para Tenant ${tenantId}`);
}
