"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const usersController_1 = require("../controllers/usersController");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authMiddleware);
// Get user statistics (for dashboard)
router.get('/stats', usersController_1.getUserStats);
// Get available tenants for user assignment (SUPERADMIN only)
router.get('/tenants', usersController_1.getAvailableTenants);
// Get all users globally (SUPERADMIN only - sem filtro de tenant)
router.get('/global', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve estar entre 1 e 100'),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('role').optional().isIn(['ADMIN', 'USER', 'SUPERADMIN']),
    (0, express_validator_1.query)('ativo').optional().isBoolean()
], usersController_1.getAllUsersGlobal);
// List users with filters and pagination
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
    (0, express_validator_1.query)('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('Tamanho da página deve estar entre 1 e 100'),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('role').optional().isIn(['ADMIN', 'USER', 'SUPERADMIN']),
    (0, express_validator_1.query)('tenantId').optional().isUUID(),
    (0, express_validator_1.query)('ativo').optional().isBoolean()
], usersController_1.getUsers);
// Get specific user
router.get('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID deve ser um UUID válido')
], usersController_1.getUser);
// Create new user
router.post('/', usersController_1.usersValidators.create, usersController_1.createUser);
// Update user
router.put('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID deve ser um UUID válido'),
    ...usersController_1.usersValidators.update
], usersController_1.updateUser);
// Delete user
router.delete('/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID deve ser um UUID válido')
], usersController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map