import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const usersValidators: {
    create: import("express-validator").ValidationChain[];
    update: import("express-validator").ValidationChain[];
};
export declare const getUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAllUsersGlobal: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAvailableTenants: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserStats: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=usersController.d.ts.map