interface ReportFilters {
    startDate?: Date;
    endDate?: Date;
    campaignIds?: string[];
    sessionNames?: string[];
    status?: string[];
    tags?: string[];
}
interface CampaignMetrics {
    campaignId: string;
    campaignName: string;
    totalContacts: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
    successRate: number;
    deliveryRate: number;
    readRate: number;
    avgResponseTime?: number;
    createdAt: Date;
    completedAt?: Date;
    duration?: number;
    status: string;
    sessionName?: string;
}
interface TimeSeriesData {
    date: string;
    sent: number;
    delivered: number;
    failed: number;
    read: number;
}
interface PerformanceReport {
    summary: {
        totalCampaigns: number;
        totalMessages: number;
        successRate: number;
        deliveryRate: number;
        readRate: number;
        period: string;
    };
    campaigns: CampaignMetrics[];
    timeSeries: TimeSeriesData[];
    sessionPerformance: {
        sessionName: string;
        totalMessages: number;
        successRate: number;
        avgDeliveryTime: number;
        status: string;
    }[];
    tagPerformance: {
        tag: string;
        totalCampaigns: number;
        totalMessages: number;
        successRate: number;
    }[];
}
export declare class ReportingService {
    private static instance;
    private constructor();
    static getInstance(): ReportingService;
    generatePerformanceReport(tenantId: string, filters: ReportFilters): Promise<PerformanceReport>;
    generateComparisonReport(tenantId: string, currentPeriod: ReportFilters, previousPeriod: ReportFilters): Promise<any>;
    generateContactAnalysis(tenantId: string, filters: ReportFilters): Promise<any>;
    generateCustomReport(tenantId: string, reportConfig: {
        name: string;
        description: string;
        metrics: string[];
        groupBy: string[];
        filters: ReportFilters;
        chartType?: 'line' | 'bar' | 'pie' | 'area';
    }): Promise<any>;
    exportReport(tenantId: string, reportData: any, format: 'json' | 'csv'): Promise<string>;
    private buildWhereClause;
    private getCampaignMetrics;
    private getMessageStats;
    private getSessionPerformance;
    private generateTimeSeriesData;
    private getTagPerformance;
    private calculateSummaryMetrics;
    private executeCustomQuery;
    private convertToCSV;
}
export declare const reportingService: ReportingService;
export {};
//# sourceMappingURL=reportingService.d.ts.map