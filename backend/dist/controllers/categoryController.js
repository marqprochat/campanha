"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const categoryService_1 = require("../services/categoryService");
class CategoryController {
    static async getCategories(req, res) {
        try {
            const { search, page = '1', pageSize = '10' } = req.query;
            // Sempre usar tenantId do token
            const tenantId = req.tenantId;
            const result = await categoryService_1.CategoryService.getCategories(search, parseInt(page), parseInt(pageSize), tenantId);
            res.json(result);
        }
        catch (error) {
            console.error('Erro ao buscar categorias:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getAllCategories(req, res) {
        try {
            const tenantId = req.tenantId;
            const categories = await categoryService_1.CategoryService.getAllCategories(tenantId);
            res.json(categories);
        }
        catch (error) {
            console.error('Erro ao buscar todas as categorias:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId;
            const category = await categoryService_1.CategoryService.getCategoryById(id, tenantId);
            res.json(category);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Categoria não encontrada') {
                res.status(404).json({ error: error.message });
            }
            else {
                console.error('Erro ao buscar categoria:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }
    static async createCategory(req, res) {
        try {
            const categoryData = req.body;
            if (!categoryData.nome || !categoryData.cor) {
                return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
            }
            const tenantId = req.tenantId;
            const newCategory = await categoryService_1.CategoryService.createCategory(categoryData, tenantId);
            res.status(201).json(newCategory);
        }
        catch (error) {
            console.error('Erro ao criar categoria:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const categoryData = req.body;
            if (!categoryData.nome || !categoryData.cor) {
                return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
            }
            const tenantId = req.tenantId;
            const updatedCategory = await categoryService_1.CategoryService.updateCategory(id, categoryData, tenantId);
            res.json(updatedCategory);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Categoria não encontrada') {
                res.status(404).json({ error: error.message });
            }
            else {
                console.error('Erro ao atualizar categoria:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId;
            await categoryService_1.CategoryService.deleteCategory(id, tenantId);
            res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error && error.message === 'Categoria não encontrada') {
                res.status(404).json({ error: error.message });
            }
            else {
                console.error('Erro ao deletar categoria:', error);
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=categoryController.js.map