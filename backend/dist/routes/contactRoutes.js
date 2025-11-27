"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const contactController_1 = require("../controllers/contactController");
const quotaMiddleware_1 = require("../middleware/quotaMiddleware");
const router = (0, express_1.Router)();
exports.contactRoutes = router;
const contactValidation = [
    (0, express_validator_1.body)('nome').notEmpty().withMessage('Nome é obrigatório'),
    (0, express_validator_1.body)('telefone').notEmpty().withMessage('Telefone é obrigatório'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Email deve ter formato válido'),
    (0, express_validator_1.body)('tags').optional().isArray().withMessage('Tags deve ser um array'),
    (0, express_validator_1.body)('observacoes').optional().isString(),
    (0, express_validator_1.body)('categoriaId').optional().isString().withMessage('CategoriaId deve ser uma string')
];
router.get('/', contactController_1.ContactController.getContacts);
router.get('/:id', contactController_1.ContactController.getContactById);
router.post('/', contactValidation, quotaMiddleware_1.checkContactQuota, contactController_1.ContactController.createContact);
router.put('/:id', contactValidation, contactController_1.ContactController.updateContact);
router.delete('/:id', contactController_1.ContactController.deleteContact);
// Bulk operations
router.post('/bulk/update', contactController_1.ContactController.bulkUpdateContacts);
router.post('/bulk/delete', contactController_1.ContactController.bulkDeleteContacts);
//# sourceMappingURL=contactRoutes.js.map