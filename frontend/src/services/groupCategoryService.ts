import { api } from './api';

export interface GroupCategory {
    id: string;
    name: string;
    color: string;
    description: string | null;
    tenantId: string;
    _count?: {
        groups: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryParams {
    name: string;
    color?: string;
    description?: string;
}

export interface UpdateCategoryParams {
    name?: string;
    color?: string;
    description?: string;
}

export const groupCategoryService = {
    listCategories: async () => {
        return api.get<GroupCategory[]>('/groups/categories');
    },

    createCategory: async (data: CreateCategoryParams) => {
        return api.post<GroupCategory>('/groups/categories', data);
    },

    updateCategory: async (id: string, data: UpdateCategoryParams) => {
        return api.put<GroupCategory>(`/groups/categories/${id}`, data);
    },

    deleteCategory: async (id: string) => {
        return api.delete(`/groups/categories/${id}`);
    }
};
