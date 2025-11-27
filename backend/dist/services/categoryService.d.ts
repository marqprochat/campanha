import { CategoryInput, CategoriesResponse } from '../types';
export declare class CategoryService {
    static getCategories(search?: string, page?: number, pageSize?: number, tenantId?: string): Promise<CategoriesResponse>;
    static getCategoryById(id: string, tenantId?: string): Promise<{
        descricao: string | null;
        nome: string;
        id: string;
        cor: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    static createCategory(data: CategoryInput, tenantId?: string): Promise<{
        descricao: string | null;
        nome: string;
        id: string;
        cor: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    static updateCategory(id: string, data: CategoryInput, tenantId?: string): Promise<{
        descricao: string | null;
        nome: string;
        id: string;
        cor: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }>;
    static deleteCategory(id: string, tenantId?: string): Promise<void>;
    static getAllCategories(tenantId?: string): Promise<{
        descricao: string | null;
        nome: string;
        id: string;
        cor: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
    }[]>;
}
//# sourceMappingURL=categoryService.d.ts.map