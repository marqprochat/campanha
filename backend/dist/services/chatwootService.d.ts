interface TagMapping {
    chatwootTag: string;
    categoryId: string;
}
export declare class ChatwootService {
    getTags(tenantId: string): Promise<Array<{
        name: string;
        count: number;
    }>>;
    syncContacts(tenantId: string, tagMappings: TagMapping[]): Promise<{
        imported: number;
        updated: number;
    }>;
}
export {};
//# sourceMappingURL=chatwootService.d.ts.map