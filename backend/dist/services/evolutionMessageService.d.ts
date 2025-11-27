interface EvolutionMessage {
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
export declare function sendMessageViaEvolution(instanceName: string, phone: string | number, message: EvolutionMessage): Promise<unknown>;
export declare function checkContactExistsEvolution(instanceName: string, phone: string | number): Promise<{
    exists: boolean;
    validPhone?: string;
}>;
export {};
//# sourceMappingURL=evolutionMessageService.d.ts.map