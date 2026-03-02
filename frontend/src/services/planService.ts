import { api } from './api';

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    stripeProductId: string | null;
    stripePriceId: string | null;
    price: number;
    interval: string;
    maxUsers: number;
    maxContacts: number;
    maxCampaigns: number;
    maxConnections: number;
    maxGroups: number;
    active: boolean;
}

export interface Subscription {
    id: string;
    tenantId: string;
    planId: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    plan: Plan;
}

export const planService = {
    // ADMIN endpoints
    async createPlan(data: Partial<Plan>): Promise<Plan> {
        return api.post('/plans', data);
    },

    async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
        return api.put(`/plans/${id}`, data);
    },

    // COMMON endpoints
    async listPlans(): Promise<Plan[]> {
        return api.get<Plan[]>('/plans');
    },

    // TENANT endpoints
    async getCurrentSubscription(): Promise<Subscription | null> {
        return api.get<Subscription | null>('/plans/subscription/current');
    },

    async createCheckoutSession(planId: string, successUrl: string, cancelUrl: string): Promise<{ url: string }> {
        return api.post('/plans/subscription/checkout', {
            planId,
            successUrl,
            cancelUrl
        });
    },

    async createPortalSession(returnUrl: string): Promise<{ url: string }> {
        return api.post('/plans/subscription/portal', { returnUrl });
    }
};
