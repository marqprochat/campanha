"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WahaSyncService = void 0;
const whatsappSessionService_1 = require("./whatsappSessionService");
const settingsService_1 = require("./settingsService");
const fetch = require('node-fetch');
const wahaRequest = async (endpoint, options = {}) => {
    // Buscar configurações dinâmicas do banco usando o método específico
    const config = await settingsService_1.settingsService.getWahaConfig();
    const WAHA_BASE_URL = config.host || process.env.WAHA_BASE_URL || process.env.DEFAULT_WAHA_HOST || '';
    const WAHA_API_KEY = config.apiKey || process.env.WAHA_API_KEY || process.env.DEFAULT_WAHA_API_KEY || '';
    console.log('🔍 WAHA Config Debug:', {
        host: config.host,
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'undefined',
        finalUrl: WAHA_BASE_URL,
        finalKey: WAHA_API_KEY ? `${WAHA_API_KEY.substring(0, 8)}...` : 'undefined'
    });
    if (!WAHA_BASE_URL || !WAHA_API_KEY) {
        throw new Error('Configurações WAHA não encontradas. Configure o Host e API Key nas configurações do sistema.');
    }
    const url = `${WAHA_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': WAHA_API_KEY,
            ...options.headers,
        },
    });
    if (!response.ok) {
        throw new Error(`WAHA API Error: ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
};
class WahaSyncService {
    /**
     * Sincroniza todas as sessões da WAHA API com o banco de dados
     */
    static async syncAllSessions() {
        try {
            console.log('🔄 Iniciando sincronização com WAHA API...');
            // Buscar sessões da WAHA API
            const wahaSessions = await wahaRequest('/api/sessions');
            console.log(`📡 WAHA API retornou ${wahaSessions.length} sessões`);
            // Atualizar cada sessão no banco preservando QR codes existentes
            for (const wahaSession of wahaSessions) {
                // Buscar dados existentes no banco para preservar QR code
                let existingSession = null;
                try {
                    existingSession = await whatsappSessionService_1.WhatsAppSessionService.getSession(wahaSession.name);
                }
                catch (error) {
                    // Sessão não existe no banco, criar nova
                }
                await whatsappSessionService_1.WhatsAppSessionService.createOrUpdateSession({
                    name: wahaSession.name,
                    displayName: existingSession?.displayName || wahaSession.name, // Preservar displayName
                    status: wahaSession.status || 'STOPPED',
                    provider: 'WAHA',
                    config: wahaSession.config,
                    me: wahaSession.me,
                    assignedWorker: wahaSession.assignedWorker,
                    // Preservar QR code existente se não expirou
                    qr: existingSession?.qr || undefined,
                    qrExpiresAt: existingSession?.qrExpiresAt || undefined,
                    // Preservar tenantId existente
                    tenantId: existingSession?.tenantId || undefined
                });
                console.log(`✅ Sessão "${wahaSession.name}" sincronizada`);
            }
            // Buscar sessões atualizadas do banco
            const dbSessions = await whatsappSessionService_1.WhatsAppSessionService.getAllSessions();
            console.log(`💾 Banco de dados possui ${dbSessions.length} sessões`);
            return dbSessions;
        }
        catch (error) {
            console.warn('⚠️ Erro na sincronização com WAHA API:', error);
            // Em caso de erro, retornar apenas dados do banco
            const dbSessions = await whatsappSessionService_1.WhatsAppSessionService.getAllSessions();
            console.log(`💾 Retornando ${dbSessions.length} sessões do banco (fallback)`);
            return dbSessions;
        }
    }
    /**
     * Sincroniza uma sessão específica
     */
    static async syncSession(sessionName) {
        try {
            const wahaSession = await wahaRequest(`/api/sessions/${sessionName}`);
            // Buscar dados existentes no banco para preservar QR code
            let existingSession = null;
            try {
                existingSession = await whatsappSessionService_1.WhatsAppSessionService.getSession(sessionName);
            }
            catch (error) {
                // Sessão não existe no banco, criar nova
            }
            await whatsappSessionService_1.WhatsAppSessionService.createOrUpdateSession({
                name: wahaSession.name,
                displayName: existingSession?.displayName || wahaSession.name, // Preservar displayName
                status: wahaSession.status || 'STOPPED',
                provider: 'WAHA',
                config: wahaSession.config,
                me: wahaSession.me,
                assignedWorker: wahaSession.assignedWorker,
                // Preservar QR code existente se não expirou
                qr: existingSession?.qr || undefined,
                qrExpiresAt: existingSession?.qrExpiresAt || undefined,
                // Preservar tenantId existente
                tenantId: existingSession?.tenantId || undefined
            });
            return whatsappSessionService_1.WhatsAppSessionService.getSession(sessionName);
        }
        catch (error) {
            console.warn(`⚠️ Erro ao sincronizar sessão ${sessionName}:`, error);
            // Tentar retornar do banco
            try {
                return await whatsappSessionService_1.WhatsAppSessionService.getSession(sessionName);
            }
            catch (dbError) {
                throw new Error(`Sessão ${sessionName} não encontrada`);
            }
        }
    }
    /**
     * Cria uma nova sessão na WAHA API e salva no banco
     */
    static async createSession(name) {
        const sessionData = {
            name,
            config: {
                proxy: null,
                webhooks: []
            }
        };
        try {
            // Criar na WAHA API
            const result = await wahaRequest('/api/sessions', {
                method: 'POST',
                body: JSON.stringify(sessionData),
            });
            // Salvar no banco
            await whatsappSessionService_1.WhatsAppSessionService.createOrUpdateSession({
                name,
                status: 'STOPPED',
                provider: 'WAHA',
                config: sessionData.config
            });
            console.log(`🆕 Sessão "${name}" criada e sincronizada`);
            return result;
        }
        catch (error) {
            // Se a sessão já existe (422), retornar a sessão existente
            if (error.message && error.message.includes('422')) {
                console.log(`📋 Sessão "${name}" já existe, retornando dados existentes`);
                try {
                    // Buscar a sessão existente da WAHA API
                    const existingSession = await wahaRequest(`/api/sessions/${name}`);
                    // Salvar/atualizar no banco
                    await whatsappSessionService_1.WhatsAppSessionService.createOrUpdateSession({
                        name,
                        status: existingSession.status || 'STOPPED',
                        provider: 'WAHA',
                        config: existingSession.config || sessionData.config
                    });
                    return existingSession;
                }
                catch (fetchError) {
                    console.error(`❌ Erro ao buscar sessão existente "${name}":`, fetchError);
                    throw new Error(`Sessão "${name}" já existe mas não foi possível obter detalhes`);
                }
            }
            // Re-throw outros erros
            throw error;
        }
    }
    /**
     * Deleta uma sessão da WAHA API e do banco
     */
    static async deleteSession(sessionName) {
        let wahaDeleted = false;
        let dbDeleted = false;
        try {
            // Tentar deletar da WAHA API primeiro
            console.log(`🗑️ Removendo sessão "${sessionName}" da WAHA API...`);
            await wahaRequest(`/api/sessions/${sessionName}`, {
                method: 'DELETE',
            });
            wahaDeleted = true;
            console.log(`✅ Sessão "${sessionName}" removida da WAHA API`);
        }
        catch (wahaError) {
            console.warn(`⚠️ Erro ao remover da WAHA API: ${wahaError}`);
            // Continua mesmo se falhar na WAHA (pode já ter sido removida)
        }
        try {
            // Deletar do banco de dados
            console.log(`🗑️ Removendo sessão "${sessionName}" do banco de dados...`);
            await whatsappSessionService_1.WhatsAppSessionService.deleteSession(sessionName);
            dbDeleted = true;
            console.log(`✅ Sessão "${sessionName}" removida do banco de dados`);
        }
        catch (dbError) {
            console.error(`❌ Erro ao remover do banco: ${dbError}`);
            throw dbError; // Falha no banco é mais crítica
        }
        if (wahaDeleted && dbDeleted) {
            console.log(`🎉 Sessão "${sessionName}" removida completamente`);
        }
        else if (dbDeleted) {
            console.log(`⚠️ Sessão "${sessionName}" removida do banco, mas falhou na WAHA API`);
        }
    }
    /**
     * Inicia uma sessão e atualiza status no banco
     */
    static async startSession(sessionName) {
        const result = await wahaRequest(`/api/sessions/${sessionName}/start`, {
            method: 'POST',
        });
        // Atualizar status no banco
        await whatsappSessionService_1.WhatsAppSessionService.updateSessionStatus(sessionName, 'SCAN_QR_CODE');
        console.log(`▶️ Sessão "${sessionName}" iniciada`);
        return result;
    }
    /**
     * Para uma sessão e atualiza status no banco
     */
    static async stopSession(sessionName) {
        const result = await wahaRequest(`/api/sessions/${sessionName}/stop`, {
            method: 'POST',
        });
        // Atualizar status no banco
        await whatsappSessionService_1.WhatsAppSessionService.updateSessionStatus(sessionName, 'STOPPED');
        console.log(`⏹️ Sessão "${sessionName}" parada`);
        return result;
    }
    /**
     * Reinicia uma sessão
     */
    static async restartSession(sessionName) {
        const result = await wahaRequest(`/api/sessions/${sessionName}/restart`, {
            method: 'POST',
        });
        // Sincronizar depois de um tempo para pegar o novo status
        setTimeout(async () => {
            try {
                await this.syncSession(sessionName);
            }
            catch (error) {
                console.warn(`Erro ao sincronizar após restart: ${error}`);
            }
        }, 2000);
        console.log(`🔄 Sessão "${sessionName}" reiniciada`);
        return result;
    }
}
exports.WahaSyncService = WahaSyncService;
//# sourceMappingURL=wahaSyncService.js.map