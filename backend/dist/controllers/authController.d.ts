import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const authValidators: {
    login: import("express-validator").ValidationChain[];
    register: import("express-validator").ValidationChain[];
};
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const register: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const verifyToken: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map