import { api } from './api';

export interface WhatsappGroup {
    id: string;
    name: string;
    jid: string;
    inviteLink?: string;
    inviteCode?: string;
    currentParticipants: number;
    instanceName: string;
    createdAt: string;
}

export interface DynamicLink {
    id: string;
    slug: string;
    name: string;
    activeGroup?: WhatsappGroup;
    visitedCount?: number; // Not implemented in backend yet, but good to have in types
}

export const groupService = {
    createGroup: async (data: { groupName: string; participants: string[]; instanceName: string; dynamicLinkId?: string }) => {
        const response = await api.post('/groups', data);
        return response.data;
    },

    listGroups: async () => {
        const response = await api.get<WhatsappGroup[]>('/groups');
        return response.data;
    },

    createDynamicLink: async (data: { slug: string; name: string; baseGroupName: string; groupCapacity: number; instanceName: string }) => {
        const response = await api.post('/groups/dynamic-link', data);
        return response.data;
    },

    broadcast: async (data: { instanceName: string; groupJids: string[]; message: any }) => {
        const response = await api.post('/groups/broadcast', data);
        return response.data;
    },

    syncGroups: async (instanceName: string) => {
        const response = await api.post('/groups/sync', { instanceName });
        return response.data;
    }
};
