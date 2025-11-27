"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeIcon = exports.uploadIcon = exports.removeLogo = exports.removeFavicon = exports.uploadFavicon = exports.uploadLogo = exports.updateSettings = exports.getPublicSettings = exports.getSettings = exports.settingsValidation = void 0;
const express_validator_1 = require("express-validator");
const settingsService_1 = require("../services/settingsService");
const tenantSettingsService_1 = require("../services/tenantSettingsService");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tenantSettingsService = new tenantSettingsService_1.TenantSettingsService();
// Configuração do multer para upload de logos
const getUploadDir = () => {
    return process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads';
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = getUploadDir();
        // Garantir que o diretório existe
        if (!fs_1.default.existsSync(uploadDir)) {
            try {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            catch (err) {
                console.error('Erro ao criar diretório de uploads:', err);
                return cb(err, uploadDir);
            }
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const fileName = `logo_${Date.now()}${ext}`;
        cb(null, fileName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use JPEG, PNG, GIF, WebP ou ICO.`));
        }
    }
});
// Validation rules
exports.settingsValidation = [
    (0, express_validator_1.body)('wahaHost').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (!/^https?:\/\/.+/.test(value)) {
            throw new Error('Host WAHA deve ser uma URL válida');
        }
        return true;
    }),
    (0, express_validator_1.body)('wahaApiKey').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 10) {
            throw new Error('API Key deve ter pelo menos 10 caracteres');
        }
        return true;
    }),
    (0, express_validator_1.body)('companyName').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 1 || value.length > 100) {
            throw new Error('Nome da empresa deve ter entre 1 e 100 caracteres');
        }
        return true;
    }),
    (0, express_validator_1.body)('pageTitle').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 1 || value.length > 100) {
            throw new Error('Título da página deve ter entre 1 e 100 caracteres');
        }
        return true;
    }),
    (0, express_validator_1.body)('openaiApiKey').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 10) {
            throw new Error('API Key da OpenAI deve ter pelo menos 10 caracteres');
        }
        return true;
    }),
    (0, express_validator_1.body)('groqApiKey').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 10) {
            throw new Error('API Key da Groq deve ter pelo menos 10 caracteres');
        }
        return true;
    }),
    (0, express_validator_1.body)('evolutionHost').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (!/^https?:\/\/.+/.test(value)) {
            throw new Error('Host Evolution deve ser uma URL válida');
        }
        return true;
    }),
    (0, express_validator_1.body)('evolutionApiKey').optional().custom((value) => {
        if (!value || value === '')
            return true;
        if (value.length < 10) {
            throw new Error('API Key Evolution deve ter pelo menos 10 caracteres');
        }
        return true;
    })
];
// Get settings
const getSettings = async (req, res) => {
    try {
        // Buscar configurações globais
        const globalSettings = await settingsService_1.settingsService.getSettings();
        // Para configurações AI e Chatwoot, usar tenantId do usuário, ou parâmetro tenantId para SUPERADMIN
        let effectiveTenantId = req.tenantId;
        if (req.user?.role === 'SUPERADMIN') {
            // SUPERADMIN pode gerenciar configurações de qualquer tenant
            effectiveTenantId = req.query.tenantId || req.tenantId;
        }
        // Buscar configurações do tenant (APIs de IA e Chatwoot)
        let tenantSettings = null;
        if (effectiveTenantId) {
            try {
                tenantSettings = await tenantSettingsService.getTenantSettings(effectiveTenantId);
            }
            catch (error) {
                console.warn('Erro ao buscar configurações do tenant:', error);
            }
        }
        // Combinar as configurações (Quepasa é global, não por tenant)
        const combinedSettings = {
            ...globalSettings,
            openaiApiKey: tenantSettings?.openaiApiKey || null,
            groqApiKey: tenantSettings?.groqApiKey || null,
            chatwootUrl: tenantSettings?.chatwootUrl || null,
            chatwootAccountId: tenantSettings?.chatwootAccountId || null,
            chatwootApiToken: tenantSettings?.chatwootApiToken || null
        };
        res.json(combinedSettings);
    }
    catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getSettings = getSettings;
// Get public settings (favicon, page title, icon and company name, no auth required)
const getPublicSettings = async (req, res) => {
    try {
        const settings = await settingsService_1.settingsService.getSettings();
        res.json({
            faviconUrl: settings.faviconUrl,
            pageTitle: settings.pageTitle,
            iconUrl: settings.iconUrl,
            companyName: settings.companyName
        });
    }
    catch (error) {
        console.error('Erro ao buscar configurações públicas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.getPublicSettings = getPublicSettings;
// Update settings
const updateSettings = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { wahaHost, wahaApiKey, evolutionHost, evolutionApiKey, quepasaUrl, quepasaLogin, quepasaPassword, companyName, pageTitle, openaiApiKey, groqApiKey, chatwootUrl, chatwootAccountId, chatwootApiToken, tenantId } = req.body;
        // Atualizar configurações globais (WAHA, Evolution, Quepasa são globais)
        const globalSettings = await settingsService_1.settingsService.updateSettings({
            wahaHost,
            wahaApiKey,
            evolutionHost,
            evolutionApiKey,
            quepasaUrl,
            quepasaLogin,
            quepasaPassword,
            companyName,
            pageTitle
        });
        // Para configurações AI e Chatwoot, usar tenantId do usuário, ou parâmetro tenantId para SUPERADMIN
        let effectiveTenantId = req.tenantId;
        if (req.user?.role === 'SUPERADMIN') {
            // SUPERADMIN pode gerenciar configurações de qualquer tenant
            effectiveTenantId = tenantId || req.tenantId;
        }
        // Atualizar configurações do tenant (APIs de IA e Chatwoot)
        let tenantSettings = null;
        if (effectiveTenantId && (openaiApiKey !== undefined || groqApiKey !== undefined || chatwootUrl !== undefined || chatwootAccountId !== undefined || chatwootApiToken !== undefined)) {
            tenantSettings = await tenantSettingsService.updateTenantSettings(effectiveTenantId, {
                openaiApiKey,
                groqApiKey,
                chatwootUrl,
                chatwootAccountId,
                chatwootApiToken
            });
        }
        // Combinar as configurações para resposta
        const combinedSettings = {
            ...globalSettings,
            openaiApiKey: tenantSettings?.openaiApiKey || null,
            groqApiKey: tenantSettings?.groqApiKey || null,
            chatwootUrl: tenantSettings?.chatwootUrl || null,
            chatwootAccountId: tenantSettings?.chatwootAccountId || null,
            chatwootApiToken: tenantSettings?.chatwootApiToken || null
        };
        res.json({
            message: 'Configurações atualizadas com sucesso',
            settings: combinedSettings
        });
    }
    catch (error) {
        console.error('Erro ao atualizar configurações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.updateSettings = updateSettings;
// Upload logo
exports.uploadLogo = [
    upload.single('logo'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }
            console.log(`📸 Upload de logo iniciado: ${req.file.filename}`);
            // URL da logo (será servida estaticamente)
            const logoUrl = `/api/uploads/${req.file.filename}`;
            // Atualizar configurações com nova logo
            const settings = await settingsService_1.settingsService.updateSettings({
                logoUrl
            });
            console.log(`✅ Logo atualizada com sucesso: ${logoUrl}`);
            res.json({
                message: 'Logo carregada com sucesso',
                logoUrl,
                settings
            });
        }
        catch (error) {
            console.error('❌ Erro ao fazer upload da logo:', error instanceof Error ? error.message : error);
            // Remover arquivo se houve erro
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => {
                    if (err)
                        console.error('Erro ao remover arquivo:', err);
                });
            }
            res.status(500).json({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) });
        }
    }
];
// Upload favicon
exports.uploadFavicon = [
    upload.single('favicon'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }
            // URL do favicon (será servida estaticamente)
            const faviconUrl = `/api/uploads/${req.file.filename}`;
            // Atualizar configurações com novo favicon
            const settings = await settingsService_1.settingsService.updateSettings({
                faviconUrl
            });
            res.json({
                message: 'Favicon carregado com sucesso',
                faviconUrl,
                settings
            });
        }
        catch (error) {
            console.error('Erro ao fazer upload do favicon:', error);
            // Remover arquivo se houve erro
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => {
                    if (err)
                        console.error('Erro ao remover arquivo:', err);
                });
            }
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
];
// Remove favicon
const removeFavicon = async (req, res) => {
    try {
        const settings = await settingsService_1.settingsService.getSettings();
        if (settings.faviconUrl) {
            // Remover arquivo físico
            const filePath = path_1.default.join(getUploadDir(), path_1.default.basename(settings.faviconUrl.replace('/api/uploads/', '')));
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Atualizar configurações removendo favicon
        const updatedSettings = await settingsService_1.settingsService.updateSettings({
            faviconUrl: null
        });
        res.json({
            message: 'Favicon removido com sucesso',
            settings: updatedSettings
        });
    }
    catch (error) {
        console.error('Erro ao remover favicon:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.removeFavicon = removeFavicon;
// Remove logo
const removeLogo = async (req, res) => {
    try {
        const settings = await settingsService_1.settingsService.getSettings();
        if (settings.logoUrl) {
            // Remover arquivo físico
            const filePath = path_1.default.join(getUploadDir(), path_1.default.basename(settings.logoUrl.replace('/api/uploads/', '')));
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Atualizar configurações removendo logo
        const updatedSettings = await settingsService_1.settingsService.updateSettings({
            logoUrl: null
        });
        res.json({
            message: 'Logo removida com sucesso',
            settings: updatedSettings
        });
    }
    catch (error) {
        console.error('Erro ao remover logo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.removeLogo = removeLogo;
// Upload icon
exports.uploadIcon = [
    upload.single('icon'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }
            // URL do ícone (será servida estaticamente)
            const iconUrl = `/api/uploads/${req.file.filename}`;
            // Atualizar configurações com novo ícone
            const settings = await settingsService_1.settingsService.updateSettings({
                iconUrl
            });
            res.json({
                message: 'Ícone carregado com sucesso',
                iconUrl,
                settings
            });
        }
        catch (error) {
            console.error('Erro ao fazer upload do ícone:', error);
            // Remover arquivo se houve erro
            if (req.file) {
                fs_1.default.unlink(req.file.path, (err) => {
                    if (err)
                        console.error('Erro ao remover arquivo:', err);
                });
            }
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
];
// Remove icon
const removeIcon = async (req, res) => {
    try {
        const settings = await settingsService_1.settingsService.getSettings();
        if (settings.iconUrl) {
            // Remover arquivo físico
            const filePath = path_1.default.join(getUploadDir(), path_1.default.basename(settings.iconUrl.replace('/api/uploads/', '')));
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        // Atualizar configurações removendo ícone
        const updatedSettings = await settingsService_1.settingsService.updateSettings({
            iconUrl: null
        });
        res.json({
            message: 'Ícone removido com sucesso',
            settings: updatedSettings
        });
    }
    catch (error) {
        console.error('Erro ao remover ícone:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.removeIcon = removeIcon;
//# sourceMappingURL=settingsController.js.map