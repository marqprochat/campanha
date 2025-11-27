import { ContactInput, ContactsResponse } from '../types';
export declare class ContactService {
    static normalizePhone(phone: string): string;
    static getContacts(search?: string, page?: number, pageSize?: number, tenantId?: string, tag?: string): Promise<ContactsResponse>;
    static getContactById(id: string, tenantId?: string): Promise<{
        categoria: {
            descricao: string | null;
            nome: string;
            id: string;
            cor: string;
            tenantId: string | null;
            criadoEm: Date;
            atualizadoEm: Date;
        } | null;
    } & {
        nome: string;
        id: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
        email: string | null;
        telefone: string;
        tags: string[];
        observacoes: string | null;
        categoriaId: string | null;
    }>;
    static createContact(data: ContactInput): Promise<{
        categoria: {
            descricao: string | null;
            nome: string;
            id: string;
            cor: string;
            tenantId: string | null;
            criadoEm: Date;
            atualizadoEm: Date;
        } | null;
    } & {
        nome: string;
        id: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
        email: string | null;
        telefone: string;
        tags: string[];
        observacoes: string | null;
        categoriaId: string | null;
    }>;
    static updateContact(id: string, data: ContactInput, tenantId?: string): Promise<{
        categoria: {
            descricao: string | null;
            nome: string;
            id: string;
            cor: string;
            tenantId: string | null;
            criadoEm: Date;
            atualizadoEm: Date;
        } | null;
    } & {
        nome: string;
        id: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
        email: string | null;
        telefone: string;
        tags: string[];
        observacoes: string | null;
        categoriaId: string | null;
    }>;
    static deleteContact(id: string, tenantId?: string): Promise<void>;
    static bulkUpdateContacts(contactIds: string[], updates: any, tenantId?: string): Promise<{
        message: string;
        count: number;
    }>;
    static bulkDeleteContacts(contactIds: string[], tenantId?: string): Promise<{
        message: string;
        count: number;
    }>;
}
//# sourceMappingURL=contactService.d.ts.map