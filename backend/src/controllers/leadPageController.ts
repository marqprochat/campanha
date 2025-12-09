import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createLeadPage = async (req: Request, res: Response) => {
    try {
        const {
            slug,
            title,
            headline,
            description,
            primaryColor,
            backgroundColor,
            backgroundImageUrl,
            categoryId
        } = req.body;

        // Assumes authMiddleware attaches user to req
        const tenantId = (req as any).user?.tenantId;

        if (!tenantId) {
            return res.status(403).json({ error: 'Tenant ID missing' });
        }

        // Check if slug is taken
        const existing = await prisma.leadPage.findUnique({
            where: { slug }
        });

        if (existing) {
            return res.status(400).json({ error: 'Slug already in use' });
        }

        const leadPage = await prisma.leadPage.create({
            data: {
                slug,
                title,
                headline,
                description,
                primaryColor,
                backgroundColor,
                backgroundImageUrl,
                categoryId,
                tenantId
            }
        });

        res.status(201).json(leadPage);
    } catch (error) {
        console.error('Error creating lead page:', error);
        res.status(500).json({ error: 'Failed to create lead page' });
    }
};

export const updateLeadPage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            slug,
            title,
            headline,
            description,
            primaryColor,
            backgroundColor,
            backgroundImageUrl,
            categoryId
        } = req.body;

        const tenantId = (req as any).user?.tenantId;

        // Verify ownership
        const existing = await prisma.leadPage.findFirst({
            where: { id, tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Check slug uniqueness if changed
        if (slug && slug !== existing.slug) {
            const slugCheck = await prisma.leadPage.findUnique({
                where: { slug }
            });
            if (slugCheck) {
                return res.status(400).json({ error: 'Slug already in use' });
            }
        }

        const leadPage = await prisma.leadPage.update({
            where: { id },
            data: {
                slug,
                title,
                headline,
                description,
                primaryColor,
                backgroundColor,
                backgroundImageUrl,
                categoryId
            }
        });

        res.json(leadPage);
    } catch (error) {
        console.error('Error updating lead page:', error);
        res.status(500).json({ error: 'Failed to update lead page' });
    }
};

export const deleteLeadPage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = (req as any).user?.tenantId;

        const existing = await prisma.leadPage.findFirst({
            where: { id, tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Page not found' });
        }

        await prisma.leadPage.delete({
            where: { id }
        });

        res.json({ message: 'Page deleted' });
    } catch (error) {
        console.error('Error deleting lead page:', error);
        res.status(500).json({ error: 'Failed to delete lead page' });
    }
};

export const getLeadPages = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;

        if (!tenantId) {
            return res.status(403).json({ error: 'Tenant ID missing' });
        }

        const pages = await prisma.leadPage.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { category: true }
        });

        res.json(pages);
    } catch (error) {
        console.error('Error listing lead pages:', error);
        res.status(500).json({ error: 'Failed to list lead pages' });
    }
};

export const getLeadPageById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = (req as any).user?.tenantId;

        const page = await prisma.leadPage.findFirst({
            where: { id, tenantId },
            include: { category: true }
        });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        console.error('Error getting lead page:', error);
        res.status(500).json({ error: 'Failed to get lead page' });
    }
};

// PUBLIC METHODS

export const getPublicLeadPage = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        const page = await prisma.leadPage.findUnique({
            where: { slug },
            include: {
                tenant: {
                    select: {
                        name: true,
                        settings: {
                            select: {
                                customBranding: true
                            }
                        }
                    }
                }
            }
        });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        console.error('Error getting public lead page:', error);
        res.status(500).json({ error: 'Failed to get lead page' });
    }
};

export const submitLead = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const { name, phone, email } = req.body;

        const page = await prisma.leadPage.findUnique({
            where: { slug }
        });

        if (!page) {
            return res.status(404).json({ error: 'Page not found' });
        }

        // Sanitize phone (keep only digits)
        const cleanPhone = phone.replace(/\D/g, '');

        // Simple validation (adjust length as needed, e.g., Brazil mobile is 11 digits)
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
            return res.status(400).json({ error: 'Número de WhatsApp inválido' });
        }

        // Check for duplicates in the same category
        const existingContact = await prisma.contact.findFirst({
            where: {
                categoriaId: page.categoryId,
                telefone: cleanPhone
            }
        });

        if (existingContact) {
            return res.status(409).json({ error: 'Este WhatsApp já está cadastrado nesta lista.' });
        }

        // Create contact
        const contact = await prisma.contact.create({
            data: {
                nome: name,
                telefone: cleanPhone,
                email: email,
                tenantId: page.tenantId,
                categoriaId: page.categoryId,
                observacoes: `Capturado via página: ${page.title}`
            }
        });

        // Increment submission count
        await prisma.leadPage.update({
            where: { id: page.id },
            data: { submissions: { increment: 1 } }
        });

        res.status(201).json(contact);
    } catch (error) {
        console.error('Error submitting lead:', error);
        res.status(500).json({ error: 'Failed to submit lead' });
    }
};
