import { settingsService } from './settingsService';

interface EvolutionCreateInstanceRequest {
  instanceName: string;
  qrcode: boolean;
  integration: string;
}

interface EvolutionCreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    pairingCode?: string;
    code?: string;
    base64?: string;
  };
}

interface EvolutionInstanceInfo {
  instanceName: string;
  status: string;
  profilePictureUrl?: string;
  profileName?: string;
  profileStatus?: string;
  owner?: string;
}

export class EvolutionApiService {
  private static instance: EvolutionApiService;

  public static getInstance(): EvolutionApiService {
    if (!EvolutionApiService.instance) {
      EvolutionApiService.instance = new EvolutionApiService();
    }
    return EvolutionApiService.instance;
  }

  private async getConfig() {
    return await settingsService.getEvolutionConfig();
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
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

  async createInstance(instanceName: string): Promise<EvolutionCreateInstanceResponse> {
    const requestData: EvolutionCreateInstanceRequest = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    };

    const response = await this.makeRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    return response.json() as Promise<EvolutionCreateInstanceResponse>;
  }

  async getInstanceInfo(instanceName: string): Promise<EvolutionInstanceInfo> {
    const response = await this.makeRequest(`/instance/fetchInstances?instanceName=${instanceName}`);
    const data = await response.json() as EvolutionInstanceInfo[];

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    throw new Error(`Instância ${instanceName} não encontrada`);
  }

  async getQRCode(instanceName: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/instance/connect/${instanceName}`);
      const data = await response.json() as { base64?: string; code?: string; pairingCode?: string };

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
    } catch (error: any) {
      console.error(`❌ Erro ao obter QR Code da Evolution API para ${instanceName}:`, error.message);
      throw new Error(`QR Code não disponível: ${error.message}`);
    }
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    });
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/restart/${instanceName}`, {
      method: 'PUT'
    });
  }

  async getInstanceStatus(instanceName: string): Promise<string> {
    try {
      const info = await this.getInstanceInfo(instanceName);
      console.log(`🔍 Evolution getInstanceInfo para ${instanceName}:`, JSON.stringify(info, null, 2));

      // Mapear status Evolution para status do sistema
      const statusMap: { [key: string]: string } = {
        'open': 'WORKING',
        'connecting': 'SCAN_QR_CODE',
        'close': 'STOPPED',
        'closed': 'STOPPED',
        'qr': 'SCAN_QR_CODE',
        'qrReadSuccess': 'WORKING',
        'qrReadFail': 'FAILED'
      };

      // Evolution API pode usar connectionStatus, state ou status
      const rawData = info as any;
      const evolutionStatus = rawData.connectionStatus || rawData.state || rawData.status || 'close';

      console.log(`🔍 Status bruto Evolution para ${instanceName}: "${evolutionStatus}"`);
      const mappedStatus = statusMap[evolutionStatus.toLowerCase()] || 'STOPPED';
      console.log(`📊 Status mapeado para ${instanceName}: "${mappedStatus}"`);

      return mappedStatus;
    } catch (error) {
      console.warn(`⚠️ Erro ao obter status Evolution para ${instanceName}:`, error);
      return 'STOPPED';
    }
  }

  async listInstances(): Promise<EvolutionInstanceInfo[]> {
    const response = await this.makeRequest('/instance/fetchInstances');
    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  async createGroup(instanceName: string, groupName: string, participants: string[]): Promise<any> {
    const requestData = {
      groupName,
      participants
    };

    console.log(`Creating group '${groupName}' on instance '${instanceName}' with participants:`, participants);

    const response = await this.makeRequest(`/group/create/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return await response.json();
  }

  async getGroupInviteCode(instanceName: string, groupJid: string): Promise<string | null> {
    try {
      const response = await this.makeRequest(`/group/inviteCode/${instanceName}?groupJid=${groupJid}`);
      const data = await response.json() as { inviteCode?: string };
      console.log(`Invite code response for ${groupJid}:`, data);

      // Evolution returns something like { inviteCode: "..." } or just the string depending on version
      // Adapting based on likely structure
      if (data && data.inviteCode) {
        return data.inviteCode;
      }
      return null;
    } catch (error) {
      console.error(`Error getting invite code for group ${groupJid}:`, error);
      return null;
    }
  }

  async getGroupInfo(instanceName: string, groupJid: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/group/findGroup/${instanceName}?groupJid=${groupJid}`);
      return await response.json();
    } catch (error) {
      console.error(`Error getting info for group ${groupJid}:`, error);
      return null;
    }
  }

  async fetchAllGroups(instanceName: string): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/group/fetchAllGroups/${instanceName}?getParticipants=false`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching all groups for ${instanceName}:`, error);
      return [];
    }
  }
  async sendGroupMessage(instanceName: string, groupJid: string, message: any): Promise<any> {
    let endpoint = '';
    let body: any = {
      number: groupJid,
      options: {
        presence: 'composing',
        delay: 1200
      }
    };

    if (message.text) {
      endpoint = `/message/sendText/${instanceName}`;
      body.text = message.text;
    } else if (message.image) {
      endpoint = `/message/sendMedia/${instanceName}`;
      body.mediatype = 'image';
      body.media = message.image.url;
      body.caption = message.caption;
      body.fileName = 'image.png';
    } else if (message.video) {
      endpoint = `/message/sendMedia/${instanceName}`;
      body.mediatype = 'video';
      body.media = message.video.url;
      body.caption = message.caption;
    }
    // Add other types as needed

    return await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}

export const evolutionApiService = EvolutionApiService.getInstance();