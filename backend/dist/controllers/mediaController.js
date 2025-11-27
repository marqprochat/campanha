"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMediaFile = exports.listMediaFiles = exports.uploadMediaFile = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configuração do multer para upload de arquivos de mídia
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = '/app/uploads';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const fileName = `media_${Date.now()}${ext}`;
        cb(null, fileName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            // Imagens
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            // Vídeos
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv',
            // Áudios
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a',
            // Documentos
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            // Arquivos compactados
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Tipos aceitos: imagens, vídeos, áudios, documentos e arquivos compactados.`));
        }
    }
});
// Upload de arquivo de mídia para campanhas
exports.uploadMediaFile = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }
            // URL pública do arquivo (será servida estaticamente)
            // Gerar URL completa para que o WAHA API possa acessar
            const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
            const host = req.get('Host') || 'work.trecofantastico.com.br';
            const fileUrl = `${protocol}://${host}/api/uploads/${req.file.filename}`;
            res.json({
                message: 'Arquivo carregado com sucesso',
                fileUrl,
                originalName: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
        }
        catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
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
// Listar arquivos de mídia
const listMediaFiles = async (req, res) => {
    try {
        const uploadDir = '/app/uploads';
        if (!fs_1.default.existsSync(uploadDir)) {
            return res.json({ files: [] });
        }
        const files = fs_1.default.readdirSync(uploadDir)
            .filter(file => file.startsWith('media_'))
            .map(filename => {
            const filePath = path_1.default.join(uploadDir, filename);
            const stats = fs_1.default.statSync(filePath);
            return {
                filename,
                url: `/api/uploads/${filename}`,
                size: stats.size,
                uploadedAt: stats.birthtime
            };
        })
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        res.json({ files });
    }
    catch (error) {
        console.error('Erro ao listar arquivos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.listMediaFiles = listMediaFiles;
// Deletar arquivo de mídia
const deleteMediaFile = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!filename || !filename.startsWith('media_')) {
            return res.status(400).json({ error: 'Nome de arquivo inválido' });
        }
        const filePath = path_1.default.join('/app/uploads', filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
        fs_1.default.unlinkSync(filePath);
        res.json({
            message: 'Arquivo removido com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao remover arquivo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.deleteMediaFile = deleteMediaFile;
//# sourceMappingURL=mediaController.js.map