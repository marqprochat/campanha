import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class AnalyticsController {
    static getTenantAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getSystemAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getCampaignAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static exportData(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getSpecificTenantAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=analyticsController.d.ts.map