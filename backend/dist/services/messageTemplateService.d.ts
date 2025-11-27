interface MessageTemplate {
    id?: string;
    name: string;
    tenantId: string;
    category: string;
    messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
    content: string;
    variables: string[];
    mediaUrl?: string;
    active: boolean;
    tags: string[];
    description?: string;
    createdBy: string;
}
interface ProcessedTemplate {
    content: string;
    mediaUrl?: string;
    variables: {
        [key: string]: string;
    };
}
export declare class MessageTemplateService {
    private static instance;
    private constructor();
    static getInstance(): MessageTemplateService;
    createTemplate(templateData: MessageTemplate): Promise<any>;
    getTemplates(tenantId: string, filters?: {
        category?: string;
        messageType?: string;
        active?: boolean;
        search?: string;
        tags?: string[];
    }): Promise<any[]>;
    getTemplate(templateId: string, tenantId: string): Promise<any | null>;
    updateTemplate(templateId: string, tenantId: string, updateData: Partial<MessageTemplate>): Promise<any>;
    deleteTemplate(templateId: string, tenantId: string): Promise<boolean>;
    processTemplate(templateId: string, tenantId: string, contactData: any, customVariables?: {
        [key: string]: string;
    }): Promise<ProcessedTemplate>;
    duplicateTemplate(templateId: string, tenantId: string, newName: string): Promise<any>;
    getCategories(tenantId: string): Promise<string[]>;
    validateTemplate(template: Partial<MessageTemplate>): {
        valid: boolean;
        errors: string[];
    };
    private extractVariables;
    private getContactField;
    getTemplateStats(tenantId: string): Promise<any>;
}
export declare const messageTemplateService: MessageTemplateService;
export {};
//# sourceMappingURL=messageTemplateService.d.ts.map