"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionApiService = exports.EvolutionApiService = void 0;
const settingsService_1 = require("./settingsService");
class EvolutionApiService {
    static instance;
    static getInstance() {
        if (!EvolutionApiService.instance) {
            EvolutionApiService.instance = new EvolutionApiService();
        }
        return EvolutionApiService.instance;
    }
    async getConfig() {
        return await settingsService_1.settingsService.getEvolutionConfig();
    }
    async makeRequest(endpoint, options = {}) {
        const config = await this.getConfig();
        if (!config.host || !config.apiKey) {
            throw new Error('Configurações Evolution API não encontradas. Configure nas configurações do sistema.');
        }
        const url = `${config.host}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'apikey': config.apiKey,
            ...options.headers,
        };
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Evolution API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response;
    }
    async createInstance(instanceName) {
        const requestData = {
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS'
        };
        const response = await this.makeRequest('/instance/create', {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
        return response.json();
    }
    async getInstanceInfo(instanceName) {
        const response = await this.makeRequest(`/instance/fetchInstances?instanceName=${instanceName}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        throw new Error(`Instância ${instanceName} não encontrada`);
    }
    async getQRCode(instanceName) {
        try {
            const response = await this.makeRequest(`/instance/connect/${instanceName}`);
            const data = await response.json();
            // Evolution API pode retornar base64, code ou pairingCode
            if (data.base64) {
                // Verificar se o base64 já tem o prefixo data:image
                if (data.base64.startsWith('data:image/')) {
                    return data.base64;
                }
                return `data:image/png;base64,${data.base64}`;
            }
            if (data.code) {
                // Se retornar apenas o código, converter para base64
                return data.code;
            }
            throw new Error('QR Code não disponível');
        }
        catch (error) {
            console.error(`❌ Erro ao obter QR Code da Evolution API para ${instanceName}:`, error.message);
            throw new Error(`QR Code não disponível: ${error.message}`);
        }
    }
    async deleteInstance(instanceName) {
        await this.makeRequest(`/instance/delete/${instanceName}`, {
            method: 'DELETE'
        });
    }
    async restartInstance(instanceName) {
        await this.makeRequest(`/instance/restart/${instanceName}`, {
            method: 'PUT'
        });
    }
    async getInstanceStatus(instanceName) {
        try {
            const info = await this.getInstanceInfo(instanceName);
            console.log(`🔍 Evolution getInstanceInfo para ${instanceName}:`, JSON.stringify(info, null, 2));
            // Mapear status Evolution para status do sistema
            const statusMap = {
                'open': 'WORKING',
                'connecting': 'SCAN_QR_CODE',
                'close': 'STOPPED',
                'closed': 'STOPPED',
                'qr': 'SCAN_QR_CODE',
                'qrReadSuccess': 'WORKING',
                'qrReadFail': 'FAILED'
            };
            // Evolution API pode usar connectionStatus, state ou status
            const rawData = info;
            const evolutionStatus = rawData.connectionStatus || rawData.state || rawData.status || 'close';
            console.log(`🔍 Status bruto Evolution para ${instanceName}: "${evolutionStatus}"`);
            const mappedStatus = statusMap[evolutionStatus.toLowerCase()] || 'STOPPED';
            console.log(`📊 Status mapeado para ${instanceName}: "${mappedStatus}"`);
            return mappedStatus;
        }
        catch (error) {
            console.warn(`⚠️ Erro ao obter status Evolution para ${instanceName}:`, error);
            return 'STOPPED';
        }
    }
    async listInstances() {
        const response = await this.makeRequest('/instance/fetchInstances');
        const data = await response.json();
        if (Array.isArray(data)) {
            return data;
        }
        return [];
    }
}
exports.EvolutionApiService = EvolutionApiService;
exports.evolutionApiService = EvolutionApiService.getInstance();
//# sourceMappingURL=evolutionApiService.js.map