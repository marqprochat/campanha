"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mediaController_1 = require("../controllers/mediaController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas de mídia requerem autenticação
router.use(auth_1.authMiddleware);
// POST /api/media/upload - Upload de arquivo de mídia
router.post('/upload', mediaController_1.uploadMediaFile);
// GET /api/media - Listar arquivos de mídia
router.get('/', mediaController_1.listMediaFiles);
// DELETE /api/media/:filename - Deletar arquivo de mídia
router.delete('/:filename', mediaController_1.deleteMediaFile);
exports.default = router;
//# sourceMappingURL=mediaRoutes.js.map