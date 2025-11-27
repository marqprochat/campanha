"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationsController_1 = require("../controllers/notificationsController");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authMiddleware);
// GET /api/notifications - Get user notifications
router.get('/', notificationsController_1.getNotifications);
// GET /api/notifications/summary - Notifications summary
router.get('/summary', notificationsController_1.getNotificationsSummary);
// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', notificationsController_1.getUnreadCount);
// POST /api/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', notificationsController_1.markAllAsRead);
// POST /api/notifications/:id/mark-read - Mark notification as read
router.post('/:id/mark-read', notificationsController_1.markAsRead);
// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', notificationsController_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map