import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
export declare const attachTenant: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const superAdminOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const tenantAdminOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authenticatedOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenant.d.ts.map