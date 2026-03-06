import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { settingsService } from '../services/settingsService';
import { TenantSettingsService } from '../services/tenantSettingsService';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const tenantSettingsService = new TenantSettingsService();

// Configuração do multer para upload de logos
const getUploadDir = () => {
  return process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();

    // Garantir que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Erro ao criar diretório de uploads:', err);
        return cb(err as any, uploadDir);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `logo_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use JPEG, PNG, GIF, WebP ou ICO.`));
    }
  }
});

// Validation rules
export const settingsValidation = [
  body('wahaHost').optional().custom((value) => {
    if (!value || value === '') return true;
    if (!/^https?:\/\/.+/.test(value)) {
      throw new Error('Host WAHA deve ser uma URL válida');
    }
    return true;
  }),
  body('wahaApiKey').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 10) {
      throw new Error('API Key deve ter pelo menos 10 caracteres');
    }
    return true;
  }),
  body('companyName').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 1 || value.length > 100) {
      throw new Error('Nome da empresa deve ter entre 1 e 100 caracteres');
    }
    return true;
  }),
  body('pageTitle').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 1 || value.length > 100) {
      throw new Error('Título da página deve ter entre 1 e 100 caracteres');
    }
    return true;
  }),
  body('openaiApiKey').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 10) {
      throw new Error('API Key da OpenAI deve ter pelo menos 10 caracteres');
    }
    return true;
  }),
  body('groqApiKey').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 10) {
      throw new Error('API Key da Groq deve ter pelo menos 10 caracteres');
    }
    return true;
  }),
  body('evolutionHost').optional().custom((value) => {
    if (!value || value === '') return true;
    if (!/^https?:\/\/.+/.test(value)) {
      throw new Error('Host Evolution deve ser uma URL válida');
    }
    return true;
  }),
  body('evolutionApiKey').optional().custom((value) => {
    if (!value || value === '') return true;
    if (value.length < 10) {
      throw new Error('API Key Evolution deve ter pelo menos 10 caracteres');
    }
    return true;
  })
];

// Get settings
export const getSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Buscar configurações globais
    const globalSettings = await settingsService.getSettings();

    // Para configurações AI e Chatwoot, usar tenantId do usuário, ou parâmetro tenantId para SUPERADMIN
    let effectiveTenantId = req.tenantId;
    if (req.user?.role === 'SUPERADMIN') {
      // SUPERADMIN pode gerenciar configurações de qualquer tenant
      effectiveTenantId = (req.query.tenantId as string) || req.tenantId;
    }

    // Buscar configurações do tenant (APIs de IA e Chatwoot)
    let tenantSettings = null;
    if (effectiveTenantId) {
      try {
        tenantSettings = await tenantSettingsService.getTenantSettings(effectiveTenantId);
      } catch (error) {
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
      chatwootApiToken: tenantSettings?.chatwootApiToken || null,
      microlinkApiKey: tenantSettings?.microlinkApiKey || null
    };

    res.json(combinedSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get public settings (favicon, page title, icon and company name, no auth required)
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings() as any;
    res.json({
      faviconUrl: settings.faviconUrl,
      pageTitle: settings.pageTitle,
      iconUrl: settings.iconUrl,
      companyName: settings.companyName,
      primaryColor: settings.primaryColor || '#21975f',
      logoUrl: settings.logoUrl
    });
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get public metadata for crawlers (WhatsApp, Facebook, etc.)
export const getMetadata = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings() as any;
    const title = settings.pageTitle || 'Sistema de Gestão';
    const description = settings.companyName || 'Sistema de Gestão de Contatos';
    // Ensure absolute URLs if possible, or relative to the request host
    // Assuming uploads are served from /api/uploads, we need the full URL
    // In many cases, crawlers need absolute URLs. We try to construct it.
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const logoUrl = settings.logoUrl
      ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `${baseUrl}${settings.logoUrl}`)
      : `${baseUrl}/api/uploads/default_icon.png`; // Fallback image

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${baseUrl}/">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${logoUrl}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${baseUrl}/">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${logoUrl}">
    
    <!-- Redirect users to the main app if they somehow land here directly -->
    <meta http-equiv="refresh" content="0;url=/">
</head>
<body>
    <script>window.location.href = '/';</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Erro ao gerar metadados:', error);
    res.status(500).send('Erro interno do servidor');
  }
};

// Update settings
export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { wahaHost, wahaApiKey, evolutionHost, evolutionApiKey, quepasaUrl, quepasaLogin, quepasaPassword, companyName, pageTitle, openaiApiKey, groqApiKey, chatwootUrl, chatwootAccountId, chatwootApiToken, microlinkApiKey, tenantId, primaryColor, asaasApiKey, asaasWebhookToken, asaasSandbox, asaasBillingType, asaasFineValue, asaasInterestValue, asaasDaysBeforeDueDate } = req.body;

    // Atualizar configurações globais (WAHA, Evolution, Quepasa, Asaas são globais)
    const globalSettings = await settingsService.updateSettings({
      wahaHost,
      wahaApiKey,
      evolutionHost,
      evolutionApiKey,
      quepasaUrl,
      quepasaLogin,
      quepasaPassword,
      companyName,
      pageTitle,
      primaryColor,
      asaasApiKey,
      asaasWebhookToken,
      asaasSandbox,
      asaasBillingType,
      asaasFineValue: asaasFineValue !== undefined ? Number(asaasFineValue) : undefined,
      asaasInterestValue: asaasInterestValue !== undefined ? Number(asaasInterestValue) : undefined,
      asaasDaysBeforeDueDate: asaasDaysBeforeDueDate !== undefined ? Number(asaasDaysBeforeDueDate) : undefined,
    });

    // Para configurações AI e Chatwoot, usar tenantId do usuário, ou parâmetro tenantId para SUPERADMIN
    let effectiveTenantId = req.tenantId;
    if (req.user?.role === 'SUPERADMIN') {
      // SUPERADMIN pode gerenciar configurações de qualquer tenant
      effectiveTenantId = tenantId || req.tenantId;
    }

    // Atualizar configurações do tenant (APIs de IA e Chatwoot)
    let tenantSettings = null;
    if (effectiveTenantId && (openaiApiKey !== undefined || groqApiKey !== undefined || chatwootUrl !== undefined || chatwootAccountId !== undefined || chatwootApiToken !== undefined || microlinkApiKey !== undefined)) {
      tenantSettings = await tenantSettingsService.updateTenantSettings(effectiveTenantId, {
        openaiApiKey,
        groqApiKey,
        chatwootUrl,
        chatwootAccountId,
        chatwootApiToken,
        microlinkApiKey
      });
    }

    // Combinar as configurações para resposta
    const combinedSettings = {
      ...globalSettings,
      openaiApiKey: tenantSettings?.openaiApiKey || null,
      groqApiKey: tenantSettings?.groqApiKey || null,
      chatwootUrl: tenantSettings?.chatwootUrl || null,
      chatwootAccountId: tenantSettings?.chatwootAccountId || null,
      chatwootApiToken: tenantSettings?.chatwootApiToken || null,
      microlinkApiKey: tenantSettings?.microlinkApiKey || null
    };

    res.json({
      message: 'Configurações atualizadas com sucesso',
      settings: combinedSettings
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload logo
export const uploadLogo = [
  upload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      console.log(`📸 Upload de logo iniciado: ${req.file.filename}`);

      // URL da logo (será servida estaticamente)
      const logoUrl = `/api/uploads/${req.file.filename}`;

      // Atualizar configurações com nova logo
      const settings = await settingsService.updateSettings({
        logoUrl
      });

      console.log(`✅ Logo atualizada com sucesso: ${logoUrl}`);

      res.json({
        message: 'Logo carregada com sucesso',
        logoUrl,
        settings
      });
    } catch (error) {
      console.error('❌ Erro ao fazer upload da logo:', error instanceof Error ? error.message : error);

      // Remover arquivo se houve erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao remover arquivo:', err);
        });
      }

      res.status(500).json({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) });
    }
  }
];

// Upload favicon
export const uploadFavicon = [
  upload.single('favicon'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // URL do favicon (será servida estaticamente)
      const faviconUrl = `/api/uploads/${req.file.filename}`;

      // Atualizar configurações com novo favicon
      const settings = await settingsService.updateSettings({
        faviconUrl
      });

      res.json({
        message: 'Favicon carregado com sucesso',
        faviconUrl,
        settings
      });
    } catch (error) {
      console.error('Erro ao fazer upload do favicon:', error);

      // Remover arquivo se houve erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao remover arquivo:', err);
        });
      }

      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
];

// Remove favicon
export const removeFavicon = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();

    if (settings.faviconUrl) {
      // Remover arquivo físico
      const filePath = path.join(getUploadDir(), path.basename(settings.faviconUrl.replace('/api/uploads/', '')));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Atualizar configurações removendo favicon
    const updatedSettings = await settingsService.updateSettings({
      faviconUrl: null
    });

    res.json({
      message: 'Favicon removido com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao remover favicon:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remove logo
export const removeLogo = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();

    if (settings.logoUrl) {
      // Remover arquivo físico
      const filePath = path.join(getUploadDir(), path.basename(settings.logoUrl.replace('/api/uploads/', '')));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Atualizar configurações removendo logo
    const updatedSettings = await settingsService.updateSettings({
      logoUrl: null
    });

    res.json({
      message: 'Logo removida com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao remover logo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload icon
export const uploadIcon = [
  upload.single('icon'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // URL do ícone (será servida estaticamente)
      const iconUrl = `/api/uploads/${req.file.filename}`;

      // Atualizar configurações com novo ícone
      const settings = await settingsService.updateSettings({
        iconUrl
      });

      res.json({
        message: 'Ícone carregado com sucesso',
        iconUrl,
        settings
      });
    } catch (error) {
      console.error('Erro ao fazer upload do ícone:', error);

      // Remover arquivo se houve erro
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Erro ao remover arquivo:', err);
        });
      }

      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
];

// Remove icon
export const removeIcon = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();

    if (settings.iconUrl) {
      // Remover arquivo físico
      const filePath = path.join(getUploadDir(), path.basename(settings.iconUrl.replace('/api/uploads/', '')));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Atualizar configurações removendo ícone
    const updatedSettings = await settingsService.updateSettings({
      iconUrl: null
    });

    res.json({
      message: 'Ícone removido com sucesso',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Erro ao remover ícone:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
