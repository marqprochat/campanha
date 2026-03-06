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
    categoryId?: string | null;
    category?: {
        id: string;
        name: string;
        color: string;
    };
    imageUrl?: string | null;
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
    adminOnly?: boolean;
    adminNumbers?: string;
    groupDescription?: string;
    activeGroup?: WhatsappGroup;
    activeGroupId?: string;
    image?: string | null;
    categoryId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface GroupCampaign {
    id: string;
    name: string;
    targetType: 'GROUPS' | 'CATEGORY';
    targetIds: string[];
    messageType: string;
    messageContent: string;
    instanceName: string;
    tenantId: string;
    scheduledFor: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    sentCount: number;
    failedCount: number;
    createdAt: string;
    updatedAt: string;
}

export const groupService = {
    // ============================================================================
    // GROUPS
    // ============================================================================
    createGroup: async (data: { name: string; instanceName: string; capacity?: number; initialParticipants?: string[]; adminOnly?: boolean; adminNumbers?: string[]; description?: string; categoryId?: string; imageUrl?: string }) => {
        return api.post('/groups/groups', data);
    },

    createGroupStreaming: async (
        data: { name: string; instanceName: string; capacity?: number; initialParticipants?: string[]; adminOnly?: boolean; adminNumbers?: string[]; description?: string; categoryId?: string; imageUrl?: string },
        onMessage: (message: any) => void
    ) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/groups/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create group');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('Response stream not available');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const parsedData = JSON.parse(line.replace('data: ', ''));
                        onMessage(parsedData);
                    } catch (e) {
                        console.error('Error parsing stream data', e);
                    }
                }
            }
        }
    },

    updateGroup: async (id: string, data: { name?: string; categoryId?: string; imageUrl?: string }) => {
        return api.put(`/groups/groups/${id}`, data);
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

    deleteGroupsBatch: async (ids: string[]) => {
        return api.post<{ deleted: number }>('/groups/groups/batch-delete', { ids });
    },

    syncGroups: async (instanceName: string) => {
        return api.post('/groups/groups/sync', { instanceName });
    },

    // ============================================================================
    // DYNAMIC LINKS
    // ============================================================================
    createDynamicLink: async (data: { slug: string; name: string; baseGroupName: string; instanceName: string; groupCapacity?: number; initialParticipants?: string[]; adminOnly?: boolean; adminNumbers?: string[]; description?: string; image?: string; categoryId?: string }) => {
        return api.post('/groups/dynamic-links', data);
    },

    createDynamicLinkStreaming: async (
        data: { slug: string; name: string; baseGroupName: string; instanceName: string; groupCapacity?: number; initialParticipants?: string[]; adminOnly?: boolean; adminNumbers?: string[]; description?: string; image?: string; categoryId?: string },
        onMessage: (message: any) => void
    ) => {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/groups/dynamic-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create dynamic link');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('Response stream not available');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const parsedData = JSON.parse(line.replace('data: ', ''));
                        onMessage(parsedData);
                    } catch (e) {
                        console.error('Error parsing stream data', e);
                    }
                }
            }
        }
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

    broadcastToCategory: async (data: { instanceName: string; categoryId: string; message: { text?: string; image?: { url: string }; caption?: string } }) => {
        return api.post('/groups/broadcast/category', data);
    },

    // ============================================================================
    // SCHEDULED CAMPAIGNS (GroupCampaign)
    // ============================================================================
    scheduleBroadcast: async (data: {
        name: string;
        targetType: 'GROUPS' | 'CATEGORY';
        targetIds: string[];
        messageType: string;
        messageContent: any;
        instanceName: string;
        scheduledFor: string
    }) => {
        return api.post('/group-campaigns', data);
    },

    listScheduledBroadcasts: async () => {
        return api.get<GroupCampaign[]>('/group-campaigns');
    },

    cancelScheduledBroadcast: async (id: string) => {
        return api.post(`/group-campaigns/${id}/cancel`, {});
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
        const origin = window.location.origin;
        return `${origin}/api/groups/invite/${slug}`;
    },

    // ============================================================================
    // LINK PREVIEW
    // ============================================================================
    fetchLinkPreview: async (url: string) => {
        return api.post<{ url: string; title: string; description: string; image: string | null; siteName: string; type: string }>('/groups/link-preview', { url });
    },

    // ============================================================================
    // IMAGE UPLOAD (for broadcast)
    // ============================================================================
    uploadBroadcastImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/uploads/image', {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload image');
        return response.json() as Promise<{ url: string }>;
    },

    uploadGroupImage: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/groups/groups/upload-image', {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload group image');
        return response.json() as Promise<{ imageUrl: string }>;
    }
};
