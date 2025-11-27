"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.categoryRoutes = router;
// Apply authentication middleware to all category routes
router.use(auth_1.authMiddleware);
router.get('/', categoryController_1.CategoryController.getCategories);
router.get('/all', categoryController_1.CategoryController.getAllCategories);
router.get('/:id', categoryController_1.CategoryController.getCategoryById);
router.post('/', categoryController_1.CategoryController.createCategory);
router.put('/:id', categoryController_1.CategoryController.updateCategory);
router.delete('/:id', categoryController_1.CategoryController.deleteCategory);
//# sourceMappingURL=categoryRoutes.js.map