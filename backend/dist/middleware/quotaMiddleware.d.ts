import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
interface QuotaCheck {
    resource: 'users' | 'contacts' | 'campaigns' | 'connections';
    action: 'create' | 'update';
}
export declare const quotaMiddleware: (check: QuotaCheck) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkUserQuota: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkContactQuota: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkCampaignQuota: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkConnectionQuota: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=quotaMiddleware.d.ts.map