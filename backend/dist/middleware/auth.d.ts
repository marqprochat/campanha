import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        nome: string;
        role: string;
        tenantId?: string;
    };
    tenantId?: string;
    tenant?: {
        id: string;
        slug: string;
        name: string;
        active: boolean;
    };
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const adminMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map