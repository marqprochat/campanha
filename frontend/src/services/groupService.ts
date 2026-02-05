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

export interface WhatsAppInstance {
    name: string;
    displayName?: string;
    status: string;
    provider: string;
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
        return api.post('/groups/groups', data);
    },

    listGroups: async () => {
        return api.get<WhatsappGroup[]>('/groups/groups');
    },

    getGroup: async (id: string) => {
        return api.get<WhatsappGroup>(`/groups/groups/${id}`);
    },

    deleteGroup: async (id: string) => {
        await api.delete(`/groups/groups/${id}`);
    },

    syncGroups: async (instanceName: string) => {
        return api.post('/groups/groups/sync', { instanceName });
    },

    // ============================================================================
    // DYNAMIC LINKS
    // ============================================================================
    createDynamicLink: async (data: { slug: string; name: string; baseGroupName: string; instanceName: string; groupCapacity?: number }) => {
        return api.post('/groups/dynamic-links', data);
    },

    listDynamicLinks: async () => {
        return api.get<DynamicLink[]>('/groups/dynamic-links');
    },

    getDynamicLink: async (id: string) => {
        return api.get<DynamicLink>(`/groups/dynamic-links/${id}`);
    },

    deleteDynamicLink: async (id: string) => {
        await api.delete(`/groups/dynamic-links/${id}`);
    },

    // ============================================================================
    // BROADCAST
    // ============================================================================
    broadcast: async (data: { instanceName: string; groupIds: string[]; message: { text?: string; image?: { url: string }; caption?: string } }) => {
        return api.post('/groups/broadcast', data);
    },

    broadcastToAll: async (data: { instanceName: string; message: { text?: string; image?: { url: string }; caption?: string } }) => {
        return api.post('/groups/broadcast/all', data);
    },

    // ============================================================================
    // INSTANCES
    // ============================================================================
    listInstances: async () => {
        return api.get<WhatsAppInstance[]>('/waha/sessions');
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
