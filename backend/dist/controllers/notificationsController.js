"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsSummary = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// GET /api/notifications - Get user notifications
const getNotifications = async (req, res) => {
    try {
        const { page = '1', limit = '20', read, method } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        let where = {
            userId: req.user?.id
        };
        // Apply filters
        if (read !== undefined && read !== 'all') {
            where.read = read === 'true';
        }
        if (method && method !== 'all') {
            where.method = method;
        }
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                include: {
                    alert: {
                        include: {
                            tenant: {
                                select: { id: true, name: true, slug: true }
                            }
                        }
                    }
                },
                orderBy: [
                    { read: 'asc' },
                    { createdAt: 'desc' }
                ],
                skip: offset,
                take: limitNum
            }),
            prisma.notification.count({ where })
        ]);
        const totalPages = Math.ceil(total / limitNum);
        res.json({
            notifications,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: total,
                itemsPerPage: limitNum,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getNotifications = getNotifications;
// GET /api/notifications/unread-count - Get unread notifications count
const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user?.id,
                read: false
            }
        });
        res.json({ unreadCount });
    }
    catch (error) {
        console.error('Erro ao buscar contagem de não lidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getUnreadCount = getUnreadCount;
// POST /api/notifications/:id/mark-read - Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { userId: true, read: true }
        });
        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }
        if (notification.userId !== req.user?.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        if (notification.read) {
            return res.json({ message: 'Notificação já foi marcada como lida' });
        }
        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: {
                read: true,
                readAt: new Date()
            },
            include: {
                alert: {
                    include: {
                        tenant: {
                            select: { id: true, name: true, slug: true }
                        }
                    }
                }
            }
        });
        res.json(updatedNotification);
    }
    catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.markAsRead = markAsRead;
// POST /api/notifications/mark-all-read - Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const result = await prisma.notification.updateMany({
            where: {
                userId: req.user?.id,
                read: false
            },
            data: {
                read: true,
                readAt: new Date()
            }
        });
        res.json({ message: `${result.count} notificações marcadas como lidas` });
    }
    catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.markAllAsRead = markAllAsRead;
// DELETE /api/notifications/:id - Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id },
            select: { userId: true }
        });
        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }
        if (notification.userId !== req.user?.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        await prisma.notification.delete({
            where: { id }
        });
        res.json({ message: 'Notificação excluída com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir notificação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.deleteNotification = deleteNotification;
// GET /api/notifications/summary - Notifications summary
const getNotificationsSummary = async (req, res) => {
    try {
        const [totalNotifications, unreadNotifications, recentNotifications] = await Promise.all([
            prisma.notification.count({
                where: { userId: req.user?.id }
            }),
            prisma.notification.count({
                where: {
                    userId: req.user?.id,
                    read: false
                }
            }),
            prisma.notification.findMany({
                where: { userId: req.user?.id },
                include: {
                    alert: {
                        select: {
                            type: true,
                            severity: true,
                            title: true,
                            message: true,
                            tenant: {
                                select: { name: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);
        res.json({
            summary: {
                total: totalNotifications,
                unread: unreadNotifications,
                read: totalNotifications - unreadNotifications
            },
            recent: recentNotifications
        });
    }
    catch (error) {
        console.error('Erro ao buscar resumo de notificações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getNotificationsSummary = getNotificationsSummary;
//# sourceMappingURL=notificationsController.js.map