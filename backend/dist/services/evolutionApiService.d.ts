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
export declare class EvolutionApiService {
    private static instance;
    static getInstance(): EvolutionApiService;
    private getConfig;
    private makeRequest;
    createInstance(instanceName: string): Promise<EvolutionCreateInstanceResponse>;
    getInstanceInfo(instanceName: string): Promise<EvolutionInstanceInfo>;
    getQRCode(instanceName: string): Promise<string>;
    deleteInstance(instanceName: string): Promise<void>;
    restartInstance(instanceName: string): Promise<void>;
    getInstanceStatus(instanceName: string): Promise<string>;
    listInstances(): Promise<EvolutionInstanceInfo[]>;
    createGroup(instanceName: string, groupName: string, participants: string[]): Promise<any>;
    getGroupInviteCode(instanceName: string, groupJid: string): Promise<string | null>;
    getGroupInfo(instanceName: string, groupJid: string): Promise<any>;
    fetchAllGroups(instanceName: string): Promise<any[]>;
    sendGroupMessage(instanceName: string, groupJid: string, message: any): Promise<any>;
}
export declare const evolutionApiService: EvolutionApiService;
export {};
//# sourceMappingURL=evolutionApiService.d.ts.map