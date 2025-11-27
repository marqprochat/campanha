"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationService = exports.AutomationService = exports.ActionType = exports.ConditionType = exports.TriggerType = void 0;
const client_1 = require("@prisma/client");
const websocketService_1 = require("./websocketService");
const cron = __importStar(require("node-cron"));
const prisma = new client_1.PrismaClient();
// Tipos de triggers disponíveis
var TriggerType;
(function (TriggerType) {
    TriggerType["CONTACT_CREATED"] = "CONTACT_CREATED";
    TriggerType["CONTACT_UPDATED"] = "CONTACT_UPDATED";
    TriggerType["CAMPAIGN_COMPLETED"] = "CAMPAIGN_COMPLETED";
    TriggerType["MESSAGE_DELIVERED"] = "MESSAGE_DELIVERED";
    TriggerType["MESSAGE_READ"] = "MESSAGE_READ";
    TriggerType["MESSAGE_FAILED"] = "MESSAGE_FAILED";
    TriggerType["TIME_BASED"] = "TIME_BASED";
    TriggerType["WEBHOOK_RECEIVED"] = "WEBHOOK_RECEIVED";
    TriggerType["TAG_ADDED"] = "TAG_ADDED";
    TriggerType["TAG_REMOVED"] = "TAG_REMOVED";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
// Tipos de condições
var ConditionType;
(function (ConditionType) {
    ConditionType["EQUALS"] = "EQUALS";
    ConditionType["NOT_EQUALS"] = "NOT_EQUALS";
    ConditionType["CONTAINS"] = "CONTAINS";
    ConditionType["NOT_CONTAINS"] = "NOT_CONTAINS";
    ConditionType["GREATER_THAN"] = "GREATER_THAN";
    ConditionType["LESS_THAN"] = "LESS_THAN";
    ConditionType["IN_LIST"] = "IN_LIST";
    ConditionType["NOT_IN_LIST"] = "NOT_IN_LIST";
    ConditionType["HAS_TAG"] = "HAS_TAG";
    ConditionType["NOT_HAS_TAG"] = "NOT_HAS_TAG";
    ConditionType["DATE_RANGE"] = "DATE_RANGE";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
// Tipos de ações
var ActionType;
(function (ActionType) {
    ActionType["SEND_MESSAGE"] = "SEND_MESSAGE";
    ActionType["ADD_TAG"] = "ADD_TAG";
    ActionType["REMOVE_TAG"] = "REMOVE_TAG";
    ActionType["CREATE_CAMPAIGN"] = "CREATE_CAMPAIGN";
    ActionType["SEND_EMAIL"] = "SEND_EMAIL";
    ActionType["WEBHOOK_CALL"] = "WEBHOOK_CALL";
    ActionType["UPDATE_CONTACT"] = "UPDATE_CONTACT";
    ActionType["CREATE_NOTIFICATION"] = "CREATE_NOTIFICATION";
    ActionType["DELAY"] = "DELAY";
    ActionType["CONDITIONAL_BRANCH"] = "CONDITIONAL_BRANCH";
})(ActionType || (exports.ActionType = ActionType = {}));
class AutomationService {
    static instance;
    flowExecutions = new Map();
    scheduledJobs = new Map();
    constructor() {
        this.initializeActiveFlows();
    }
    static getInstance() {
        if (!AutomationService.instance) {
            AutomationService.instance = new AutomationService();
        }
        return AutomationService.instance;
    }
    // Inicializar fluxos ativos
    async initializeActiveFlows() {
        try {
            console.log('🤖 Inicializando fluxos de automação...');
            const activeFlows = await prisma.automationFlow.findMany({
                where: { active: true },
                include: {
                    tenant: { select: { name: true, slug: true } },
                    creator: { select: { nome: true } }
                }
            });
            for (const flow of activeFlows) {
                await this.registerFlow(flow);
            }
            console.log(`✅ ${activeFlows.length} fluxos de automação inicializados`);
        }
        catch (error) {
            console.error('❌ Erro ao inicializar fluxos:', error);
        }
    }
    // Criar novo fluxo de automação
    async createFlow(flowData) {
        try {
            console.log(`🔧 Criando fluxo de automação: ${flowData.name}`);
            // Validar fluxo
            const validation = await this.validateFlow(flowData);
            if (!validation.valid) {
                throw new Error(`Fluxo inválido: ${validation.errors.join(', ')}`);
            }
            const flow = await prisma.automationFlow.create({
                data: {
                    name: flowData.name,
                    description: flowData.description,
                    tenantId: flowData.tenantId,
                    active: flowData.active,
                    trigger: flowData.trigger,
                    conditions: flowData.conditions,
                    actions: flowData.actions,
                    createdBy: flowData.createdBy
                }
            });
            // Registrar fluxo se estiver ativo
            if (flow.active) {
                await this.registerFlow(flow);
            }
            // Notificar criação
            await websocketService_1.websocketService.notifyTenant(flowData.tenantId, {
                title: 'Fluxo de Automação Criado',
                message: `O fluxo "${flowData.name}" foi criado com sucesso.`,
                type: 'SUCCESS',
                data: { flowId: flow.id, flowName: flow.name }
            });
            console.log(`✅ Fluxo criado: ${flow.name} (${flow.id})`);
            return flow;
        }
        catch (error) {
            console.error('❌ Erro ao criar fluxo:', error);
            throw error;
        }
    }
    // Atualizar fluxo existente
    async updateFlow(flowId, tenantId, updateData) {
        try {
            const flow = await prisma.automationFlow.update({
                where: { id: flowId, tenantId },
                data: updateData
            });
            // Re-registrar fluxo
            await this.unregisterFlow(flowId);
            if (flow.active) {
                await this.registerFlow(flow);
            }
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Fluxo Atualizado',
                message: `O fluxo "${flow.name}" foi atualizado.`,
                type: 'INFO',
                data: { flowId: flow.id, flowName: flow.name }
            });
            return flow;
        }
        catch (error) {
            console.error('❌ Erro ao atualizar fluxo:', error);
            throw error;
        }
    }
    // Executar trigger do fluxo
    async executeTrigger(triggerType, data) {
        try {
            // Buscar fluxos que respondem a este trigger
            const matchingFlows = await prisma.automationFlow.findMany({
                where: {
                    active: true,
                    trigger: {
                        path: ['type'],
                        equals: triggerType
                    }
                }
            });
            console.log(`🔥 Trigger ${triggerType} executado - ${matchingFlows.length} fluxos encontrados`);
            // Executar cada fluxo em paralelo
            const executions = matchingFlows.map(flow => this.executeFlow(flow, data));
            await Promise.allSettled(executions);
        }
        catch (error) {
            console.error('❌ Erro ao executar trigger:', error);
        }
    }
    // Executar fluxo específico
    async executeFlow(flow, triggerData) {
        try {
            const executionId = `${flow.id}_${Date.now()}`;
            console.log(`⚙️ Executando fluxo: ${flow.name} (${executionId})`);
            const context = {
                flowId: flow.id,
                tenantId: flow.tenantId,
                triggerData,
                variables: { ...triggerData }
            };
            // Verificar condições se existirem
            if (flow.conditions && flow.conditions.length > 0) {
                const conditionsMet = await this.evaluateConditions(flow.conditions, context);
                if (!conditionsMet) {
                    console.log(`❌ Condições não atendidas para fluxo ${flow.name}`);
                    return;
                }
            }
            // Executar ações sequencialmente
            await this.executeActions(flow.actions, context);
            // Registrar execução bem-sucedida
            await this.logExecution(executionId, flow.id, 'SUCCESS', context);
            console.log(`✅ Fluxo executado com sucesso: ${flow.name}`);
        }
        catch (error) {
            console.error(`❌ Erro ao executar fluxo ${flow.name}:`, error);
            await this.logExecution(`${flow.id}_${Date.now()}`, flow.id, 'FAILED', null, error);
        }
    }
    // Avaliar condições do fluxo
    async evaluateConditions(conditions, context) {
        let result = true;
        let currentOperator = 'AND';
        for (const condition of conditions) {
            const conditionResult = await this.evaluateCondition(condition, context);
            if (currentOperator === 'AND') {
                result = result && conditionResult;
            }
            else {
                result = result || conditionResult;
            }
            currentOperator = condition.operator || 'AND';
        }
        return result;
    }
    // Avaliar condição individual
    async evaluateCondition(condition, context) {
        const fieldValue = this.getFieldValue(condition.field, context);
        const conditionValue = condition.value;
        switch (condition.type) {
            case ConditionType.EQUALS:
                return fieldValue === conditionValue;
            case ConditionType.NOT_EQUALS:
                return fieldValue !== conditionValue;
            case ConditionType.CONTAINS:
                return String(fieldValue).includes(String(conditionValue));
            case ConditionType.NOT_CONTAINS:
                return !String(fieldValue).includes(String(conditionValue));
            case ConditionType.GREATER_THAN:
                return Number(fieldValue) > Number(conditionValue);
            case ConditionType.LESS_THAN:
                return Number(fieldValue) < Number(conditionValue);
            case ConditionType.IN_LIST:
                return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
            case ConditionType.NOT_IN_LIST:
                return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
            case ConditionType.HAS_TAG:
                return await this.checkContactHasTag(context.contactId, conditionValue);
            case ConditionType.NOT_HAS_TAG:
                return !(await this.checkContactHasTag(context.contactId, conditionValue));
            default:
                return false;
        }
    }
    // Executar ações do fluxo
    async executeActions(actions, context) {
        // Ordenar ações por ordem
        const sortedActions = actions.sort((a, b) => a.order - b.order);
        for (const action of sortedActions) {
            // Aplicar delay se configurado
            if (action.delay && action.delay > 0) {
                console.log(`⏳ Aguardando ${action.delay} minutos antes da próxima ação...`);
                await new Promise(resolve => setTimeout(resolve, (action.delay || 0) * 60 * 1000));
            }
            await this.executeAction(action, context);
        }
    }
    // Executar ação específica
    async executeAction(action, context) {
        try {
            console.log(`🎯 Executando ação: ${action.type}`);
            switch (action.type) {
                case ActionType.SEND_MESSAGE:
                    await this.executeSendMessageAction(action.config, context);
                    break;
                case ActionType.ADD_TAG:
                    await this.executeAddTagAction(action.config, context);
                    break;
                case ActionType.REMOVE_TAG:
                    await this.executeRemoveTagAction(action.config, context);
                    break;
                case ActionType.CREATE_CAMPAIGN:
                    await this.executeCreateCampaignAction(action.config, context);
                    break;
                case ActionType.UPDATE_CONTACT:
                    await this.executeUpdateContactAction(action.config, context);
                    break;
                case ActionType.CREATE_NOTIFICATION:
                    await this.executeCreateNotificationAction(action.config, context);
                    break;
                case ActionType.WEBHOOK_CALL:
                    await this.executeWebhookCallAction(action.config, context);
                    break;
                default:
                    console.log(`⚠️ Tipo de ação não implementado: ${action.type}`);
            }
        }
        catch (error) {
            console.error(`❌ Erro ao executar ação ${action.type}:`, error);
            throw error;
        }
    }
    // Implementações específicas das ações
    async executeSendMessageAction(config, context) {
        // Implementar envio de mensagem individual
        console.log('📤 Enviando mensagem automática:', config);
    }
    async executeAddTagAction(config, context) {
        if (context.contactId) {
            await prisma.contact.update({
                where: { id: context.contactId },
                data: {
                    tags: {
                        push: config.tag
                    }
                }
            });
            console.log(`🏷️ Tag adicionada: ${config.tag}`);
        }
    }
    async executeRemoveTagAction(config, context) {
        if (context.contactId) {
            const contact = await prisma.contact.findUnique({
                where: { id: context.contactId }
            });
            if (contact) {
                const newTags = contact.tags.filter(tag => tag !== config.tag);
                await prisma.contact.update({
                    where: { id: context.contactId },
                    data: { tags: newTags }
                });
                console.log(`🏷️ Tag removida: ${config.tag}`);
            }
        }
    }
    async executeCreateNotificationAction(config, context) {
        await websocketService_1.websocketService.notifyTenant(context.tenantId, {
            title: config.title || 'Automação Executada',
            message: config.message || 'Uma automação foi executada com sucesso.',
            type: config.type || 'INFO',
            data: { flowId: context.flowId, ...config.data }
        });
    }
    async executeCreateCampaignAction(config, context) {
        try {
            // Criar nova campanha baseada na configuração
            await prisma.campaign.create({
                data: {
                    nome: config.name,
                    targetTags: config.targets?.join(',') || '',
                    messageContent: config.message,
                    messageType: 'text',
                    randomDelay: 30,
                    startImmediately: config.startImmediately || false,
                    scheduledFor: config.scheduledFor ? new Date(config.scheduledFor) : null,
                    tenantId: context.tenantId,
                    createdBy: 'automation',
                    createdByName: 'Sistema de Automação'
                }
            });
            console.log('🎯 Campanha criada automaticamente:', config.name);
        }
        catch (error) {
            console.error('❌ Erro ao criar campanha:', error);
            throw error;
        }
    }
    async executeUpdateContactAction(config, context) {
        if (context.contactId && config.fields) {
            try {
                await prisma.contact.update({
                    where: { id: context.contactId },
                    data: config.fields
                });
                console.log('📝 Contato atualizado:', context.contactId);
            }
            catch (error) {
                console.error('❌ Erro ao atualizar contato:', error);
                throw error;
            }
        }
    }
    async executeWebhookCallAction(config, context) {
        const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
        try {
            const response = await fetch(config.url, {
                method: config.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                body: JSON.stringify({
                    ...context.triggerData,
                    flowId: context.flowId,
                    tenantId: context.tenantId
                })
            });
            if (!response.ok) {
                throw new Error(`Webhook call failed: ${response.statusText}`);
            }
            console.log('🔗 Webhook executado com sucesso');
        }
        catch (error) {
            console.error('❌ Erro ao executar webhook:', error);
            throw error;
        }
    }
    // Métodos auxiliares
    async registerFlow(flow) {
        console.log(`📝 Registrando fluxo: ${flow.name}`);
        // Para triggers baseados em tempo, configurar cron job
        if (flow.trigger.type === TriggerType.TIME_BASED) {
            const cronExpression = flow.trigger.config.cronExpression;
            if (cronExpression) {
                const job = cron.schedule(cronExpression, async () => {
                    await this.executeFlow(flow, { timestamp: new Date() });
                });
                this.scheduledJobs.set(flow.id, job);
                console.log(`⏰ Job agendado para fluxo ${flow.name}: ${cronExpression}`);
            }
        }
    }
    async unregisterFlow(flowId) {
        const job = this.scheduledJobs.get(flowId);
        if (job) {
            job.destroy();
            this.scheduledJobs.delete(flowId);
            console.log(`⏰ Job removido para fluxo: ${flowId}`);
        }
    }
    getFieldValue(field, context) {
        const parts = field.split('.');
        let value = context.variables;
        for (const part of parts) {
            value = value?.[part];
        }
        return value;
    }
    async checkContactHasTag(contactId, tag) {
        if (!contactId)
            return false;
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            select: { tags: true }
        });
        return contact?.tags.includes(tag) || false;
    }
    async validateFlow(flow) {
        const errors = [];
        if (!flow.name || flow.name.trim().length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
        }
        if (!flow.trigger || !flow.trigger.type) {
            errors.push('Trigger é obrigatório');
        }
        if (!flow.actions || flow.actions.length === 0) {
            errors.push('Pelo menos uma ação é obrigatória');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async logExecution(executionId, flowId, status, context, error) {
        try {
            await prisma.automationExecution.create({
                data: {
                    id: executionId,
                    flowId,
                    status,
                    executedAt: new Date(),
                    context: context,
                    error: error ? String(error) : null
                }
            });
        }
        catch (logError) {
            console.error('❌ Erro ao registrar execução:', logError);
        }
    }
    // Métodos públicos para gerenciamento
    async getFlows(tenantId, filters) {
        return await prisma.automationFlow.findMany({
            where: { tenantId, ...filters },
            include: {
                creator: { select: { nome: true } },
                executions: {
                    take: 5,
                    orderBy: { executedAt: 'desc' }
                }
            }
        });
    }
    async getFlowExecutions(flowId, tenantId) {
        const flow = await prisma.automationFlow.findFirst({
            where: { id: flowId, tenantId }
        });
        if (!flow) {
            throw new Error('Fluxo não encontrado');
        }
        return await prisma.automationExecution.findMany({
            where: { flowId },
            orderBy: { executedAt: 'desc' },
            take: 50
        });
    }
    async deleteFlow(flowId, tenantId) {
        await this.unregisterFlow(flowId);
        await prisma.automationFlow.delete({
            where: { id: flowId, tenantId }
        });
        return true;
    }
    // Método para executar fluxo manualmente (teste)
    async testFlow(flowId, tenantId, testData) {
        const flow = await prisma.automationFlow.findFirst({
            where: { id: flowId, tenantId }
        });
        if (!flow) {
            throw new Error('Fluxo não encontrado');
        }
        await this.executeFlow(flow, testData);
        return { success: true, message: 'Fluxo executado em modo de teste' };
    }
}
exports.AutomationService = AutomationService;
exports.automationService = AutomationService.getInstance();
//# sourceMappingURL=automationService.js.map