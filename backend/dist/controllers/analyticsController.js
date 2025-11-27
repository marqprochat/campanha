"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
class AnalyticsController {
    // GET /api/analytics/tenant - Relatório completo do tenant do usuário
    static async getTenantAnalytics(req, res) {
        try {
            const tenantId = req.user?.tenantId;
            if (!tenantId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tenant ID é obrigatório'
                });
            }
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const analytics = await analyticsService_1.analyticsService.generateTenantAnalytics(tenantId, start, end);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar analytics do tenant:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // GET /api/analytics/system - Relatório consolidado do sistema (SuperAdmin only)
    static async getSystemAnalytics(req, res) {
        try {
            if (req.user?.role !== 'SUPERADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Apenas SuperAdmin pode acessar analytics do sistema'
                });
            }
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const analytics = await analyticsService_1.analyticsService.generateSystemAnalytics(start, end);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar analytics do sistema:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // GET /api/analytics/campaigns - Relatório de performance de campanhas
    static async getCampaignAnalytics(req, res) {
        try {
            const tenantId = req.user?.role === 'SUPERADMIN' && req.query.tenantId
                ? req.query.tenantId
                : req.user?.tenantId;
            if (!tenantId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tenant ID é obrigatório'
                });
            }
            const campaignId = req.query.campaignId;
            const report = await analyticsService_1.analyticsService.getCampaignPerformanceReport(tenantId, campaignId);
            res.json({
                success: true,
                data: report
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar analytics de campanhas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // GET /api/analytics/export/:type - Exporta dados em CSV
    static async exportData(req, res) {
        try {
            const { type } = req.params;
            const tenantId = req.user?.role === 'SUPERADMIN' && req.query.tenantId
                ? req.query.tenantId
                : req.user?.tenantId;
            if (!tenantId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tenant ID é obrigatório'
                });
            }
            if (!['contacts', 'campaigns', 'analytics'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de exportação inválido. Use: contacts, campaigns ou analytics'
                });
            }
            const csv = await analyticsService_1.analyticsService.exportTenantDataToCSV(tenantId, type);
            const filename = `${type}_${tenantId}_${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'));
            res.send(csv);
        }
        catch (error) {
            console.error('❌ Erro ao exportar dados:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    // GET /api/analytics/tenant/:tenantId - Analytics de tenant específico (SuperAdmin only)
    static async getSpecificTenantAnalytics(req, res) {
        try {
            if (req.user?.role !== 'SUPERADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Apenas SuperAdmin pode acessar analytics de outros tenants'
                });
            }
            const { tenantId } = req.params;
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const analytics = await analyticsService_1.analyticsService.generateTenantAnalytics(tenantId, start, end);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            console.error(`❌ Erro ao buscar analytics do tenant ${req.params.tenantId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analyticsController.js.map