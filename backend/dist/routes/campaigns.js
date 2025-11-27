"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaignController_1 = require("../controllers/campaignController");
const auth_1 = require("../middleware/auth");
const quotaMiddleware_1 = require("../middleware/quotaMiddleware");
const router = (0, express_1.Router)();
// Campaign CRUD routes
router.get('/', auth_1.authMiddleware, campaignController_1.listCampaigns);
router.get('/tags', auth_1.authMiddleware, campaignController_1.getContactTags);
router.get('/sessions', auth_1.authMiddleware, campaignController_1.getActiveSessions);
router.get('/:id', auth_1.authMiddleware, campaignController_1.getCampaign);
router.get('/:id/report', auth_1.authMiddleware, campaignController_1.getCampaignReport);
router.get('/:id/report/download', auth_1.authMiddleware, campaignController_1.downloadCampaignReport);
router.post('/', auth_1.authMiddleware, campaignController_1.campaignValidation, quotaMiddleware_1.checkCampaignQuota, campaignController_1.createCampaign);
router.put('/:id', auth_1.authMiddleware, campaignController_1.updateCampaign);
router.delete('/:id', auth_1.authMiddleware, campaignController_1.deleteCampaign);
router.patch('/:id/toggle', auth_1.authMiddleware, campaignController_1.toggleCampaign);
exports.default = router;
//# sourceMappingURL=campaigns.js.map