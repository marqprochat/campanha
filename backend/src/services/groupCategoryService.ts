import { PrismaClient, GroupCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateGroupCategoryParams {
    name: string;
    color?: string;
    description?: string;
    tenantId: string;
}

interface UpdateGroupCategoryParams {
    name?: string;
    color?: string;
    description?: string;
}

export class GroupCategoryService {
    private static instance: GroupCategoryService;

    public static getInstance(): GroupCategoryService {
        if (!GroupCategoryService.instance) {
            GroupCategoryService.instance = new GroupCategoryService();
        }
        return GroupCategoryService.instance;
    }

    async createCategory(params: CreateGroupCategoryParams): Promise<GroupCategory> {
        return prisma.groupCategory.create({
            data: {
                name: params.name,
                color: params.color,
                description: params.description,
                tenantId: params.tenantId
            }
        });
    }

    async listCategories(tenantId: string): Promise<GroupCategory[]> {
        return prisma.groupCategory.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { groups: true }
                }
            }
        });
    }

    async getCategory(id: string, tenantId: string): Promise<GroupCategory | null> {
        return prisma.groupCategory.findFirst({
            where: { id, tenantId },
            include: {
                groups: true
            }
        });
    }

    async updateCategory(id: string, tenantId: string, params: UpdateGroupCategoryParams): Promise<GroupCategory> {
        const category = await prisma.groupCategory.findFirst({ where: { id, tenantId } });
        if (!category) throw new Error('Category not found');

        return prisma.groupCategory.update({
            where: { id },
            data: params
        });
    }

    async deleteCategory(id: string, tenantId: string): Promise<void> {
        const category = await prisma.groupCategory.findFirst({ where: { id, tenantId } });
        if (!category) throw new Error('Category not found');

        await prisma.groupCategory.delete({ where: { id } });
    }
}

export const groupCategoryService = GroupCategoryService.getInstance();
