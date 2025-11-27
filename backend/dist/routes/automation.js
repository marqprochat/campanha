"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const automationService_1 = require("../services/automationService");
const router = express_1.default.Router();
// Aplicar middleware de autenticação em todas as rotas
router.use(auth_1.authMiddleware);
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
// GET /api/automation/flows - Listar fluxos de automação
router.get('/flows', [
    (0, express_validator_1.query)('active').optional().isBoolean(),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const filters = {};
        if (req.query.active !== undefined)
            filters.active = req.query.active === 'true';
        if (req.query.search) {
            filters.OR = [
                { name: { contains: req.query.search, mode: 'insensitive' } },
                { description: { contains: req.query.search, mode: 'insensitive' } }
            ];
        }
        const flows = await automationService_1.automationService.getFlows(tenantId, filters);
        res.json({
            success: true,
            data: flows,
            count: flows.length
        });
    }
    catch (error) {
        console.error('Erro ao listar fluxos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/automation/flows/:id - Obter fluxo específico
router.get('/flows/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const flows = await automationService_1.automationService.getFlows(tenantId, { id });
        const flow = flows[0];
        if (!flow) {
            return res.status(404).json({ error: 'Fluxo não encontrado' });
        }
        res.json({
            success: true,
            data: flow
        });
    }
    catch (error) {
        console.error('Erro ao buscar fluxo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/automation/flows - Criar novo fluxo
router.post('/flows', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Nome é obrigatório').isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('active').isBoolean().withMessage('Campo ativo deve ser boolean'),
    (0, express_validator_1.body)('trigger').isObject().withMessage('Trigger é obrigatório'),
    (0, express_validator_1.body)('trigger.type').isIn(Object.values(automationService_1.TriggerType)).withMessage('Tipo de trigger inválido'),
    (0, express_validator_1.body)('conditions').optional().isArray(),
    (0, express_validator_1.body)('actions').isArray({ min: 1 }).withMessage('Pelo menos uma ação é obrigatória'),
    (0, express_validator_1.body)('actions.*.type').isIn(Object.values(automationService_1.ActionType)).withMessage('Tipo de ação inválido'),
    (0, express_validator_1.body)('actions.*.order').isInt({ min: 0 }).withMessage('Ordem da ação deve ser um número')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const flowData = {
            ...req.body,
            tenantId,
            createdBy: userId
        };
        const flow = await automationService_1.automationService.createFlow(flowData);
        res.status(201).json({
            success: true,
            message: 'Fluxo de automação criado com sucesso',
            data: flow
        });
    }
    catch (error) {
        console.error('Erro ao criar fluxo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// PUT /api/automation/flows/:id - Atualizar fluxo
router.put('/flows/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    (0, express_validator_1.body)('name').optional().isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('active').optional().isBoolean(),
    (0, express_validator_1.body)('trigger').optional().isObject(),
    (0, express_validator_1.body)('conditions').optional().isArray(),
    (0, express_validator_1.body)('actions').optional().isArray()
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const flow = await automationService_1.automationService.updateFlow(id, tenantId, req.body);
        res.json({
            success: true,
            message: 'Fluxo atualizado com sucesso',
            data: flow
        });
    }
    catch (error) {
        console.error('Erro ao atualizar fluxo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// DELETE /api/automation/flows/:id - Excluir fluxo
router.delete('/flows/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        await automationService_1.automationService.deleteFlow(id, tenantId);
        res.json({
            success: true,
            message: 'Fluxo excluído com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao excluir fluxo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// GET /api/automation/flows/:id/executions - Listar execuções de um fluxo
router.get('/flows/:id/executions', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('status').optional().isIn(['SUCCESS', 'FAILED', 'RUNNING'])
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const executions = await automationService_1.automationService.getFlowExecutions(id, tenantId);
        // Filtrar por status se fornecido
        let filteredExecutions = executions;
        if (req.query.status) {
            filteredExecutions = executions.filter((exec) => exec.status === req.query.status);
        }
        // Paginação
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const paginatedExecutions = filteredExecutions.slice(offset, offset + limit);
        res.json({
            success: true,
            data: paginatedExecutions,
            pagination: {
                page,
                limit,
                total: filteredExecutions.length,
                totalPages: Math.ceil(filteredExecutions.length / limit)
            }
        });
    }
    catch (error) {
        console.error('Erro ao listar execuções:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// POST /api/automation/flows/:id/test - Testar fluxo manualmente
router.post('/flows/:id/test', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID inválido'),
    (0, express_validator_1.body)('testData').optional().isObject()
], handleValidationErrors, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        if (!tenantId) {
            return res.status(403).json({ error: 'Acesso negado. Usuário deve estar associado a um tenant.' });
        }
        const testData = req.body.testData || {
            testMode: true,
            timestamp: new Date(),
            triggerBy: 'manual_test'
        };
        const result = await automationService_1.automationService.testFlow(id, tenantId, testData);
        res.json({
            success: true,
            message: 'Teste executado com sucesso',
            data: result
        });
    }
    catch (error) {
        console.error('Erro ao testar fluxo:', error);
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// GET /api/automation/triggers - Listar tipos de triggers disponíveis
router.get('/triggers', async (req, res) => {
    try {
        const triggers = Object.values(automationService_1.TriggerType).map(type => ({
            type,
            name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: getTriggerDescription(type)
        }));
        res.json({
            success: true,
            data: triggers
        });
    }
    catch (error) {
        console.error('Erro ao listar triggers:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/automation/actions - Listar tipos de ações disponíveis
router.get('/actions', async (req, res) => {
    try {
        const actions = Object.values(automationService_1.ActionType).map(type => ({
            type,
            name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: getActionDescription(type),
            configSchema: getActionConfigSchema(type)
        }));
        res.json({
            success: true,
            data: actions
        });
    }
    catch (error) {
        console.error('Erro ao listar ações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// GET /api/automation/conditions - Listar tipos de condições disponíveis
router.get('/conditions', async (req, res) => {
    try {
        const conditions = Object.values(automationService_1.ConditionType).map(type => ({
            type,
            name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
            description: getConditionDescription(type)
        }));
        res.json({
            success: true,
            data: conditions
        });
    }
    catch (error) {
        console.error('Erro ao listar condições:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// POST /api/automation/webhook/:flowId - Endpoint para receber webhooks
router.post('/webhook/:flowId', [
    (0, express_validator_1.param)('flowId').isUUID().withMessage('ID do fluxo inválido')
], async (req, res) => {
    try {
        const { flowId } = req.params;
        const webhookData = {
            ...req.body,
            headers: req.headers,
            timestamp: new Date(),
            ip: req.ip
        };
        // Executar trigger de webhook
        await automationService_1.automationService.executeTrigger(automationService_1.TriggerType.WEBHOOK_RECEIVED, {
            flowId,
            webhookData
        });
        res.json({
            success: true,
            message: 'Webhook processado com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({
            error: 'Erro ao processar webhook',
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});
// Funções auxiliares para documentação
function getTriggerDescription(type) {
    const descriptions = {
        [automationService_1.TriggerType.CONTACT_CREATED]: 'Disparado quando um novo contato é criado',
        [automationService_1.TriggerType.CONTACT_UPDATED]: 'Disparado quando um contato é atualizado',
        [automationService_1.TriggerType.CAMPAIGN_COMPLETED]: 'Disparado quando uma campanha é concluída',
        [automationService_1.TriggerType.MESSAGE_DELIVERED]: 'Disparado quando uma mensagem é entregue',
        [automationService_1.TriggerType.MESSAGE_READ]: 'Disparado quando uma mensagem é lida',
        [automationService_1.TriggerType.MESSAGE_FAILED]: 'Disparado quando uma mensagem falha',
        [automationService_1.TriggerType.TIME_BASED]: 'Disparado em horários específicos (cron)',
        [automationService_1.TriggerType.WEBHOOK_RECEIVED]: 'Disparado quando um webhook é recebido',
        [automationService_1.TriggerType.TAG_ADDED]: 'Disparado quando uma tag é adicionada a um contato',
        [automationService_1.TriggerType.TAG_REMOVED]: 'Disparado quando uma tag é removida de um contato'
    };
    return descriptions[type] || 'Descrição não disponível';
}
function getActionDescription(type) {
    const descriptions = {
        [automationService_1.ActionType.SEND_MESSAGE]: 'Enviar mensagem para um contato',
        [automationService_1.ActionType.ADD_TAG]: 'Adicionar tag a um contato',
        [automationService_1.ActionType.REMOVE_TAG]: 'Remover tag de um contato',
        [automationService_1.ActionType.CREATE_CAMPAIGN]: 'Criar nova campanha',
        [automationService_1.ActionType.SEND_EMAIL]: 'Enviar email de notificação',
        [automationService_1.ActionType.WEBHOOK_CALL]: 'Fazer chamada para webhook externo',
        [automationService_1.ActionType.UPDATE_CONTACT]: 'Atualizar dados do contato',
        [automationService_1.ActionType.CREATE_NOTIFICATION]: 'Criar notificação no sistema',
        [automationService_1.ActionType.DELAY]: 'Aguardar um período de tempo',
        [automationService_1.ActionType.CONDITIONAL_BRANCH]: 'Executar ação condicional'
    };
    return descriptions[type] || 'Descrição não disponível';
}
function getConditionDescription(type) {
    const descriptions = {
        [automationService_1.ConditionType.EQUALS]: 'Valor é igual a',
        [automationService_1.ConditionType.NOT_EQUALS]: 'Valor é diferente de',
        [automationService_1.ConditionType.CONTAINS]: 'Valor contém',
        [automationService_1.ConditionType.NOT_CONTAINS]: 'Valor não contém',
        [automationService_1.ConditionType.GREATER_THAN]: 'Valor é maior que',
        [automationService_1.ConditionType.LESS_THAN]: 'Valor é menor que',
        [automationService_1.ConditionType.IN_LIST]: 'Valor está na lista',
        [automationService_1.ConditionType.NOT_IN_LIST]: 'Valor não está na lista',
        [automationService_1.ConditionType.HAS_TAG]: 'Contato possui tag',
        [automationService_1.ConditionType.NOT_HAS_TAG]: 'Contato não possui tag',
        [automationService_1.ConditionType.DATE_RANGE]: 'Data está no intervalo'
    };
    return descriptions[type] || 'Descrição não disponível';
}
function getActionConfigSchema(type) {
    const schemas = {
        [automationService_1.ActionType.SEND_MESSAGE]: {
            message: { type: 'string', required: true },
            template: { type: 'string', required: false }
        },
        [automationService_1.ActionType.ADD_TAG]: {
            tag: { type: 'string', required: true }
        },
        [automationService_1.ActionType.REMOVE_TAG]: {
            tag: { type: 'string', required: true }
        },
        [automationService_1.ActionType.CREATE_CAMPAIGN]: {
            name: { type: 'string', required: true },
            message: { type: 'string', required: true },
            targets: { type: 'array', required: true }
        },
        [automationService_1.ActionType.SEND_EMAIL]: {
            to: { type: 'string', required: true },
            subject: { type: 'string', required: true },
            body: { type: 'string', required: true }
        },
        [automationService_1.ActionType.WEBHOOK_CALL]: {
            url: { type: 'string', required: true },
            method: { type: 'string', required: false, default: 'POST' },
            headers: { type: 'object', required: false }
        },
        [automationService_1.ActionType.UPDATE_CONTACT]: {
            fields: { type: 'object', required: true }
        },
        [automationService_1.ActionType.CREATE_NOTIFICATION]: {
            title: { type: 'string', required: true },
            message: { type: 'string', required: true },
            type: { type: 'string', required: false, default: 'INFO' }
        },
        [automationService_1.ActionType.DELAY]: {
            minutes: { type: 'number', required: true }
        },
        [automationService_1.ActionType.CONDITIONAL_BRANCH]: {
            conditions: { type: 'array', required: true },
            trueActions: { type: 'array', required: true },
            falseActions: { type: 'array', required: false }
        }
    };
    return schemas[type] || {};
}
exports.default = router;
//# sourceMappingURL=automation.js.map