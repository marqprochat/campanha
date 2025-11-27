export declare class WahaSyncService {
    /**
     * Sincroniza todas as sessões da WAHA API com o banco de dados
     */
    static syncAllSessions(): Promise<any[]>;
    /**
     * Sincroniza uma sessão específica
     */
    static syncSession(sessionName: string): Promise<any>;
    /**
     * Cria uma nova sessão na WAHA API e salva no banco
     */
    static createSession(name: string): Promise<any>;
    /**
     * Deleta uma sessão da WAHA API e do banco
     */
    static deleteSession(sessionName: string): Promise<void>;
    /**
     * Inicia uma sessão e atualiza status no banco
     */
    static startSession(sessionName: string): Promise<any>;
    /**
     * Para uma sessão e atualiza status no banco
     */
    static stopSession(sessionName: string): Promise<any>;
    /**
     * Reinicia uma sessão
     */
    static restartSession(sessionName: string): Promise<any>;
}
//# sourceMappingURL=wahaSyncService.d.ts.map