import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { settingsService } from './settingsService';

const prisma = new PrismaClient();

interface AsaasCustomer {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
}

interface AsaasSubscription {
    id: string;
    customer: string;
    billingType: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description: string;
    status: string;
}

interface AsaasSubscriptionResponse {
    id: string;
    customer: string;
    billingType: string;
    value: number;
    nextDueDate: string;
    cycle: string;
    description: string;
    status: string;
}

export class AsaasService {
    private static instance: AsaasService;

    public static getInstance(): AsaasService {
        if (!AsaasService.instance) {
            AsaasService.instance = new AsaasService();
        }
        return AsaasService.instance;
    }

    private async getClient(): Promise<AxiosInstance> {
        const config = await settingsService.getAsaasConfig();
        if (!config.apiKey) {
            throw new Error('Asaas API Key não configurada. Configure nas Configurações do Super Admin.');
        }

        const baseURL = config.sandbox
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3';

        return axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                'access_token': config.apiKey,
            },
        });
    }

    // Create or retrieve Asaas Customer for Tenant
    async getOrCreateCustomer(tenantId: string): Promise<string> {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { users: true },
        });

        if (!tenant) throw new Error('Tenant não encontrado');

        if (tenant.asaasCustomerId) {
            return tenant.asaasCustomerId;
        }

        const adminUser = tenant.users.find(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN') || tenant.users[0];
        if (!adminUser) throw new Error('Nenhum usuário encontrado para o tenant');

        const client = await this.getClient();

        const { data: customer } = await client.post<AsaasCustomer>('/customers', {
            name: tenant.name,
            email: adminUser.email,
            cpfCnpj: '00000000000', // Placeholder - should come from tenant registration
            notificationDisabled: false,
            externalReference: tenant.id,
        });

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { asaasCustomerId: customer.id },
        });

        return customer.id;
    }

    // Create a recurring subscription for a plan
    async createSubscription(tenantId: string, planId: string): Promise<{ subscriptionId: string; invoiceUrl: string }> {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) throw new Error('Plano não encontrado');

        const customerId = await this.getOrCreateCustomer(tenantId);
        const config = await settingsService.getAsaasConfig();
        const client = await this.getClient();

        // Map plan interval to Asaas cycle
        const cycleMap: Record<string, string> = {
            'month': 'MONTHLY',
            'year': 'YEARLY',
            'week': 'WEEKLY',
            'biweek': 'BIWEEKLY',
            'quarter': 'QUARTERLY',
            'semester': 'SEMIANNUALLY',
        };

        const cycle = cycleMap[plan.interval] || 'MONTHLY';

        // Calculate next due date (tomorrow)
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        const formattedDate = nextDueDate.toISOString().split('T')[0]; // YYYY-MM-DD

        const subscriptionData: any = {
            customer: customerId,
            billingType: config.billingType || 'UNDEFINED',
            value: plan.price,
            nextDueDate: formattedDate,
            cycle,
            description: `Assinatura do plano ${plan.name}`,
            externalReference: `${tenantId}:${planId}`,
        };

        // Add fine configuration if set
        if (config.fineValue && config.fineValue > 0) {
            subscriptionData.fine = {
                value: config.fineValue,
                type: 'PERCENTAGE',
            };
        }

        // Add interest configuration if set
        if (config.interestValue && config.interestValue > 0) {
            subscriptionData.interest = {
                value: config.interestValue,
                type: 'PERCENTAGE',
            };
        }

        const { data: subscription } = await client.post<AsaasSubscriptionResponse>('/subscriptions', subscriptionData);

        // Upsert the subscription in the database
        await prisma.subscription.upsert({
            where: { tenantId },
            create: {
                tenantId,
                planId,
                asaasSubscriptionId: subscription.id,
                asaasCustomerId: customerId,
                status: 'pending',
                currentPeriodStart: new Date(),
            },
            update: {
                planId,
                asaasSubscriptionId: subscription.id,
                asaasCustomerId: customerId,
                status: 'pending',
            },
        });

        // Get the first payment (invoice) URL
        const { data: payments } = await client.get(`/subscriptions/${subscription.id}/payments`);
        const firstPayment = payments?.data?.[0];
        const invoiceUrl = firstPayment?.invoiceUrl || firstPayment?.bankSlipUrl || '';

        if (!invoiceUrl) {
            // If no invoice URL yet, return the Asaas payment link
            throw new Error('Não foi possível obter o link de pagamento. Tente novamente em instantes.');
        }

        // Update tenant quotas
        await this.updateTenantQuotas(tenantId, planId);

        return {
            subscriptionId: subscription.id,
            invoiceUrl,
        };
    }

    private async updateTenantQuotas(tenantId: string, planId: string) {
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
}

export const asaasService = AsaasService.getInstance();
