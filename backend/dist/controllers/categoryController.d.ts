import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class CategoryController {
    static getCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAllCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getCategoryById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createCategory(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static updateCategory(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=categoryController.d.ts.map