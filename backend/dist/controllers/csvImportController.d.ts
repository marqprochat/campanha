import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare const handleMulterError: (err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare class CSVImportController {
    static importContacts(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static downloadTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=csvImportController.d.ts.map