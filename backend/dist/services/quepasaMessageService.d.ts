/**
 * Verifica se um número existe no WhatsApp via Quepasa
 */
export declare function checkContactExistsQuepasa(sessionName: string, phone: string, sessionToken?: string): Promise<{
    exists: boolean;
    validPhone?: string;
}>;
/**
 * Envia mensagem via Quepasa
 */
export declare function sendMessageViaQuepasa(sessionName: string, phone: string, content: any, sessionToken?: string): Promise<{
    success: boolean;
    id?: string;
    error?: string;
}>;
//# sourceMappingURL=quepasaMessageService.d.ts.map