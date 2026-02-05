import { api } from './api';

export interface WhatsappGroup {
    id: string;
    name: string;
    jid: string;
    inviteLink?: string;
    inviteCode?: string;
    capacity: number;
    currentParticipants: number;
    status: 'ACTIVE' | 'FULL' | 'ARCHIVED';
    instanceName: string;
    createdAt: string;
    updatedAt: string;
}

export interface DynamicLink {
    id: string;
    slug: string;
    name: string;
    baseGroupName: string;
    groupCapacity: number;
    instanceName: string;
    activeGroup?: WhatsappGroup;
    activeGroupId?: string;
    createdAt: string;
    updatedAt: string;
}

export const groupService = {
    // ============================================================================
    // GROUPS
    // ============================================================================
    createGroup: async (data: { name: string; instanceName: string; capacity?: number; initialParticipants?: string[] }) => {
        const response = await api.post('/groups/groups', data);
        return response.data;
    },

    listGroups: async () => {
        const response = await api.get<WhatsappGroup[]>('/groups/groups');
        return response.data;
    },

    getGroup: async (id: string) => {
        const response = await api.get<WhatsappGroup>(`/groups/groups/${id}`);
        return response.data;
    },

    deleteGroup: async (id: string) => {
        await api.delete(`/groups/groups/${id}`);
    },

    syncGroups: async (instanceName: string) => {
        const response = await api.post('/groups/groups/sync', { instanceName });
        return response.data;
    },

    // ============================================================================
    // DYNAMIC LINKS
    // ============================================================================
    createDynamicLink: async (data: { slug: string; name: string; baseGroupName: string; instanceName: string; groupCapacity?: number }) => {
        const response = await api.post('/groups/dynamic-links', data);
        return response.data;
    },

    listDynamicLinks: async () => {
        const response = await api.get<DynamicLink[]>('/groups/dynamic-links');
        return response.data;
    },

    getDynamicLink: async (id: string) => {
        const response = await api.get<DynamicLink>(`/groups/dynamic-links/${id}`);
        return response.data;
    },

    deleteDynamicLink: async (id: string) => {
        await api.delete(`/groups/dynamic-links/${id}`);
    },

    // ============================================================================
    // BROADCAST
    // ============================================================================
    broadcast: async (data: { instanceName: string; groupIds: string[]; message: { text?: string; image?: { url: string }; caption?: string } }) => {
        const response = await api.post('/groups/broadcast', data);
        return response.data;
    },

    broadcastToAll: async (data: { instanceName: string; message: { text?: string; image?: { url: string }; caption?: string } }) => {
        const response = await api.post('/groups/broadcast/all', data);
        return response.data;
    },

    // ============================================================================
    // PUBLIC INVITE LINK (for display purposes)
    // ============================================================================
    getInviteLinkUrl: (slug: string) => {
        // This returns the public URL that will redirect to the active group
        const baseUrl = import.meta.env.VITE_API_URL || '';
        return `${baseUrl}/groups/invite/${slug}`;
    }
};
