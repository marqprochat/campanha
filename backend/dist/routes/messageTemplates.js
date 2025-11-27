"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const messageTemplateService_1 = require("../services/messageTemplateService");
const router = express_1.default.Router();
// Aplicar middleware de autenticação em todas as rotas
router.use(auth_1.authMiddleware);
// Validações comuns
const templateValidation = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome é obrigatório').isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Categoria é obrigatória'),
    (0, express_validator_1.body)('messageType').isIn(['TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO']).withMessage('Tipo de mensagem inválido'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Conteúdo é obrigatório'),
    (0, express_validator_1.body)('active').isBoolean().withMessage('Campo ativo deve ser boolean'),
    (0, express_validator_1.body)('tags').isArray().withMessage('Tags deve ser um array'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('mediaUrl').optional().isString()
];
// Middleware para validar erros
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors.array()
        });
    }
    next();
};
// GET /api/templates - Listar templates do tenant
router.get('/', [
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('messageType').optional().isIn(['TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO']),
    (0, express_validator_1.query)('active').optional().isBoolean(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('tags').optional().isString()
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const filters = {};
        if (req.query.category)
            filters.category = req.query.category;
        if (req.query.messageType)
            filters.messageType = req.query.messageType;
        if (req.query.active !== undefined)
            filters.active = req.query.active === 'true';
        if (req.query.search)
            filters.search = req.query.search;
        if (req.query.tags)
            filters.tags = req.query.tags.split(',');
        const templates = await messageTemplateService_1.messageTemplateService.getTemplates(tenantId, filters);
        res.json({
            success: true,
            data: templates,
            count: templates.length
        });
    }
    catch (error) {
        console.error('Erro ao listar templates:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/templates/stats - Estatísticas dos templates
router.get('/stats', async (req, res) => {
    try {
        const { tenantId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const stats = await messageTemplateService_1.messageTemplateService.getTemplateStats(tenantId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/templates/categories - Listar categorias
router.get('/categories', async (req, res) => {
    try {
        const { tenantId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const categories = await messageTemplateService_1.messageTemplateService.getCategories(tenantId);
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/templates/:id - Obter template específico
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const template = await messageTemplateService_1.messageTemplateService.getTemplate(id, tenantId);
        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }
        res.json({
            success: true,
            data: template
        });
    }
    catch (error) {
        console.error('Erro ao buscar template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/templates - Criar novo template
router.post('/', templateValidation, handleValidationErrors, async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        // Validar dados
        const validation = messageTemplateService_1.messageTemplateService.validateTemplate(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Dados do template inválidos',
                details: validation.errors
            });
        }
        const templateData = {
            ...req.body,
            tenantId,
            createdBy: userId
        };
        const template = await messageTemplateService_1.messageTemplateService.createTemplate(templateData);
        res.status(201).json({
            success: true,
            message: 'Template criado com sucesso',
            data: template
        });
    }
    catch (error) {
        console.error('Erro ao criar template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// PUT /api/templates/:id - Atualizar template
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    ...templateValidation
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        // Validar dados
        const validation = messageTemplateService_1.messageTemplateService.validateTemplate(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Dados do template inválidos',
                details: validation.errors
            });
        }
        const template = await messageTemplateService_1.messageTemplateService.updateTemplate(id, tenantId, req.body);
        res.json({
            success: true,
            message: 'Template atualizado com sucesso',
            data: template
        });
    }
    catch (error) {
        console.error('Erro ao atualizar template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// DELETE /api/templates/:id - Excluir template
router.delete('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        await messageTemplateService_1.messageTemplateService.deleteTemplate(id, tenantId);
        res.json({
            success: true,
            message: 'Template excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao excluir template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/templates/:id/duplicate - Duplicar template
router.post('/:id/duplicate', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome para a cópia é obrigatório')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { name } = req.body;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const duplicate = await messageTemplateService_1.messageTemplateService.duplicateTemplate(id, tenantId, name);
        res.status(201).json({
            success: true,
            message: 'Template duplicado com sucesso',
            data: duplicate
        });
    }
    catch (error) {
        console.error('Erro ao duplicar template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/templates/:id/preview - Preview template com dados
router.post('/:id/preview', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    (0, express_validator_1.body)('contactData').optional().isObject(),
    (0, express_validator_1.body)('customVariables').optional().isObject()
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { contactData, customVariables } = req.body;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const processedTemplate = await messageTemplateService_1.messageTemplateService.processTemplate(id, tenantId, contactData, customVariables);
        res.json({
            success: true,
            data: processedTemplate
        });
    }
    catch (error) {
        console.error('Erro ao processar template:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=messageTemplates.js.map