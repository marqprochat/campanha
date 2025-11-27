"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatwootController_1 = require("../controllers/chatwootController");
const router = (0, express_1.Router)();
// GET /api/chatwoot/tags - Buscar tags do Chatwoot
router.get('/tags', chatwootController_1.getChatwootTags);
// POST /api/chatwoot/sync - Sincronizar contatos do Chatwoot
router.post('/sync', chatwootController_1.syncChatwootContacts);
exports.default = router;
//# sourceMappingURL=chatwootRoutes.js.map