import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getChatwootTags: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const syncChatwootContacts: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=chatwootController.d.ts.map