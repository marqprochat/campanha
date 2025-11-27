"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingService = exports.ReportingService = void 0;
const client_1 = require("@prisma/client");
const websocketService_1 = require("./websocketService");
const prisma = new client_1.PrismaClient();
class ReportingService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!ReportingService.instance) {
            ReportingService.instance = new ReportingService();
        }
        return ReportingService.instance;
    }
    // Gerar relatório completo de performance
    async generatePerformanceReport(tenantId, filters) {
        try {
            console.log(`📊 Gerando relatório de performance para tenant ${tenantId}`);
            // Notificar início da geração do relatório
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Relatório em Processamento',
                message: 'Iniciando geração do relatório de performance...',
                type: 'INFO',
                data: { type: 'performance_report', tenantId }
            });
            const whereClause = this.buildWhereClause(tenantId, filters);
            // Executar consultas em paralelo para otimizar performance
            const [campaigns, messages, sessionStats] = await Promise.all([
                this.getCampaignMetrics(whereClause),
                this.getMessageStats(whereClause),
                this.getSessionPerformance(tenantId, filters)
            ]);
            // Calcular métricas de resumo
            const summary = this.calculateSummaryMetrics(campaigns, filters);
            // Gerar dados de série temporal
            const timeSeries = await this.generateTimeSeriesData(tenantId, filters);
            // Calcular performance por tags
            const tagPerformance = await this.getTagPerformance(tenantId, filters);
            const report = {
                summary,
                campaigns,
                timeSeries,
                sessionPerformance: sessionStats,
                tagPerformance
            };
            // Notificar conclusão da geração do relatório
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Relatório Concluído',
                message: `Relatório de performance gerado com ${campaigns.length} campanhas analisadas.`,
                type: 'SUCCESS',
                data: {
                    type: 'performance_report',
                    tenantId,
                    campaignsCount: campaigns.length,
                    messagesCount: summary.totalMessages
                }
            });
            console.log(`✅ Relatório gerado para tenant ${tenantId}: ${campaigns.length} campanhas, ${summary.totalMessages} mensagens`);
            return report;
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            // Notificar erro na geração do relatório
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Erro no Relatório',
                message: `Falha ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    type: 'performance_report_error',
                    tenantId,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                }
            });
            throw error;
        }
    }
    // Relatório de comparação de períodos
    async generateComparisonReport(tenantId, currentPeriod, previousPeriod) {
        try {
            const [currentReport, previousReport] = await Promise.all([
                this.generatePerformanceReport(tenantId, currentPeriod),
                this.generatePerformanceReport(tenantId, previousPeriod)
            ]);
            const comparison = {
                current: currentReport.summary,
                previous: previousReport.summary,
                changes: {
                    totalCampaigns: currentReport.summary.totalCampaigns - previousReport.summary.totalCampaigns,
                    totalMessages: currentReport.summary.totalMessages - previousReport.summary.totalMessages,
                    successRate: Number((currentReport.summary.successRate - previousReport.summary.successRate).toFixed(2)),
                    deliveryRate: Number((currentReport.summary.deliveryRate - previousReport.summary.deliveryRate).toFixed(2)),
                    readRate: Number((currentReport.summary.readRate - previousReport.summary.readRate).toFixed(2))
                },
                percentageChanges: {
                    totalCampaigns: previousReport.summary.totalCampaigns > 0
                        ? Number((((currentReport.summary.totalCampaigns - previousReport.summary.totalCampaigns) / previousReport.summary.totalCampaigns) * 100).toFixed(2))
                        : 0,
                    totalMessages: previousReport.summary.totalMessages > 0
                        ? Number((((currentReport.summary.totalMessages - previousReport.summary.totalMessages) / previousReport.summary.totalMessages) * 100).toFixed(2))
                        : 0,
                    successRate: previousReport.summary.successRate > 0
                        ? Number((((currentReport.summary.successRate - previousReport.summary.successRate) / previousReport.summary.successRate) * 100).toFixed(2))
                        : 0
                }
            };
            return {
                comparison,
                currentPeriod: currentReport,
                previousPeriod: previousReport
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório de comparação:', error);
            throw error;
        }
    }
    // Relatório de análise de contatos
    async generateContactAnalysis(tenantId, filters) {
        try {
            // Análise de engajamento por contato
            const engagementAnalysis = await prisma.$queryRaw `
        SELECT
          c.nome,
          c.telefone,
          COUNT(cm.id) as total_messages,
          SUM(CASE WHEN cm.status = 'SENT' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN cm.status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered_count,
          SUM(CASE WHEN cm.status = 'READ' THEN 1 ELSE 0 END) as read_count,
          SUM(CASE WHEN cm.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
          AVG(CASE WHEN cm.delivered_at IS NOT NULL AND cm.sent_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (cm.delivered_at - cm.sent_at))
              ELSE NULL END) as avg_delivery_time,
          STRING_AGG(DISTINCT camp.nome, ', ') as campaigns
        FROM contacts c
        LEFT JOIN campaign_messages cm ON c.telefone = cm.contact_phone
        LEFT JOIN campaigns camp ON cm.campaign_id = camp.id
        WHERE c.tenant_id = ${tenantId}
          AND (${filters.startDate} IS NULL OR camp.created_at >= ${filters.startDate})
          AND (${filters.endDate} IS NULL OR camp.created_at <= ${filters.endDate})
        GROUP BY c.id, c.nome, c.telefone
        HAVING COUNT(cm.id) > 0
        ORDER BY total_messages DESC
        LIMIT 100
      `;
            // Top contatos mais responsivos
            const topResponsiveContacts = await prisma.$queryRaw `
        SELECT
          c.nome,
          c.telefone,
          COUNT(cm.id) as total_messages,
          SUM(CASE WHEN cm.status = 'READ' THEN 1 ELSE 0 END) as read_count,
          ROUND((SUM(CASE WHEN cm.status = 'READ' THEN 1 ELSE 0 END)::float / COUNT(cm.id)) * 100, 2) as read_rate
        FROM contacts c
        JOIN campaign_messages cm ON c.telefone = cm.contact_phone
        JOIN campaigns camp ON cm.campaign_id = camp.id
        WHERE c.tenant_id = ${tenantId}
          AND (${filters.startDate} IS NULL OR camp.created_at >= ${filters.startDate})
          AND (${filters.endDate} IS NULL OR camp.created_at <= ${filters.endDate})
        GROUP BY c.id, c.nome, c.telefone
        HAVING COUNT(cm.id) >= 3
        ORDER BY read_rate DESC, total_messages DESC
        LIMIT 20
      `;
            return {
                engagementAnalysis,
                topResponsiveContacts,
                totalAnalyzedContacts: engagementAnalysis.length
            };
        }
        catch (error) {
            console.error('❌ Erro ao gerar análise de contatos:', error);
            throw error;
        }
    }
    // Relatório personalizado com queries customizadas
    async generateCustomReport(tenantId, reportConfig) {
        try {
            console.log(`📋 Gerando relatório customizado "${reportConfig.name}" para tenant ${tenantId}`);
            const data = await this.executeCustomQuery(tenantId, reportConfig);
            const report = {
                metadata: {
                    name: reportConfig.name,
                    description: reportConfig.description,
                    generatedAt: new Date(),
                    tenantId,
                    recordCount: Array.isArray(data) ? data.length : 0
                },
                config: reportConfig,
                data
            };
            // Notificar sobre relatório customizado gerado
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Relatório Personalizado Gerado',
                message: `Relatório "${reportConfig.name}" foi gerado com sucesso.`,
                type: 'SUCCESS',
                data: {
                    reportName: reportConfig.name,
                    recordCount: report.metadata.recordCount
                }
            });
            return report;
        }
        catch (error) {
            console.error('❌ Erro ao gerar relatório customizado:', error);
            throw error;
        }
    }
    // Exportar relatório para diferentes formatos
    async exportReport(tenantId, reportData, format) {
        try {
            if (format === 'json') {
                return JSON.stringify(reportData, null, 2);
            }
            else if (format === 'csv') {
                return this.convertToCSV(reportData);
            }
            else {
                throw new Error('Formato de exportação não suportado');
            }
        }
        catch (error) {
            console.error('❌ Erro ao exportar relatório:', error);
            throw error;
        }
    }
    // Métodos auxiliares privados
    buildWhereClause(tenantId, filters) {
        const where = { tenantId };
        if (filters.startDate) {
            where.criadoEm = { ...where.criadoEm, gte: filters.startDate };
        }
        if (filters.endDate) {
            where.criadoEm = { ...where.criadoEm, lte: filters.endDate };
        }
        if (filters.campaignIds && filters.campaignIds.length > 0) {
            where.id = { in: filters.campaignIds };
        }
        if (filters.sessionNames && filters.sessionNames.length > 0) {
            where.sessionName = { in: filters.sessionNames };
        }
        if (filters.status && filters.status.length > 0) {
            where.status = { in: filters.status };
        }
        return where;
    }
    async getCampaignMetrics(whereClause) {
        const campaigns = await prisma.campaign.findMany({
            where: whereClause,
            include: {
                messages: {
                    select: {
                        status: true,
                        sentAt: true,
                        deliveredAt: true,
                        readAt: true
                    }
                }
            },
            orderBy: { criadoEm: 'desc' }
        });
        return campaigns.map(campaign => {
            const messages = campaign.messages || [];
            const sentCount = messages.filter(m => ['SENT', 'DELIVERED', 'READ'].includes(m.status)).length;
            const deliveredCount = messages.filter(m => ['DELIVERED', 'READ'].includes(m.status)).length;
            const readCount = messages.filter(m => m.status === 'READ').length;
            const failedCount = messages.filter(m => m.status === 'FAILED').length;
            return {
                campaignId: campaign.id,
                campaignName: campaign.nome,
                totalContacts: campaign.totalContacts || messages.length,
                sentCount,
                deliveredCount,
                readCount,
                failedCount,
                successRate: campaign.totalContacts > 0 ? Number(((sentCount / campaign.totalContacts) * 100).toFixed(2)) : 0,
                deliveryRate: sentCount > 0 ? Number(((deliveredCount / sentCount) * 100).toFixed(2)) : 0,
                readRate: deliveredCount > 0 ? Number(((readCount / deliveredCount) * 100).toFixed(2)) : 0,
                createdAt: campaign.criadoEm,
                completedAt: campaign.completedAt,
                status: campaign.status,
                sessionName: campaign.sessionName
            };
        });
    }
    async getMessageStats(whereClause) {
        const messages = await prisma.campaignMessage.findMany({
            where: {
                campaign: whereClause
            },
            select: {
                status: true,
                sentAt: true,
                deliveredAt: true,
                readAt: true
            }
        });
        return {
            total: messages.length,
            sent: messages.filter(m => ['SENT', 'DELIVERED', 'READ'].includes(m.status)).length,
            delivered: messages.filter(m => ['DELIVERED', 'READ'].includes(m.status)).length,
            read: messages.filter(m => m.status === 'read').length,
            failed: messages.filter(m => m.status === 'FAILED').length
        };
    }
    async getSessionPerformance(tenantId, filters) {
        const sessions = await prisma.whatsAppSession.findMany({
            where: {
                tenantId,
                ...(filters.sessionNames && { name: { in: filters.sessionNames } })
            },
            include: {
                campaigns: {
                    where: this.buildWhereClause(tenantId, filters),
                    include: {
                        messages: true
                    }
                }
            }
        });
        return sessions.map(session => {
            const allMessages = session.campaigns.flatMap(c => c.messages || []);
            const sentCount = allMessages.filter(m => ['SENT', 'DELIVERED', 'READ'].includes(m.status)).length;
            const totalMessages = allMessages.length;
            return {
                sessionName: session.name,
                totalMessages,
                successRate: totalMessages > 0 ? Number(((sentCount / totalMessages) * 100).toFixed(2)) : 0,
                avgDeliveryTime: 0, // Calcular se necessário
                status: session.status
            };
        });
    }
    async generateTimeSeriesData(tenantId, filters) {
        const messages = await prisma.$queryRaw `
      SELECT
        DATE(cm.sent_at) as date,
        COUNT(*) as sent,
        SUM(CASE WHEN cm.status IN ('DELIVERED', 'read') THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN cm.status = 'FAILED' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN cm.status = 'read' THEN 1 ELSE 0 END) as read
      FROM campaign_messages cm
      JOIN campaigns c ON cm.campaign_id = c.id
      WHERE c.tenant_id = ${tenantId}
        AND (${filters.startDate} IS NULL OR cm.sent_at >= ${filters.startDate})
        AND (${filters.endDate} IS NULL OR cm.sent_at <= ${filters.endDate})
        AND cm.sent_at IS NOT NULL
      GROUP BY DATE(cm.sent_at)
      ORDER BY date ASC
    `;
        return messages.map(row => ({
            date: row.date,
            sent: Number(row.sent),
            delivered: Number(row.delivered),
            failed: Number(row.failed),
            read: Number(row.read)
        }));
    }
    async getTagPerformance(tenantId, filters) {
        // Esta implementação dependeria de como as tags são armazenadas
        // Por simplicidade, retornando array vazio
        return [];
    }
    calculateSummaryMetrics(campaigns, filters) {
        const totalCampaigns = campaigns.length;
        const totalMessages = campaigns.reduce((sum, c) => sum + c.totalContacts, 0);
        const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
        const totalDelivered = campaigns.reduce((sum, c) => sum + c.deliveredCount, 0);
        const totalRead = campaigns.reduce((sum, c) => sum + c.readCount, 0);
        return {
            totalCampaigns,
            totalMessages,
            successRate: totalMessages > 0 ? Number(((totalSent / totalMessages) * 100).toFixed(2)) : 0,
            deliveryRate: totalSent > 0 ? Number(((totalDelivered / totalSent) * 100).toFixed(2)) : 0,
            readRate: totalDelivered > 0 ? Number(((totalRead / totalDelivered) * 100).toFixed(2)) : 0,
            period: `${filters.startDate?.toISOString().split('T')[0] || 'início'} a ${filters.endDate?.toISOString().split('T')[0] || 'hoje'}`
        };
    }
    async executeCustomQuery(tenantId, config) {
        // Implementação simplificada - em produção seria mais complexa
        return await this.getCampaignMetrics(this.buildWhereClause(tenantId, config.filters));
    }
    convertToCSV(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }
        if (data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(','))
        ].join('\n');
        return csvContent;
    }
}
exports.ReportingService = ReportingService;
exports.reportingService = ReportingService.getInstance();
//# sourceMappingURL=reportingService.js.map