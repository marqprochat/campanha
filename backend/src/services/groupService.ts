import { PrismaClient } from '@prisma/client';
import { evolutionApiService } from './evolutionApiService';
import { sendMessageViaEvolution } from './evolutionMessageService';

const prisma = new PrismaClient();

export class GroupService {
    private static instance: GroupService;

    public static getInstance(): GroupService {
        if (!GroupService.instance) {
            GroupService.instance = new GroupService();
        }
        return GroupService.instance;
    }

    // --- Group Management ---

    async createGroup({
        tenantId,
        instanceName,
        groupName,
        participants,
        dynamicLinkId
    }: {
        tenantId: string;
        instanceName: string;
        groupName: string;
        participants: string[];
        dynamicLinkId?: string;
    }) {
        // 1. Create in Evolution API
        // Evolution API creates and returns metadata. We might need the JID.
        const evoResponse = await evolutionApiService.createGroup(instanceName, groupName, participants);
        console.log('Evolution Create Group Response:', evoResponse);

        // Assuming evoResponse contains the group JID.
        // Structure might vary, we need to adapt based on actual response.
        // Usually it returns { participants: [...], groupJid: '...' } or similar.
        const groupJid = evoResponse.groupJid || evoResponse.id || evoResponse.gid;

        if (!groupJid) {
            throw new Error('Failed to get Group JID from Evolution API response');
        }

        // 2. Get Invite Code/Link
        let inviteLink = '';
        const inviteCode = await evolutionApiService.getGroupInviteCode(instanceName, groupJid);
        if (inviteCode) {
            inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        }

        // 3. Save to Database
        const group = await prisma.whatsappGroup.create({
            data: {
                name: groupName,
                jid: groupJid,
                instanceName,
                tenantId,
                inviteCode,
                inviteLink,
                currentParticipants: participants.length, // Initial count
                // capacity default is 1023
            }
        });

        // 4. If associated with a Dynamic Link, update it if needed
        if (dynamicLinkId) {
            // Connect specifically or logic handled elsewhere
        }

        return group;
    }

    async listGroups(tenantId: string) {
        return await prisma.whatsappGroup.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async syncGroupsFromEvolution(tenantId: string, instanceName: string) {
        const evoGroups = await evolutionApiService.fetchAllGroups(instanceName);
        // Upsert groups into DB
        for (const grp of evoGroups) {
            // grp structure depends on evolution version
            const jid = grp.id || grp.jid;
            const subject = grp.subject || grp.name;
            const participantCount = grp.participants ? grp.participants.length : 0;

            if (!jid) continue;

            await prisma.whatsappGroup.upsert({
                where: { jid },
                update: {
                    name: subject,
                    currentParticipants: participantCount,
                    // Don't overwrite instanceName if it might be different, but usually matches
                },
                create: {
                    jid,
                    name: subject,
                    currentParticipants: participantCount,
                    instanceName,
                    tenantId
                }
            });
        }
    }

    // --- Dynamic Linking & Auto-Scaling ---

    async createDynamicLink(tenantId: string, data: {
        slug: string,
        name: string,
        baseGroupName: string,
        groupCapacity: number,
        instanceName: string
    }) {
        return await prisma.dynamicLink.create({
            data: {
                tenantId,
                ...data
            }
        });
    }

    async getDynamicLinkBySlug(slug: string) {
        return await prisma.dynamicLink.findUnique({
            where: { slug },
            include: { activeGroup: true }
        });
    }

    async getRedirectLink(slug: string): Promise<string> {
        const dynamicLink = await prisma.dynamicLink.findUnique({
            where: { slug },
            include: { activeGroup: true }
        });

        if (!dynamicLink) {
            throw new Error('Link not found');
        }

        // Check if we need to rotate/create a new group
        let activeGroup = dynamicLink.activeGroup;

        if (!activeGroup || this.isGroupFull(activeGroup, dynamicLink.groupCapacity)) {
            activeGroup = await this.rotateGroup(dynamicLink);
        }

        // Return the invite link of the valid active group
        if (!activeGroup.inviteLink) {
            // Try to fetch it again if missing
            const code = await evolutionApiService.getGroupInviteCode(activeGroup.instanceName, activeGroup.jid);
            if (code) {
                const link = `https://chat.whatsapp.com/${code}`;
                await prisma.whatsappGroup.update({
                    where: { id: activeGroup.id },
                    data: { inviteCode: code, inviteLink: link }
                });
                return link;
            }
            throw new Error('Active group has no invite link available');
        }

        return activeGroup.inviteLink;
    }

    private isGroupFull(group: any, limit: number): boolean {
        // 1. Check DB count (optimistic)
        if (group.currentParticipants >= limit) return true;

        // 2. Ideally, check real-time with Evolution if critical, 
        //    but for performance we might rely on webhooks or periodic syncs.
        //    For now, trust DB.
        return false;
    }

    private async rotateGroup(dynamicLink: any): Promise<any> {
        // Create a new group with incremented name
        // Logic to find next number: "Group Name 1" -> "Group Name 2"

        // Find how many groups this dynamic link has used? 
        // Easier: Count groups with name starting with baseName
        const count = await prisma.whatsappGroup.count({
            where: {
                tenantId: dynamicLink.tenantId,
                name: { startsWith: dynamicLink.baseGroupName }
            }
        });

        const nextNumber = count + 1;
        const newGroupName = `${dynamicLink.baseGroupName} ${nextNumber}`;

        const newGroup = await this.createGroup({
            tenantId: dynamicLink.tenantId,
            instanceName: dynamicLink.instanceName,
            groupName: newGroupName,
            participants: [], // Empty initially? Or add the admin/system number?
            dynamicLinkId: dynamicLink.id
        });

        // Update Dynamic Link to point to this new group
        await prisma.dynamicLink.update({
            where: { id: dynamicLink.id },
            data: { activeGroupId: newGroup.id }
        });

        // Also, we might want to link this group to the DynamicLink in DB if we added a relation field inverse?
        // In schema: DynamicLink has activeGroupId. 
        // WhatsappGroup has dynamicLinks[] (many-to-many potentially or one-to-many inverse).
        // Specifically `activeGroup` is a relation.

        // Add relation to the list of "controlled groups" if we had that relation explicit.
        // The current schema has `dynamicLinks DynamicLink[]` on WhatsappGroup, 
        // implying a group can belong to multiple dynamic links or be the active one.
        // But we don't have a "history" relation, only "activeGroup".
        // That's fine for now.

        return newGroup;
    }

    // --- Broadcast ---

    async broadcastMessage(instanceName: string, groupJids: string[], message: any) {
        const results = [];
        for (const jid of groupJids) {
            try {
                console.log(`Broadcasting to group ${jid} on instance ${instanceName}`);
                await evolutionApiService.sendGroupMessage(instanceName, jid, message);
                results.push({ jid, status: 'success' });
            } catch (e: any) {
                console.error(`Failed to broadcast to ${jid}:`, e);
                results.push({ jid, status: 'failed', error: e.message });
            }
            // Small delay to prevent rate limit issues
            await new Promise(r => setTimeout(r, 1000));
        }
        return results;
    }
}

export const groupService = GroupService.getInstance();
