export interface OpenAIMessage {
    model: string;
    system: string;
    user: string;
}
export interface OpenAIResponse {
    success: boolean;
    message?: string;
    error?: string;
}
export declare class OpenAIService {
    private static instance;
    private baseURL;
    static getInstance(): OpenAIService;
    generateMessage(messageConfig: OpenAIMessage, contactData?: any, tenantId?: string): Promise<OpenAIResponse>;
    validateApiKey(tenantId: string): Promise<boolean>;
}
export declare const openaiService: OpenAIService;
//# sourceMappingURL=openaiService.d.ts.map