"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvImportRoutes = void 0;
const express_1 = require("express");
const csvImportController_1 = require("../controllers/csvImportController");
const router = (0, express_1.Router)();
exports.csvImportRoutes = router;
// Rota para importar contatos via CSV
// O handleMulterError captura erros do multer (arquivo corrompido, tipo inválido, etc)
router.post('/import', csvImportController_1.upload.single('csv'), csvImportController_1.handleMulterError, csvImportController_1.CSVImportController.importContacts);
// Rota para baixar template CSV
router.get('/template', csvImportController_1.CSVImportController.downloadTemplate);
//# sourceMappingURL=csvImportRoutes.js.map