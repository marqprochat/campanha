import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { alertsMonitoringService } from '../services/alertsMonitoringService'; // Assuming we can log errors here

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
    apiVersion: '2023-10-16' as any,
});

const prisma = new PrismaClient();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
        if (!sig || !endpointSecret) throw new Error('Missing stripe signature or secret');
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutSessionCompleted(session);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaymentSucceeded(invoice);
                break;
            }
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdatedOrDeleted(subscription);
                break;
            }
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    } catch (err: any) {
        console.error(`Error processing webhook event: ${err.message}`);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') return;

    let tenantId = session.metadata?.tenantId;
    let planId = session.metadata?.planId;

    // Sometimes metadata is inside subscription
    if (!tenantId || !planId) {
        console.warn('Handling checkout session completed but no metadata found');
        return;
    }

    const { id: stripeSubscriptionId, customer: stripeCustomerId } = await _getSubAndCustomer(session);

    if (!stripeSubscriptionId) {
        console.error('Session completed without a subscription ID');
        return;
    }

    // Upsert subscription
    await prisma.subscription.upsert({
        where: { tenantId },
        create: {
            tenantId,
            planId,
            stripeSubscriptionId: stripeSubscriptionId as string,
            stripeCustomerId: stripeCustomerId as string,
            status: 'active',
            currentPeriodStart: new Date(), // Simplified, should preferably come from stripe subscription object if retrieved
            // currentPeriodEnd should be retrieved from subscription but we can wait for invoice.payment_succeeded or fetch it
        },
        update: {
            planId,
            stripeSubscriptionId: stripeSubscriptionId as string,
            stripeCustomerId: stripeCustomerId as string,
            status: 'active'
        }
    });

    // We should also update the Tenant Quotas based on this plan.
    await updateTenantQuotas(tenantId, planId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.billing_reason === 'subscription_create') {
        // Handled by checkout.session.completed
        return;
    }

    const stripeSubscriptionId = invoice.subscription as string;
    if (!stripeSubscriptionId) return;

    // Fetch subscription from DB
    const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId } });
    if (!sub) return;

    // Update the end date (Stripe's period end)
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await prisma.subscription.update({
        where: { id: sub.id },
        data: {
            status: stripeSub.status,
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        }
    });
}

async function handleSubscriptionUpdatedOrDeleted(subscription: Stripe.Subscription) {
    const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscription.id } });
    if (!sub) return;

    await prisma.subscription.update({
        where: { id: sub.id },
        data: {
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
    });
}

// Helpers
async function _getSubAndCustomer(session: Stripe.Checkout.Session) {
    let stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    let stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    return { id: stripeSubscriptionId, customer: stripeCustomerId };
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
            maxGroups: plan.maxGroups
        },
        update: {
            maxUsers: plan.maxUsers,
            maxContacts: plan.maxContacts,
            maxCampaigns: plan.maxCampaigns,
            maxConnections: plan.maxConnections,
            maxGroups: plan.maxGroups
        }
    });
}
