import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const quotaService = {
    async checkQuota(tenantId: string, resourceType: 'users' | 'contacts' | 'campaigns' | 'connections' | 'groups', increaseBy: number = 1): Promise<void> {
        const quota = await prisma.tenantQuota.findUnique({ where: { tenantId } });
        if (!quota) return; // If no quota entry is defined, maybe they are unlimited or we skip checking

        let currentCount = 0;

        switch (resourceType) {
            case 'users':
                currentCount = await prisma.user.count({ where: { tenantId } });
                if (currentCount + increaseBy > quota.maxUsers) throw new Error(`Limite de usuários excedido. O limite do seu plano é de ${quota.maxUsers}. Faça upgrade do seu plano para aumentar o limite.`);
                break;
            case 'contacts':
                currentCount = await prisma.contact.count({ where: { tenantId } });
                if (currentCount + increaseBy > quota.maxContacts) throw new Error(`Limite de contatos excedido. O limite do seu plano é de ${quota.maxContacts}. Faça upgrade do seu plano para aumentar o limite.`);
                break;
            case 'campaigns':
                // Perhaps only active or all campaigns? Usually all.
                currentCount = await prisma.campaign.count({ where: { tenantId } });
                if (currentCount + increaseBy > quota.maxCampaigns) throw new Error(`Limite de campanhas excedido. O limite do seu plano é de ${quota.maxCampaigns}. Faça upgrade do seu plano para aumentar o limite.`);
                break;
            case 'connections':
                currentCount = await prisma.whatsAppSession.count({ where: { tenantId } });
                if (currentCount + increaseBy > quota.maxConnections) throw new Error(`Limite de conexões de WhatsApp excedido. O limite do seu plano é de ${quota.maxConnections}. Faça upgrade do seu plano para aumentar o limite.`);
                break;
            case 'groups':
                currentCount = await prisma.whatsappGroup.count({ where: { tenantId } });
                if (currentCount + increaseBy > quota.maxGroups) throw new Error(`Limite de grupos excedido. O limite do seu plano é de ${quota.maxGroups}. Faça upgrade do seu plano para aumentar o limite.`);
                break;
        }
    }
};
