interface WAHAMessage {
    text?: string;
    image?: {
        url: string;
    };
    video?: {
        url: string;
    };
    audio?: {
        url: string;
    };
    document?: {
        url: string;
    };
    fileName?: string;
    caption?: string;
}
export declare function sendMessage(sessionName: string, phone: string, message: WAHAMessage, validatedChatId?: string): Promise<unknown>;
export declare function getSessionStatus(sessionName: string): Promise<any>;
export declare function checkContactExists(sessionName: string, phone: string): Promise<{
    exists: boolean;
    chatId?: string;
}>;
export declare function uploadMedia(sessionName: string, file: Buffer, fileName: string): Promise<unknown>;
export {};
//# sourceMappingURL=wahaApiService.d.ts.map