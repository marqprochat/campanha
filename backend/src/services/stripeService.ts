import { PrismaClient, Plan, Subscription } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
    apiVersion: '2023-10-16' as any, // Default fallback
});

export class StripeService {
    private static instance: StripeService;

    public static getInstance(): StripeService {
        if (!StripeService.instance) {
            StripeService.instance = new StripeService();
        }
        return StripeService.instance;
    }

    // Initialize or verify Stripe Customer for Tenant
    async getOrCreateCustomer(tenantId: string): Promise<string> {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { users: true }
        });

        if (!tenant) throw new Error('Tenant not found');

        if (tenant.stripeCustomerId) {
            return tenant.stripeCustomerId;
        }

        const adminUser = tenant.users.find(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN') || tenant.users[0];

        const customer = await stripe.customers.create({
            email: adminUser?.email,
            name: tenant.name,
            metadata: {
                tenantId: tenant.id
            }
        });

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { stripeCustomerId: customer.id }
        });

        return customer.id;
    }

    // Create a Checkout Session for a plan subscription
    async createCheckoutSession(tenantId: string, planId: string, successUrl: string, cancelUrl: string): Promise<string> {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan || !plan.stripePriceId) throw new Error('Invalid plan or missing Stripe Price ID');

        const customerId = await this.getOrCreateCustomer(tenantId);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                tenantId,
                planId
            },
            subscription_data: {
                metadata: {
                    tenantId,
                    planId
                }
            }
        });

        if (!session.url) throw new Error('Failed to create stripe session url');
        return session.url;
    }

    // Create Customer Portal Session
    async createPortalSession(tenantId: string, returnUrl: string): Promise<string> {
        const customerId = await this.getOrCreateCustomer(tenantId);
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return session.url;
    }
}

export const stripeService = StripeService.getInstance();
