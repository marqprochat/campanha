import { Request, Response } from 'express';
import { groupCampaignService } from '../services/groupCampaignService';

export const groupCampaignController = {
    async create(req: Request, res: Response) {
        try {
            // @ts-ignore - tenant comes from auth middleware
            const tenantId = req.user?.tenantId;

            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant_id is required' });
            }

            const { name, targetType, targetIds, messageType, messageContent, instanceName, scheduledFor } = req.body;

            if (!name || !targetType || !targetIds || !messageType || !messageContent || !instanceName || !scheduledFor) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const campaign = await groupCampaignService.createCampaign({
                name,
                targetType,
                targetIds,
                messageType,
                messageContent,
                instanceName,
                tenantId,
                scheduledFor: new Date(scheduledFor)
            });

            res.status(201).json(campaign);
        } catch (error) {
            console.error('Error in create group campaign:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async list(req: Request, res: Response) {
        try {
            // @ts-ignore
            const tenantId = req.user?.tenantId;

            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant_id is required' });
            }

            const campaigns = await groupCampaignService.listCampaigns(tenantId);
            res.status(200).json(campaigns);
        } catch (error) {
            console.error('Error in list group campaigns:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async cancel(req: Request, res: Response) {
        try {
            // @ts-ignore
            const tenantId = req.user?.tenantId;

            if (!tenantId) {
                return res.status(401).json({ error: 'Tenant_id is required' });
            }

            const { id } = req.params;

            // Verify if campaign belongs to tenant
            const campaign = await groupCampaignService.getCampaign(id);
            if (!campaign || campaign.tenantId !== tenantId) {
                return res.status(404).json({ error: 'Campaign not found' });
            }

            const canceled = await groupCampaignService.cancelCampaign(id);
            res.status(200).json(canceled);
        } catch (error) {
            console.error('Error in cancel group campaign:', error);
            res.status(400).json({ error: error instanceof Error ? error.message : 'Internal server error' });
        }
    }
};
