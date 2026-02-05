import { Request, Response } from 'express';
import { groupService } from '../services/groupService';

// ============================================================================
// GROUP ENDPOINTS
// ============================================================================

export async function createGroup(req: Request, res: Response) {
    try {
        const { name, instanceName, capacity, initialParticipants } = req.body;
        const tenantId = (req as any).tenantId;

        if (!name || !instanceName) {
            return res.status(400).json({ error: 'name and instanceName are required' });
        }

        const group = await groupService.createGroup({
            name,
            instanceName,
            tenantId,
            capacity,
            initialParticipants
        });

        res.status(201).json(group);
    } catch (error: any) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function listGroups(req: Request, res: Response) {
    try {
        const tenantId = (req as any).tenantId;
        const groups = await groupService.listGroups(tenantId);
        res.json(groups);
    } catch (error: any) {
        console.error('Error listing groups:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getGroup(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const group = await groupService.getGroup(id);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(group);
    } catch (error: any) {
        console.error('Error getting group:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteGroup(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await groupService.deleteGroup(id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function syncGroups(req: Request, res: Response) {
    try {
        const { instanceName } = req.body;
        const tenantId = (req as any).tenantId;

        if (!instanceName) {
            return res.status(400).json({ error: 'instanceName is required' });
        }

        const groups = await groupService.syncAllGroupsFromApi(instanceName, tenantId);
        res.json({ synced: groups.length, groups });
    } catch (error: any) {
        console.error('Error syncing groups:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================================================
// DYNAMIC LINK ENDPOINTS
// ============================================================================

export async function createDynamicLink(req: Request, res: Response) {
    try {
        const { slug, name, baseGroupName, instanceName, groupCapacity } = req.body;
        const tenantId = (req as any).tenantId;

        if (!slug || !name || !baseGroupName || !instanceName) {
            return res.status(400).json({
                error: 'slug, name, baseGroupName, and instanceName are required'
            });
        }

        const dynamicLink = await groupService.createDynamicLink({
            slug,
            name,
            baseGroupName,
            instanceName,
            tenantId,
            groupCapacity
        });

        res.status(201).json(dynamicLink);
    } catch (error: any) {
        console.error('Error creating dynamic link:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function listDynamicLinks(req: Request, res: Response) {
    try {
        const tenantId = (req as any).tenantId;
        const links = await groupService.listDynamicLinks(tenantId);
        res.json(links);
    } catch (error: any) {
        console.error('Error listing dynamic links:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getDynamicLink(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const link = await groupService.getDynamicLink(id);

        if (!link) {
            return res.status(404).json({ error: 'Dynamic link not found' });
        }

        res.json(link);
    } catch (error: any) {
        console.error('Error getting dynamic link:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteDynamicLink(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await groupService.deleteDynamicLink(id);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting dynamic link:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================================================
// PUBLIC INVITE REDIRECT
// ============================================================================

export async function handleInviteRedirect(req: Request, res: Response) {
    try {
        const { slug } = req.params;

        const inviteLink = await groupService.getActiveInviteLink(slug);

        if (!inviteLink) {
            return res.status(404).json({ error: 'Invite link not found or no active group available' });
        }

        // Redirect to the WhatsApp invite link
        res.redirect(inviteLink);
    } catch (error: any) {
        console.error('Error handling invite redirect:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================================================
// BROADCAST ENDPOINTS
// ============================================================================

export async function broadcastMessage(req: Request, res: Response) {
    try {
        const { instanceName, groupIds, message } = req.body;

        if (!instanceName || !groupIds || !message) {
            return res.status(400).json({
                error: 'instanceName, groupIds, and message are required'
            });
        }

        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({ error: 'groupIds must be a non-empty array' });
        }

        const results = await groupService.broadcastMessage(instanceName, groupIds, message);
        res.json(results);
    } catch (error: any) {
        console.error('Error broadcasting message:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function broadcastToAll(req: Request, res: Response) {
    try {
        const { instanceName, message } = req.body;
        const tenantId = (req as any).tenantId;

        if (!instanceName || !message) {
            return res.status(400).json({
                error: 'instanceName and message are required'
            });
        }

        const results = await groupService.broadcastToAllGroups(tenantId, instanceName, message);
        res.json(results);
    } catch (error: any) {
        console.error('Error broadcasting to all groups:', error);
        res.status(500).json({ error: error.message });
    }
}
