"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CategoryService {
    static async getCategories(search, page = 1, pageSize = 10, tenantId) {
        const where = {};
        // Apply tenant filter (SUPERADMIN can see all if tenantId is undefined)
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }
        if (search) {
            const searchLower = search.toLowerCase();
            where.OR = [
                {
                    nome: {
                        contains: searchLower,
                        mode: 'insensitive'
                    }
                },
                {
                    descricao: {
                        contains: searchLower,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy: {
                    criadoEm: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.category.count({ where })
        ]);
        return {
            categories,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }
    static async getCategoryById(id, tenantId) {
        const where = { id };
        // Apply tenant filter (SUPERADMIN can see all if tenantId is undefined)
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }
        const category = await prisma.category.findFirst({ where });
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        return category;
    }
    static async createCategory(data, tenantId) {
        const newCategory = await prisma.category.create({
            data: {
                nome: data.nome,
                cor: data.cor,
                descricao: data.descricao || null,
                tenantId
            }
        });
        return newCategory;
    }
    static async updateCategory(id, data, tenantId) {
        const where = { id };
        // Apply tenant filter (SUPERADMIN can see all if tenantId is undefined)
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }
        // Check if category exists and belongs to tenant
        const existingCategory = await prisma.category.findFirst({ where });
        if (!existingCategory) {
            throw new Error('Categoria não encontrada');
        }
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                nome: data.nome,
                cor: data.cor,
                descricao: data.descricao || null,
            }
        });
        return updatedCategory;
    }
    static async deleteCategory(id, tenantId) {
        const where = { id };
        // Apply tenant filter (SUPERADMIN can see all if tenantId is undefined)
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }
        // Check if category exists and belongs to tenant
        const existingCategory = await prisma.category.findFirst({ where });
        if (!existingCategory) {
            throw new Error('Categoria não encontrada');
        }
        await prisma.category.delete({
            where: { id }
        });
    }
    static async getAllCategories(tenantId) {
        const where = {};
        // Apply tenant filter (SUPERADMIN can see all if tenantId is undefined)
        if (tenantId !== undefined) {
            where.tenantId = tenantId;
        }
        return prisma.category.findMany({
            where,
            orderBy: {
                criadoEm: 'desc'
            }
        });
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=categoryService.js.map