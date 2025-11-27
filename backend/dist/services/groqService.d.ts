export interface GroqMessage {
    model: string;
    system: string;
    user: string;
}
export interface GroqResponse {
    success: boolean;
    message?: string;
    error?: string;
}
export declare class GroqService {
    private static instance;
    private baseURL;
    static getInstance(): GroqService;
    generateMessage(messageConfig: GroqMessage, contactData?: any, tenantId?: string): Promise<GroqResponse>;
    validateApiKey(tenantId: string): Promise<boolean>;
}
export declare const groqService: GroqService;
//# sourceMappingURL=groqService.d.ts.map