export declare class SettingsService {
    private static instance;
    private cachedSettings;
    static getInstance(): SettingsService;
    getSettings(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        singleton: boolean;
        wahaHost: string;
        wahaApiKey: string;
        evolutionHost: string;
        evolutionApiKey: string;
        quepasaUrl: string;
        quepasaLogin: string;
        quepasaPassword: string;
        logoUrl: string | null;
        faviconUrl: string | null;
        iconUrl: string | null;
        companyName: string | null;
        pageTitle: string | null;
        primaryColor: string | null;
    } | {
        wahaHost: string;
        wahaApiKey: string;
        evolutionHost: string;
        evolutionApiKey: string;
        quepasaUrl: string;
        quepasaLogin: string;
        quepasaPassword: string;
        companyName: string;
        logoUrl: null;
        faviconUrl: string;
        pageTitle: string;
        iconUrl: string;
    }>;
    updateSettings(data: {
        wahaHost?: string;
        wahaApiKey?: string;
        evolutionHost?: string;
        evolutionApiKey?: string;
        quepasaUrl?: string;
        quepasaLogin?: string;
        quepasaPassword?: string;
        logoUrl?: string | null;
        companyName?: string;
        faviconUrl?: string | null;
        pageTitle?: string;
        iconUrl?: string | null;
        primaryColor?: string | null;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        singleton: boolean;
        wahaHost: string;
        wahaApiKey: string;
        evolutionHost: string;
        evolutionApiKey: string;
        quepasaUrl: string;
        quepasaLogin: string;
        quepasaPassword: string;
        logoUrl: string | null;
        faviconUrl: string | null;
        iconUrl: string | null;
        companyName: string | null;
        pageTitle: string | null;
        primaryColor: string | null;
    }>;
    getCachedSettings(): any;
    getWahaConfig(): Promise<{
        host: string;
        apiKey: string;
    }>;
    getEvolutionConfig(): Promise<{
        host: string;
        apiKey: string;
    }>;
    getQuepasaConfig(): Promise<{
        url: string;
        login: string;
        password: string;
    }>;
}
export declare const settingsService: SettingsService;
//# sourceMappingURL=settingsService.d.ts.map