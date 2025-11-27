import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class ContactController {
    static getContacts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getContactById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createContact(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateContact(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteContact(req: AuthenticatedRequest, res: Response): Promise<void>;
    static bulkUpdateContacts(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkDeleteContacts(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=contactController.d.ts.map