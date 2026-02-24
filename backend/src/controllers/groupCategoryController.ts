import { Request, Response } from 'express';
import { groupCategoryService } from '../services/groupCategoryService';

export async function createCategory(req: Request, res: Response) {
    try {
        const { name, color, description } = req.body;
        const tenantId = (req as any).tenantId;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const category = await groupCategoryService.createCategory({
            name,
            color,
            description,
            tenantId
        });

        res.status(201).json(category);
    } catch (error: any) {
        console.error('Error creating group category:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function listCategories(req: Request, res: Response) {
    try {
        const tenantId = (req as any).tenantId;
        const categories = await groupCategoryService.listCategories(tenantId);
        res.json(categories);
    } catch (error: any) {
        console.error('Error listing group categories:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const tenantId = (req as any).tenantId;

        const category = await groupCategoryService.getCategory(id, tenantId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error: any) {
        console.error('Error getting group category:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, color, description } = req.body;
        const tenantId = (req as any).tenantId;

        const category = await groupCategoryService.updateCategory(id, tenantId, {
            name,
            color,
            description
        });

        res.json(category);
    } catch (error: any) {
        console.error('Error updating group category:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function deleteCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const tenantId = (req as any).tenantId;

        await groupCategoryService.deleteCategory(id, tenantId);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting group category:', error);
        res.status(500).json({ error: error.message });
    }
}
