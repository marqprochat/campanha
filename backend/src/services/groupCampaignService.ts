import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateGroupCampaignParams {
    name: string;
    targetType: 'GROUPS' | 'CATEGORY';
    targetIds: string[];
    messageType: string;
    messageContent: any;
    instanceName: string;
    tenantId: string;
    scheduledFor: Date;
}

export class GroupCampaignService {
    private static instance: GroupCampaignService;

    public static getInstance(): GroupCampaignService {
        if (!GroupCampaignService.instance) {
            GroupCampaignService.instance = new GroupCampaignService();
        }
        return GroupCampaignService.instance;
    }

    async createCampaign(params: CreateGroupCampaignParams) {
        return prisma.groupCampaign.create({
            data: {
                name: params.name,
                targetType: params.targetType,
                targetIds: params.targetIds,
                messageType: params.messageType,
                messageContent: JSON.stringify(params.messageContent),
                instanceName: params.instanceName,
                tenantId: params.tenantId,
                scheduledFor: params.scheduledFor,
                status: 'PENDING'
            }
        });
    }

    async listCampaigns(tenantId: string) {
        return prisma.groupCampaign.findMany({
            where: { tenantId },
            orderBy: { scheduledFor: 'desc' }
        });
    }

    async getCampaign(id: string) {
        return prisma.groupCampaign.findUnique({
            where: { id }
        });
    }

    async cancelCampaign(id: string) {
        const campaign = await this.getCampaign(id);
        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (campaign.status !== 'PENDING') {
            throw new Error('Only PENDING campaigns can be canceled');
        }

        return prisma.groupCampaign.update({
            where: { id },
            data: { status: 'CANCELED' }
        });
    }
}

export const groupCampaignService = GroupCampaignService.getInstance();
