"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVImportController = exports.handleMulterError = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const csvImportService_1 = require("../services/csvImportService");
// Definir diretório temporário
// Em produção (Docker), usar /app/uploads; em desenvolvimento, usar ./uploads
const getTmpDir = () => {
    return process.env.NODE_ENV === 'production'
        ? '/app/uploads'
        : path.join(process.cwd(), 'uploads');
};
// Função auxiliar para criar diretório de forma segura
const ensureDirectoryExists = (dir) => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Diretório criado: ${dir}`);
        }
        return true;
    }
    catch (error) {
        console.error(`⚠️ Erro ao criar diretório ${dir}: ${error instanceof Error ? error.message : error}`);
        return false;
    }
};
// Configurar multer para upload de arquivos
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tmpDir = getTmpDir();
        // Garantir que o diretório existe antes de salvar
        if (ensureDirectoryExists(tmpDir)) {
            cb(null, tmpDir);
        }
        else {
            cb(new Error(`Não foi possível acessar diretório: ${tmpDir}`), tmpDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'import-' + uniqueSuffix + path.extname(file.originalname);
        console.log(`📄 Arquivo CSV será salvo como: ${filename}`);
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/csv' ||
        path.extname(file.originalname).toLowerCase() === '.csv') {
        cb(null, true);
    }
    else {
        cb(new Error('Apenas arquivos CSV são permitidos'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});
// Middleware para capturar erros do multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        console.error('❌ Erro do Multer - Código:', err.code);
        console.error('❌ Erro do Multer - Mensagem:', err.message);
        let message = err.message;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Arquivo muito grande. Máximo permitido: 5MB';
        }
        else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Apenas um arquivo é permitido por vez';
        }
        return res.status(400).json({
            error: `Erro ao fazer upload: ${message}`,
            code: err.code
        });
    }
    else if (err) {
        console.error('❌ Erro no upload:', err.message);
        return res.status(400).json({
            error: err.message || 'Erro ao fazer upload do arquivo'
        });
    }
    next();
};
exports.handleMulterError = handleMulterError;
class CSVImportController {
    static async importContacts(req, res) {
        try {
            if (!req.file) {
                const apiError = {
                    error: 'Nenhum arquivo foi enviado'
                };
                return res.status(400).json(apiError);
            }
            // Obter tenantId da requisição autenticada
            const tenantId = req.tenantId;
            if (!tenantId) {
                const apiError = {
                    error: 'Tenant não identificado. Verifique se seu usuário está associado a um tenant.'
                };
                return res.status(403).json(apiError);
            }
            // Obter categoryId opcional do corpo da requisição
            const categoryId = req.body.categoryId;
            console.log('📤 Upload recebido:', req.file.originalname, req.file.filename, 'tenantId:', tenantId);
            if (categoryId) {
                console.log('📂 Categoria padrão selecionada:', categoryId);
            }
            const result = await csvImportService_1.CSVImportService.importContacts(req.file.path, tenantId, categoryId);
            if (result.success) {
                res.json({
                    message: 'Importação concluída com sucesso',
                    ...result
                });
            }
            else {
                res.status(207).json({
                    message: 'Importação concluída com alguns erros',
                    ...result
                });
            }
        }
        catch (error) {
            console.error('❌ Erro na importação CSV:', error);
            const apiError = {
                error: 'Erro ao processar arquivo CSV',
                details: error instanceof Error ? error.message : error
            };
            res.status(500).json(apiError);
        }
    }
    static async downloadTemplate(req, res) {
        try {
            // CSV template com cabeçalhos em português
            const csvTemplate = `nome,telefone,email,observacoes,categoriaId
João Silva,+5511999999999,joao@email.com,Cliente desde 2020,550e8400-e29b-41d4-a716-446655440000
Maria Santos,+5511888888888,maria@email.com,Fornecedor de materiais,550e8400-e29b-41d4-a716-446655440001
Pedro Oliveira,+5511777777777,pedro@email.com,,
Ana Costa,+5511666666666,ana@email.com,Parceiro estratégico,550e8400-e29b-41d4-a716-446655440000`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="template-contatos.csv"');
            res.send(csvTemplate);
        }
        catch (error) {
            console.error('❌ Erro ao gerar template:', error);
            const apiError = {
                error: 'Erro ao gerar template CSV'
            };
            res.status(500).json(apiError);
        }
    }
}
exports.CSVImportController = CSVImportController;
//# sourceMappingURL=csvImportController.js.map