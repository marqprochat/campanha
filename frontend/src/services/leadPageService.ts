import { api } from './api';
import { LeadPage, CreateLeadPageDTO, UpdateLeadPageDTO } from '../types/LeadPage';

export const leadPageService = {
    create: async (data: CreateLeadPageDTO): Promise<LeadPage> => {
        const response = await api.post('/lead-pages', data);
        return response;
    },

    update: async (id: string, data: UpdateLeadPageDTO): Promise<LeadPage> => {
        const response = await api.put(`/lead-pages/${id}`, data);
        return response;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/lead-pages/${id}`);
    },

    list: async (): Promise<LeadPage[]> => {
        const response = await api.get<LeadPage[]>('/lead-pages');
        return response;
    },

    getById: async (id: string): Promise<LeadPage> => {
        const response = await api.get<LeadPage>(`/lead-pages/${id}`);
        return response;
    },

    getPublicBySlug: async (slug: string): Promise<LeadPage> => {
        const response = await api.get<LeadPage>(`/lead-pages/public/${slug}`);
        return response;
    },

    submitLead: async (slug: string, data: { name: string; phone: string; email?: string }): Promise<any> => {
        const response = await api.post(`/lead-pages/public/${slug}/submit`, data);
        return response;
    }
};
