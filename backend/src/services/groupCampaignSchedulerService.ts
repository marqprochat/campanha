import { PrismaClient } from '@prisma/client';
import { groupService } from './groupService';
import { websocketService } from './websocketService';

const prisma = new PrismaClient();

class GroupCampaignSchedulerService {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;

    start() {
        if (this.isRunning) {
            console.log('Group Campaign scheduler already running');
            return;
        }

        console.log('Starting group campaign scheduler...');
        this.isRunning = true;

        // Check for campaigns every 30 seconds
        this.intervalId = setInterval(async () => {
            await this.processCampaigns();
        }, 30000);

        // Run immediately as well
        this.processCampaigns();
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('Stopping group campaign scheduler...');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private async processCampaigns() {
        try {
            // Find campaigns that are scheduled but not yet executing, and whose time has arrived
            const campaignsToExecute = await prisma.groupCampaign.findMany({
                where: {
                    status: 'PENDING',
                    scheduledFor: { lte: new Date() }
                }
            });

            for (const campaign of campaignsToExecute) {
                await this.executeCampaign(campaign);
            }
        } catch (error) {
            console.error('Error processing group campaigns:', error);
        }
    }

    private async executeCampaign(campaign: any) {
        console.log(`🚀 Executing scheduled group campaign: ${campaign.name} (${campaign.id})`);

        try {
            // Mark as RUNNING
            await prisma.groupCampaign.update({
                where: { id: campaign.id },
                data: { status: 'RUNNING' }
            });

            // Parse message content
            const messageContent = JSON.parse(campaign.messageContent);

            // Build the message payload expected by groupService.broadcastMessage
            const messagePayload: any = {};
            if (campaign.messageType === 'image') {
                messagePayload.image = { url: messageContent.url };
                messagePayload.caption = messageContent.caption || '';
            } else if (campaign.messageType === 'video') {
                messagePayload.video = { url: messageContent.url };
                messagePayload.caption = messageContent.caption || '';
            } else {
                messagePayload.text = messageContent.text || messageContent;
            }

            let results: { success: string[]; failed: string[] } = { success: [], failed: [] };

            // Determine broadcast target
            if (campaign.targetType === 'GROUPS') {
                results = await groupService.broadcastMessage(
                    campaign.instanceName,
                    campaign.targetIds,
                    messagePayload
                );
            } else if (campaign.targetType === 'CATEGORY') {
                // If it's a CATEGORY, targetIds should contain the category ID (usually just one)
                const categoryId = campaign.targetIds[0];
                if (categoryId) {
                    results = await groupService.broadcastToCategory(
                        campaign.tenantId,
                        campaign.instanceName,
                        categoryId,
                        messagePayload
                    );
                }
            }

            // Mark as COMPLETED and update counters
            await prisma.groupCampaign.update({
                where: { id: campaign.id },
                data: {
                    status: 'COMPLETED',
                    sentCount: results.success.length,
                    failedCount: results.failed.length
                }
            });

            console.log(`✅ Campaign ${campaign.name} completed. Sent: ${results.success.length}, Failed: ${results.failed.length}`);

            // Notify via WebSocket if active
            if (campaign.tenantId && websocketService.isInitialized) {
                await websocketService.notifyTenant(campaign.tenantId, {
                    title: 'Disparo de Grupos Concluído',
                    message: `O disparo "${campaign.name}" agendado para as grupas foi finalizado.`,
                    type: 'SUCCESS',
                    data: { campaignId: campaign.id, status: 'COMPLETED', sent: results.success.length, failed: results.failed.length }
                });
            }

        } catch (error) {
            console.error(`❌ Error executing group campaign ${campaign.id}:`, error);

            // Mark as FAILED
            await prisma.groupCampaign.update({
                where: { id: campaign.id },
                data: { status: 'FAILED' }
            });

            // Notify via WebSocket if active
            if (campaign.tenantId && websocketService.isInitialized) {
                await websocketService.notifyTenant(campaign.tenantId, {
                    title: 'Erro no Disparo de Grupos',
                    message: `Ocorreu um erro ao executar o disparo "${campaign.name}".`,
                    type: 'ERROR',
                    data: { campaignId: campaign.id, status: 'FAILED' }
                });
            }
        }
    }
}

export const groupCampaignSchedulerService = new GroupCampaignSchedulerService();
