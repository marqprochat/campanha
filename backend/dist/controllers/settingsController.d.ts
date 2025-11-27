import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const settingsValidation: import("express-validator").ValidationChain[];
export declare const getSettings: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPublicSettings: (req: Request, res: Response) => Promise<void>;
export declare const updateSettings: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadLogo: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const uploadFavicon: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const removeFavicon: (req: Request, res: Response) => Promise<void>;
export declare const removeLogo: (req: Request, res: Response) => Promise<void>;
export declare const uploadIcon: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>[];
export declare const removeIcon: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=settingsController.d.ts.map