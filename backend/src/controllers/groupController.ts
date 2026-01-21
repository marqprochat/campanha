import { Request, Response } from 'express';
import { groupService } from '../services/groupService';

export class GroupController {

    async create(req: Request, res: Response) {
        try {
            const { groupName, participants, instanceName, dynamicLinkId } = req.body;
            const tenantId = (req as any).user.tenantId;

            if (!groupName || !instanceName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const group = await groupService.createGroup({
                tenantId,
                instanceName,
                groupName,
                participants: participants || [],
                dynamicLinkId
            });

            return res.status(201).json(group);
        } catch (error: any) {
            console.error('Error creating group:', error);
            return res.status(500).json({ error: 'Failed to create group', details: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const groups = await groupService.listGroups(tenantId);
            return res.json(groups);
        } catch (error: any) {
            console.error('Error listing groups:', error);
            return res.status(500).json({ error: 'Failed to list groups' });
        }
    }

    async sync(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const { instanceName } = req.body;
            if (!instanceName) {
                return res.status(400).json({ error: 'Instance Name required' });
            }
            await groupService.syncGroupsFromEvolution(tenantId, instanceName);
            return res.json({ message: 'Synced successfully' });
        } catch (error: any) {
            console.error('Error syncing groups:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // --- Dynamic Link ---

    async createDynamicLink(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user.tenantId;
            const { slug, name, baseGroupName, groupCapacity, instanceName } = req.body;

            const dynamicLink = await groupService.createDynamicLink(tenantId, {
                slug,
                name,
                baseGroupName,
                groupCapacity: groupCapacity || 1023,
                instanceName
            });

            return res.status(201).json(dynamicLink);
        } catch (error: any) {
            console.error('Error creating dynamic link:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Public Endpoint
    async handleInviteLink(req: Request, res: Response) {
        try {
            const { slug } = req.params;
            const link = await groupService.getRedirectLink(slug);
            return res.redirect(link);
        } catch (error: any) {
            console.error('Error handling invite link:', error);
            return res.status(404).send('Link invalid or not found');
        }
    }

    // --- Broadcast ---

    async broadcast(req: Request, res: Response) {
        try {
            const { instanceName, groupJids, message } = req.body;
            // Validate message structure

            const results = await groupService.broadcastMessage(instanceName, groupJids, message);
            return res.json(results);
        } catch (error: any) {
            console.error('Error broadcasting:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export const groupController = new GroupController();
