import { PrismaClient, WhatsappGroup, DynamicLink } from '@prisma/client';
import { evolutionApiService } from './evolutionApiService';

const prisma = new PrismaClient();

interface CreateGroupParams {
    name: string;
    instanceName: string;
    tenantId: string;
    capacity?: number;
    initialParticipants?: string[];
}

interface CreateDynamicLinkParams {
    slug: string;
    name: string;
    baseGroupName: string;
    instanceName: string;
    tenantId: string;
    groupCapacity?: number;
    initialParticipants?: string[];
}

// ... existing code ...

    // ============================================================================
    // DYNAMIC LINK MANAGEMENT
    // ============================================================================

    async createDynamicLink(params: CreateDynamicLinkParams): Promise < DynamicLink > {
    const { slug, name, baseGroupName, instanceName, tenantId, groupCapacity = 1023, initialParticipants =[] } = params;

    console.log(`🔗 Creating dynamic link '${slug}' for groups named '${baseGroupName}'`);

    // Create the first group for this dynamic link
    const firstGroup = await this.createGroup({
        name: `${baseGroupName} 1`,
        instanceName,
        tenantId,
        capacity: groupCapacity,
        initialParticipants
    });

    // Create the dynamic link pointing to this group
    const dynamicLink = await prisma.dynamicLink.create({
        data: {
            slug,
            name,
            baseGroupName,
            groupCapacity,
            instanceName,
            tenantId,
            activeGroupId: firstGroup.id
        }
    });

    console.log(`✅ Dynamic link '${slug}' created, pointing to group '${firstGroup.name}'`);
    return dynamicLink;
}

    async listDynamicLinks(tenantId: string): Promise < DynamicLink[] > {
    return prisma.dynamicLink.findMany({
        where: { tenantId },
        include: { activeGroup: true },
        orderBy: { createdAt: 'desc' }
    });
}

    async getDynamicLink(id: string): Promise < DynamicLink | null > {
    return prisma.dynamicLink.findUnique({
        where: { id },
        include: { activeGroup: true }
    });
}

    async getDynamicLinkBySlug(slug: string): Promise < DynamicLink | null > {
    return prisma.dynamicLink.findUnique({
        where: { slug },
        include: { activeGroup: true }
    });
}

    async deleteDynamicLink(id: string): Promise < void> {
    await prisma.dynamicLink.delete({ where: { id } });
}

    // ============================================================================
    // ROTATE GROUP LOGIC (Auto-scaling)
    // ============================================================================

    async rotateGroupIfNeeded(dynamicLinkId: string): Promise < WhatsappGroup | null > {
    const dynamicLink = await prisma.dynamicLink.findUnique({
        where: { id: dynamicLinkId },
        include: { activeGroup: true }
    });

    if(!dynamicLink) {
        throw new Error('Dynamic link not found');
    }

        const activeGroup = dynamicLink.activeGroup;

    // If no active group, create the first one
    if(!activeGroup) {
        const newGroup = await this.createGroup({
            name: `${dynamicLink.baseGroupName} 1`,
            instanceName: dynamicLink.instanceName,
            tenantId: dynamicLink.tenantId,
            capacity: dynamicLink.groupCapacity
        });

        await prisma.dynamicLink.update({
            where: { id: dynamicLinkId },
            data: { activeGroupId: newGroup.id }
        });

        return newGroup;
    }

        // Sync the current participant count from API
        const groupInfo = await evolutionApiService.getGroupInfo(dynamicLink.instanceName, activeGroup.jid);
    const currentParticipants = groupInfo?.participants?.length || activeGroup.currentParticipants;

    // Update the database
    await prisma.whatsappGroup.update({
        where: { id: activeGroup.id },
        data: { currentParticipants }
    });

    // Check if group is full
    if(currentParticipants >= dynamicLink.groupCapacity) {
    console.log(`📊 Group '${activeGroup.name}' is full (${currentParticipants}/${dynamicLink.groupCapacity}). Creating new group...`);

    // Mark current as FULL
    await prisma.whatsappGroup.update({
        where: { id: activeGroup.id },
        data: { status: 'FULL' }
    });

    // Count existing groups with this base name to get the next number
    const existingGroups = await prisma.whatsappGroup.count({
        where: {
            tenantId: dynamicLink.tenantId,
            name: { startsWith: dynamicLink.baseGroupName }
        }
    });

    // Create a new group
    const newGroup = await this.createGroup({
        name: `${dynamicLink.baseGroupName} ${existingGroups + 1}`,
        instanceName: dynamicLink.instanceName,
        tenantId: dynamicLink.tenantId,
        capacity: dynamicLink.groupCapacity
    });

    // Update the dynamic link to point to the new group
    await prisma.dynamicLink.update({
        where: { id: dynamicLinkId },
        data: { activeGroupId: newGroup.id }
    });

    console.log(`✅ Rotated to new group '${newGroup.name}'`);
    return newGroup;
}

return activeGroup;
    }

    async getActiveInviteLink(slug: string): Promise < string | null > {
    const dynamicLink = await this.getDynamicLinkBySlug(slug);
    if(!dynamicLink) {
        return null;
    }

        // Ensure we have an active, non-full group
        const activeGroup = await this.rotateGroupIfNeeded(dynamicLink.id);
    if(!activeGroup) {
        return null;
    }

        return activeGroup.inviteLink;
}

    // ============================================================================
    // BROADCAST MESSAGING
    // ============================================================================

    async broadcastMessage(
    instanceName: string,
    groupIds: string[],
    message: BroadcastMessage
): Promise < { success: string[]; failed: string[] } > {
    const results = { success: [] as string[], failed: [] as string[] };

    // Fetch groups to get their JIDs
    const groups = await prisma.whatsappGroup.findMany({
        where: { id: { in: groupIds } }
    });

    for(const group of groups) {
        try {
            await evolutionApiService.sendGroupMessage(instanceName, group.jid, message);
            results.success.push(group.id);
            console.log(`✅ Message sent to group '${group.name}'`);

            // Small delay between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`❌ Failed to send message to group '${group.name}':`, error);
            results.failed.push(group.id);
        }
    }

        return results;
}

    async broadcastToAllGroups(
    tenantId: string,
    instanceName: string,
    message: BroadcastMessage
): Promise < { success: string[]; failed: string[] } > {
    const groups = await prisma.whatsappGroup.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true }
    });

    return this.broadcastMessage(
        instanceName,
        groups.map(g => g.id),
        message
    );
}

    // ============================================================================
    // SYNC ALL GROUPS FROM EVOLUTION API
    // ============================================================================

    async syncAllGroupsFromApi(instanceName: string, tenantId: string): Promise < WhatsappGroup[] > {
    console.log(`🔄 Syncing all groups from instance '${instanceName}'`);

    const apiGroups = await evolutionApiService.fetchAllGroups(instanceName);
    const syncedGroups: WhatsappGroup[] = [];

    for(const apiGroup of apiGroups) {
        const synced = await this.syncGroupFromApi(instanceName, apiGroup.id, tenantId);
        if (synced) {
            syncedGroups.push(synced);
        }
    }

        console.log(`✅ Synced ${syncedGroups.length} groups from Evolution API`);
    return syncedGroups;
}
}

export const groupService = GroupService.getInstance();
