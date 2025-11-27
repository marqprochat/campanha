"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const client_1 = require("@prisma/client");
const libphonenumber_js_1 = require("libphonenumber-js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const categoryService_1 = require("./categoryService");
const prisma = new client_1.PrismaClient();
const DATA_FILE = '/app/data/contacts.json';
const defaultContacts = [];
function loadContacts() {
    try {
        // Ensure directory exists
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log('📁 ContactService.loadContacts - diretório criado:', dir);
        }
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(data, (key, value) => {
                if (key === 'criadoEm' || key === 'atualizadoEm') {
                    return new Date(value);
                }
                return value;
            });
            console.log(`📂 ContactService.loadContacts - carregou ${parsed.length} contatos do arquivo`);
            return parsed;
        }
        else {
            console.log('📂 ContactService.loadContacts - arquivo não existe, iniciando com contatos padrão');
            // Initialize with default contacts when file doesn't exist
            saveContacts(defaultContacts);
            return [...defaultContacts];
        }
    }
    catch (error) {
        console.error('❌ ContactService.loadContacts - erro ao carregar:', error);
        // In case of error, initialize with default contacts
        console.log('📂 ContactService.loadContacts - erro encontrado, iniciando com contatos padrão');
        try {
            saveContacts(defaultContacts);
            return [...defaultContacts];
        }
        catch (saveError) {
            console.error('❌ ContactService.loadContacts - erro ao salvar contatos padrão:', saveError);
            return [...defaultContacts];
        }
    }
}
function saveContacts(contacts) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
    }
    catch (error) {
        console.error('Erro ao salvar contatos:', error);
    }
}
// Removido cache em memória - sempre ler do arquivo para consistência entre instâncias
async function enrichContactsWithCategories(contactsList) {
    try {
        const categories = await categoryService_1.CategoryService.getAllCategories();
        return contactsList.map(contact => {
            if (contact.categoriaId) {
                const categoria = categories.find(cat => cat.id === contact.categoriaId);
                return { ...contact, categoria };
            }
            return { ...contact, categoria: null };
        });
    }
    catch (error) {
        console.error('Erro ao buscar categorias:', error);
        return contactsList.map(contact => ({ ...contact, categoria: null }));
    }
}
class ContactService {
    static normalizePhone(phone) {
        const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(phone, 'BR');
        if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error('Número de telefone inválido');
        }
        return phoneNumber.format('E.164');
    }
    static async getContacts(search, page = 1, pageSize = 30, tenantId, tag) {
        try {
            console.log('📋 ContactService.getContacts - tenantId:', tenantId, 'tag:', tag);
            // Construir filtros dinâmicos
            const where = {};
            // Filtro por tenant (SUPERADMIN vê todos se tenantId for undefined)
            if (tenantId) {
                where.tenantId = tenantId;
            }
            // Filtro por categoria/tag
            if (tag) {
                where.categoriaId = tag;
            }
            // Filtro de busca
            if (search) {
                const searchLower = search.toLowerCase();
                where.OR = [
                    { nome: { contains: searchLower, mode: 'insensitive' } },
                    { telefone: { contains: search } },
                    { email: { contains: searchLower, mode: 'insensitive' } }
                ];
            }
            // Buscar total de registros
            const total = await prisma.contact.count({ where });
            // Buscar contatos com paginação e incluir categoria
            const skip = (page - 1) * pageSize;
            const contacts = await prisma.contact.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { criadoEm: 'desc' },
                include: {
                    categoria: true
                }
            });
            console.log('📋 ContactService.getContacts - total encontrados:', total);
            return {
                contacts,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            };
        }
        catch (error) {
            console.error('❌ ContactService.getContacts - erro:', error);
            throw error;
        }
    }
    static async getContactById(id, tenantId) {
        try {
            const where = { id };
            // Filtro por tenant (SUPERADMIN pode acessar qualquer contato)
            if (tenantId) {
                where.tenantId = tenantId;
            }
            const contact = await prisma.contact.findFirst({
                where,
                include: {
                    categoria: true
                }
            });
            if (!contact) {
                throw new Error('Contato não encontrado');
            }
            return contact;
        }
        catch (error) {
            console.error('❌ ContactService.getContactById - erro:', error);
            throw error;
        }
    }
    static async createContact(data) {
        try {
            console.log('📝 ContactService.createContact - data recebido:', JSON.stringify(data, null, 2));
            const normalizedPhone = this.normalizePhone(data.telefone);
            const newContact = await prisma.contact.create({
                data: {
                    nome: data.nome,
                    telefone: normalizedPhone,
                    email: data.email || null,
                    observacoes: data.observacoes || null,
                    tags: data.tags || [],
                    categoriaId: data.categoriaId || null,
                    tenantId: data.tenantId || null
                },
                include: {
                    categoria: true
                }
            });
            console.log('✅ ContactService.createContact - contato criado:', newContact.id);
            return newContact;
        }
        catch (error) {
            console.error('❌ ContactService.createContact - erro:', error);
            throw error;
        }
    }
    static async updateContact(id, data, tenantId) {
        try {
            const normalizedPhone = this.normalizePhone(data.telefone);
            // Construir where clause com tenant isolation
            const where = { id };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            // Verificar se o contato existe e pertence ao tenant
            const existingContact = await prisma.contact.findFirst({ where });
            if (!existingContact) {
                throw new Error('Contato não encontrado');
            }
            const updatedContact = await prisma.contact.update({
                where: { id },
                data: {
                    nome: data.nome,
                    telefone: normalizedPhone,
                    email: data.email || null,
                    observacoes: data.observacoes || null,
                    tags: data.tags || [],
                    categoriaId: data.categoriaId || null
                },
                include: {
                    categoria: true
                }
            });
            console.log('✅ ContactService.updateContact - contato atualizado:', id);
            return updatedContact;
        }
        catch (error) {
            console.error('❌ ContactService.updateContact - erro:', error);
            throw error;
        }
    }
    static async deleteContact(id, tenantId) {
        try {
            // Construir where clause com tenant isolation
            const where = { id };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            // Verificar se o contato existe e pertence ao tenant
            const existingContact = await prisma.contact.findFirst({ where });
            if (!existingContact) {
                throw new Error('Contato não encontrado');
            }
            await prisma.contact.delete({
                where: { id }
            });
            console.log('✅ ContactService.deleteContact - contato excluído:', id);
        }
        catch (error) {
            console.error('❌ ContactService.deleteContact - erro:', error);
            throw error;
        }
    }
    static async bulkUpdateContacts(contactIds, updates, tenantId) {
        try {
            console.log('📝 ContactService.bulkUpdateContacts - IDs:', contactIds.length);
            // Construir where clause com tenant isolation
            const where = {
                id: { in: contactIds }
            };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            // Verificar quantos contatos existem e pertencem ao tenant
            const existingContacts = await prisma.contact.count({ where });
            if (existingContacts === 0) {
                throw new Error('Nenhum contato encontrado para atualizar');
            }
            // Preparar dados de atualização
            const updateData = {};
            if (updates.categoriaId !== undefined) {
                updateData.categoriaId = updates.categoriaId;
            }
            if (updates.tags !== undefined) {
                updateData.tags = updates.tags;
            }
            if (updates.observacoes !== undefined) {
                updateData.observacoes = updates.observacoes;
            }
            // Atualizar contatos
            const result = await prisma.contact.updateMany({
                where,
                data: updateData
            });
            console.log('✅ ContactService.bulkUpdateContacts - contatos atualizados:', result.count);
            return {
                message: `${result.count} contato(s) atualizado(s) com sucesso`,
                count: result.count
            };
        }
        catch (error) {
            console.error('❌ ContactService.bulkUpdateContacts - erro:', error);
            throw error;
        }
    }
    static async bulkDeleteContacts(contactIds, tenantId) {
        try {
            console.log('🗑️ ContactService.bulkDeleteContacts - IDs:', contactIds.length);
            // Construir where clause com tenant isolation
            const where = {
                id: { in: contactIds }
            };
            if (tenantId) {
                where.tenantId = tenantId;
            }
            // Verificar quantos contatos existem e pertencem ao tenant
            const existingContacts = await prisma.contact.count({ where });
            if (existingContacts === 0) {
                throw new Error('Nenhum contato encontrado para excluir');
            }
            // Excluir contatos
            const result = await prisma.contact.deleteMany({
                where
            });
            console.log('✅ ContactService.bulkDeleteContacts - contatos excluídos:', result.count);
            return {
                message: `${result.count} contato(s) excluído(s) com sucesso`,
                count: result.count
            };
        }
        catch (error) {
            console.error('❌ ContactService.bulkDeleteContacts - erro:', error);
            throw error;
        }
    }
}
exports.ContactService = ContactService;
//# sourceMappingURL=contactService.js.map