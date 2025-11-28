import { Request, Response } from 'express';
import { AlertType, AlertSeverity } from '@prisma/client';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        tenantId?: string;
        role: string;
    };
}
export declare const getAlerts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createAlert: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const resolveAlert: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAlertsSummary: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare function createSystemAlert(type: AlertType, severity: AlertSeverity, title: string, message: string, metadata?: any, tenantId?: string, userId?: string): Promise<{
    id: string;
    tenantId: string | null;
    userId: string | null;
    createdAt: Date;
    updatedAt: Date;
    message: string;
    title: string;
    type: import(".prisma/client").$Enums.AlertType;
    severity: import(".prisma/client").$Enums.AlertSeverity;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
}>;
export {};
//# sourceMappingURL=alertsController.d.ts.map