export interface LeadPage {
    id: string;
    slug: string;
    title: string;
    headline?: string;
    description?: string;
    primaryColor: string;
    backgroundColor: string;
    backgroundImageUrl?: string;
    tenantId: string;
    categoryId: string;
    submissions: number;
    createdAt: string;
    updatedAt: string;
    category?: {
        id: string;
        nome: string;
    };
    tenant?: {
        name: string;
        settings?: {
            customBranding: any;
        }
    };
}

export interface CreateLeadPageDTO {
    slug: string;
    title: string;
    headline?: string;
    description?: string;
    primaryColor?: string;
    backgroundColor?: string;
    backgroundImageUrl?: string;
    categoryId: string;
}

export interface UpdateLeadPageDTO extends Partial<CreateLeadPageDTO> { }
