interface TenantAnalytics {
    tenantId: string;
    tenantName: string;
    period: string;
    metrics: {
        totalContacts: number;
        totalCampaigns: number;
        totalMessages: number;
        activeUsers: number;
        campaignsThisMonth: number;
        messagesThisMonth: number;
        contactsThisMonth: number;
        campaignSuccessRate: number;
        averageMessagesPerCampaign: number;
        topPerformingCampaigns: Array<{
            id: string;
            name: string;
            messagesSent: number;
            successRate: number;
        }>;
    };
}
interface SystemAnalytics {
    totalTenants: number;
    totalSystemContacts: number;
    totalSystemCampaigns: number;
    totalSystemMessages: number;
    systemGrowthRate: number;
    tenantUsageDistribution: Array<{
        tenantId: string;
        tenantName: string;
        contactsCount: number;
        campaignsCount: number;
        messagesCount: number;
        usagePercentage: number;
    }>;
    monthlyTrends: Array<{
        month: string;
        tenants: number;
        contacts: number;
        campaigns: number;
        messages: number;
    }>;
}
export declare class AnalyticsService {
    private static instance;
    private constructor();
    static getInstance(): AnalyticsService;
    generateTenantAnalytics(tenantId: string, startDate?: Date, endDate?: Date): Promise<TenantAnalytics>;
    generateSystemAnalytics(startDate?: Date, endDate?: Date): Promise<SystemAnalytics>;
    getCampaignPerformanceReport(tenantId: string, campaignId?: string): Promise<any>;
    exportTenantDataToCSV(tenantId: string, dataType: 'contacts' | 'campaigns' | 'analytics'): Promise<string>;
}
export declare const analyticsService: AnalyticsService;
export {};
//# sourceMappingURL=analyticsService.d.ts.map