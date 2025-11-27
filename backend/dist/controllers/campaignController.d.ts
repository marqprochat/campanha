import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const campaignValidation: import("express-validator").ValidationChain[];
export declare const listCampaigns: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCampaign: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCampaign: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCampaign: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteCampaign: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleCampaign: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCampaignReport: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContactTags: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getActiveSessions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const downloadCampaignReport: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=campaignController.d.ts.map