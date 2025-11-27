import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        tenantId?: string;
        role: string;
    };
}
export declare const getNotifications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUnreadCount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markAsRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAllAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteNotification: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNotificationsSummary: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=notificationsController.d.ts.map