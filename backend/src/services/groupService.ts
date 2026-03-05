import { PrismaClient, WhatsappGroup, DynamicLink } from '@prisma/client';
import { evolutionApiService } from './evolutionApiService';

const prisma = new PrismaClient();

interface CreateGroupParams {
    name: string;
    instanceName: string;
    tenantId: string;
    capacity?: number;
    initialParticipants?: string[];
    adminOnly?: boolean;
    adminNumbers?: string[];
    description?: string;
    categoryId?: string;
    imageUrl?: string;
    onProgress?: (step: string) => void;
}

interface UpdateGroupParams {
    categoryId?: string;
    name?: string;
    imageUrl?: string;
}


interface CreateDynamicLinkParams {
    slug: string;
    name: string;
    baseGroupName: string;
    instanceName: string;
    tenantId: string;
    groupCapacity?: number;
    initialParticipants?: string[];
    adminOnly?: boolean;
    adminNumbers?: string[];
    description?: string;
    image?: string;
    onProgress?: (step: string) => void;
}

interface BroadcastMessage {
    text?: string;
    image?: { url: string };
    caption?: string;
    video?: { url: string };
}

export class GroupService {
    private static instance: GroupService;

    public static getInstance(): GroupService {
        if (!GroupService.instance) {
            GroupService.instance = new GroupService();
        }
        return GroupService.instance;
    }

    // ============================================================================
    // GROUP CRUD
    // ============================================================================

    async createGroup(params: CreateGroupParams): Promise<WhatsappGroup> {
        const { name, instanceName, tenantId, capacity = 1023, initialParticipants = [], adminOnly = false, adminNumbers = [], description, categoryId, imageUrl, onProgress } = params;

        console.log(`📱 Creating group '${name}' on instance '${instanceName}'`);
        onProgress?.('Criando grupo na Evolution API...');

        // 1. Create group via Evolution API
        const apiResult = await evolutionApiService.createGroup(instanceName, name, initialParticipants, description);
        console.log('📱 Evolution API createGroup result:', JSON.stringify(apiResult, null, 2));

        // The response structure may vary, typically { groupMetadata: { id: 'xxx@g.us', ... } }
        const groupJid = apiResult.groupMetadata?.id || apiResult.id;
        if (!groupJid) {
            throw new Error('Failed to create group: No JID returned from Evolution API');
        }

        // 2. Apply admin settings
        if (adminOnly) {
            try {
                onProgress?.('Configurando grupo para restrito a administradores...');
                console.log(`🔒 Setting group ${groupJid} to admin-only (announcement mode)`);
                await evolutionApiService.updateGroupSetting(instanceName, groupJid, 'announcement');
                console.log(`✅ Group ${groupJid} set to admin-only`);
            } catch (error) {
                console.error(`⚠️ Failed to set admin-only for group ${groupJid}:`, error);
            }
        }

        if (adminNumbers.length > 0) {
            try {
                // Format numbers for WhatsApp (ensure @s.whatsapp.net suffix)
                const formattedAdmins = adminNumbers.map(num => {
                    const clean = num.replace(/\D/g, '');
                    return clean.includes('@') ? clean : `${clean}@s.whatsapp.net`;
                });
                onProgress?.(`Promovendo ${formattedAdmins.length} administradores...`);
                console.log(`👑 Promoting admins in group ${groupJid}:`, formattedAdmins);
                await evolutionApiService.updateParticipant(instanceName, groupJid, 'promote', formattedAdmins);
                console.log(`✅ Admins promoted in group ${groupJid}`);
            } catch (error) {
                console.error(`⚠️ Failed to promote admins in group ${groupJid}:`, error);
            }
        }

        onProgress?.('Gerando link de convite...');
        const inviteCode = await evolutionApiService.getGroupInviteCode(instanceName, groupJid);
        const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null;

        // 4. Update group picture if provided
        if (imageUrl) {
            try {
                onProgress?.('Atualizando imagem do grupo...');
                let finalImage = imageUrl;

                if (imageUrl.startsWith('/api/uploads/')) {
                    const fs = require('fs');
                    const path = require('path');
                    const filename = imageUrl.replace('/api/uploads/', '');
                    const uploadDir = process.env.NODE_ENV === 'production' ? '/app/uploads' : path.join(process.cwd(), 'uploads');
                    const filePath = path.join(uploadDir, filename);

                    if (fs.existsSync(filePath)) {
                        const fileBuffer = fs.readFileSync(filePath);
                        const ext = path.extname(filePath).toLowerCase();
                        let mimeType = 'image/jpeg';
                        if (ext === '.png') mimeType = 'image/png';
                        else if (ext === '.webp') mimeType = 'image/webp';

                        // Evolution API usually accepts base64 with or without data URL prefix, 
                        // but setting the base64 encoded string directly is safer for whatsapp-baileys
                        finalImage = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                    }
                }

                await evolutionApiService.updateGroupPicture(instanceName, groupJid, finalImage);
            } catch (error) {
                console.error(`⚠️ Failed to update group picture for ${groupJid}:`, error);
            }
        }

        onProgress?.('Registrando no banco de dados...');
        // 5. Create database record
        const group = await prisma.whatsappGroup.create({
            data: {
                name,
                jid: groupJid,
                inviteCode,
                inviteLink,
                capacity,
                currentParticipants: initialParticipants.length + 1, // +1 for the bot itself
                instanceName,
                tenantId,
                status: 'ACTIVE',
                categoryId,
                imageUrl
            }
        });

        console.log(`✅ Group '${name}' created with JID: ${groupJid}`);
        onProgress?.('Concluído!');
        return group;
    }

    async listGroups(tenantId: string): Promise<WhatsappGroup[]> {
        return prisma.whatsappGroup.findMany({
            where: { tenantId },
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async listGroupsByCategory(tenantId: string, categoryId: string): Promise<WhatsappGroup[]> {
        return prisma.whatsappGroup.findMany({
            where: { tenantId, categoryId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getGroup(id: string): Promise<WhatsappGroup | null> {
        return prisma.whatsappGroup.findUnique({
            where: { id }
        });
    }

    async updateGroupParticipants(groupId: string, count: number): Promise<WhatsappGroup> {
        const group = await prisma.whatsappGroup.update({
            where: { id: groupId },
            data: {
                currentParticipants: count,
                status: count >= 1023 ? 'FULL' : 'ACTIVE'
            }
        });
        return group;
    }

    async updateGroup(id: string, params: UpdateGroupParams): Promise<WhatsappGroup> {
        return prisma.whatsappGroup.update({
            where: { id },
            data: params,
            include: { category: true }
        });
    }

    async syncGroupFromApi(instanceName: string, groupJid: string, tenantId: string): Promise<WhatsappGroup | null> {
        try {
            const groupInfo = await evolutionApiService.getGroupInfo(instanceName, groupJid);
            if (!groupInfo) return null;

            // Update existing or create new
            const existing = await prisma.whatsappGroup.findUnique({ where: { jid: groupJid } });

            const participantCount = groupInfo.participants?.length || 0;
            const inviteCode = await evolutionApiService.getGroupInviteCode(instanceName, groupJid);
            const inviteLink = inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : null;

            if (existing) {
                return prisma.whatsappGroup.update({
                    where: { jid: groupJid },
                    data: {
                        name: groupInfo.subject || existing.name,
                        currentParticipants: participantCount,
                        inviteCode,
                        inviteLink,
                        status: participantCount >= existing.capacity ? 'FULL' : 'ACTIVE'
                    }
                });
            } else {
                return prisma.whatsappGroup.create({
                    data: {
                        name: groupInfo.subject || 'Unknown Group',
                        jid: groupJid,
                        inviteCode,
                        inviteLink,
                        capacity: 1023,
                        currentParticipants: participantCount,
                        instanceName,
                        tenantId,
                        status: participantCount >= 1023 ? 'FULL' : 'ACTIVE'
                    }
                });
            }
        } catch (error) {
            console.error(`Error syncing group ${groupJid}:`, error);
            return null;
        }
    }

    async deleteGroup(id: string): Promise<void> {
        const group = await prisma.whatsappGroup.findUnique({ where: { id } });
        if (group) {
            try {
                await evolutionApiService.leaveGroup(group.instanceName, group.jid);
            } catch (error) {
                console.error(`Falha ao sair do grupo ${group.jid} na Evolution API:`, error);
            }
        }
        await prisma.whatsappGroup.delete({ where: { id } });
    }

    async deleteGroupsBatch(ids: string[]): Promise<number> {
        if (!ids || ids.length === 0) return 0;

        const groups = await prisma.whatsappGroup.findMany({ where: { id: { in: ids } } });

        for (const group of groups) {
            try {
                await evolutionApiService.leaveGroup(group.instanceName, group.jid);
                // Pequeno delay para não sobrecarregar a API
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Falha ao sair do grupo ${group.jid} lutando no lote:`, error);
            }
        }

        const result = await prisma.whatsappGroup.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        return result.count;
    }

    // ============================================================================
    // DYNAMIC LINK MANAGEMENT
    // ============================================================================

    async createDynamicLink(params: CreateDynamicLinkParams): Promise<DynamicLink> {
        const { slug, name, baseGroupName, instanceName, tenantId, groupCapacity = 1023, initialParticipants = [], adminOnly = false, adminNumbers = [], description, image, onProgress } = params;

        console.log(`🔗 Creating dynamic link '${slug}' for groups named '${baseGroupName}'`);

        // Create the first group for this dynamic link
        const firstGroup = await this.createGroup({
            name: `${baseGroupName} 1`,
            instanceName,
            tenantId,
            capacity: groupCapacity,
            initialParticipants,
            adminOnly,
            adminNumbers,
            description,
            imageUrl: image,
            onProgress
        });

        onProgress?.('Preparando link dinâmico...');
        // Create the dynamic link pointing to this group
        const dynamicLink = await prisma.dynamicLink.create({
            data: {
                slug,
                name,
                baseGroupName,
                groupCapacity,
                instanceName,
                tenantId,
                activeGroupId: firstGroup.id,
                adminOnly,
                adminNumbers: adminNumbers.length > 0 ? adminNumbers.join(',') : null,
                groupDescription: description || null,
                image
            }
        });

        console.log(`✅ Dynamic link '${slug}' created, pointing to group '${firstGroup.name}'`);
        onProgress?.('Link dinâmico criado e ativo!');
        return dynamicLink;
    }

    async listDynamicLinks(tenantId: string): Promise<DynamicLink[]> {
        return prisma.dynamicLink.findMany({
            where: { tenantId },
            include: { activeGroup: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getDynamicLink(id: string): Promise<DynamicLink | null> {
        return prisma.dynamicLink.findUnique({
            where: { id },
            include: { activeGroup: true }
        });
    }

    async getDynamicLinkBySlug(slug: string): Promise<DynamicLink | null> {
        return prisma.dynamicLink.findUnique({
            where: { slug },
            include: { activeGroup: true }
        });
    }

    async deleteDynamicLink(id: string): Promise<void> {
        await prisma.dynamicLink.delete({ where: { id } });
    }

    // ============================================================================
    // ROTATE GROUP LOGIC (Auto-scaling)
    // ============================================================================

    async rotateGroupIfNeeded(dynamicLinkId: string): Promise<WhatsappGroup | null> {
        const dynamicLink = await prisma.dynamicLink.findUnique({
            where: { id: dynamicLinkId },
            include: { activeGroup: true }
        });

        if (!dynamicLink) {
            throw new Error('Dynamic link not found');
        }

        const activeGroup = dynamicLink.activeGroup;

        // If no active group, create the first one
        if (!activeGroup) {
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
        if (currentParticipants >= dynamicLink.groupCapacity) {
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

            // Parse admin numbers from dynamic link
            const savedAdminNumbers = dynamicLink.adminNumbers
                ? dynamicLink.adminNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n)
                : [];

            // Create a new group with same admin settings
            const newGroup = await this.createGroup({
                name: `${dynamicLink.baseGroupName} ${existingGroups + 1}`,
                instanceName: dynamicLink.instanceName,
                tenantId: dynamicLink.tenantId,
                capacity: dynamicLink.groupCapacity,
                adminOnly: dynamicLink.adminOnly,
                adminNumbers: savedAdminNumbers,
                description: dynamicLink.groupDescription || undefined,
                imageUrl: dynamicLink.image || undefined
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

    async getActiveInviteLink(slug: string): Promise<string | null> {
        const dynamicLink = await this.getDynamicLinkBySlug(slug);
        if (!dynamicLink) {
            return null;
        }

        // Ensure we have an active, non-full group
        const activeGroup = await this.rotateGroupIfNeeded(dynamicLink.id);
        if (!activeGroup) {
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
    ): Promise<{ success: string[]; failed: string[] }> {
        const results = { success: [] as string[], failed: [] as string[] };

        // Fetch groups to get their JIDs
        const groups = await prisma.whatsappGroup.findMany({
            where: { id: { in: groupIds } }
        });

        for (const group of groups) {
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
    ): Promise<{ success: string[]; failed: string[] }> {
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

    async broadcastToCategory(
        tenantId: string,
        instanceName: string,
        categoryId: string,
        message: BroadcastMessage
    ): Promise<{ success: string[]; failed: string[] }> {
        const groups = await prisma.whatsappGroup.findMany({
            where: { tenantId, categoryId, status: 'ACTIVE' },
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

    async syncAllGroupsFromApi(instanceName: string, tenantId: string): Promise<WhatsappGroup[]> {
        console.log(`🔄 Syncing all groups from instance '${instanceName}'`);

        const apiGroups = await evolutionApiService.fetchAllGroups(instanceName);
        const syncedGroups: WhatsappGroup[] = [];

        for (const apiGroup of apiGroups) {
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
