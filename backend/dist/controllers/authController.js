"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.getProfile = exports.register = exports.login = exports.authValidators = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'astra-online-secure-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const generateToken = (userId, email, role, tenantId) => {
    const payload = { userId, email, role, tenantId };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
const sanitizeUser = (user) => {
    const { senha, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.authValidators = {
    login: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('E-mail inválido')
            .normalizeEmail(),
        (0, express_validator_1.body)('senha')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter pelo menos 6 caracteres')
    ],
    register: [
        (0, express_validator_1.body)('nome')
            .isLength({ min: 2 })
            .withMessage('Nome deve ter pelo menos 2 caracteres')
            .trim(),
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('E-mail inválido')
            .normalizeEmail(),
        (0, express_validator_1.body)('senha')
            .isLength({ min: 6 })
            .withMessage('Senha deve ter pelo menos 6 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
        (0, express_validator_1.body)('role')
            .optional()
            .isIn(['ADMIN', 'USER'])
            .withMessage('Role deve ser ADMIN ou USER')
    ]
};
const login = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
            return;
        }
        const { email, senha } = req.body;
        // Buscar usuário por email com informações do tenant
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                tenant: {
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        active: true
                    }
                }
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
            return;
        }
        if (!user.ativo) {
            res.status(401).json({
                success: false,
                message: 'Usuário inativo. Entre em contato com o administrador.'
            });
            return;
        }
        // Verificar se o tenant está ativo (SUPERADMIN não tem tenant)
        if (user.tenant && !user.tenant.active) {
            res.status(401).json({
                success: false,
                message: 'Tenant inativo. Entre em contato com o suporte.'
            });
            return;
        }
        // Verificar senha
        const isPasswordValid = await bcryptjs_1.default.compare(senha, user.senha);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
            return;
        }
        // Atualizar último login
        await prisma.user.update({
            where: { id: user.id },
            data: { ultimoLogin: new Date() }
        });
        // Gerar token com tenantId (SUPERADMIN tem tenantId undefined)
        const token = generateToken(user.id, user.email, user.role, user.tenantId || undefined);
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: sanitizeUser(user)
            }
        });
    }
    catch (error) {
        console.error('❌ Erro no login:', error instanceof Error ? error.message : error);
        console.error('📋 Stack:', error instanceof Error ? error.stack : 'Sem stack');
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: errors.array()
            });
            return;
        }
        const { nome, email, senha, role = 'USER' } = req.body;
        // Para usuários não-SUPERADMIN, é obrigatório ter tenantId
        if (!req.user || (req.user.role !== 'SUPERADMIN' && !req.user.tenantId)) {
            res.status(401).json({
                success: false,
                message: 'Acesso negado. Contexto de tenant necessário.'
            });
            return;
        }
        // Verificar se o email já está em uso
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'E-mail já está em uso'
            });
            return;
        }
        // Hash da senha
        const hashedPassword = await bcryptjs_1.default.hash(senha, 12);
        // Determinar tenantId baseado no usuário criador
        let tenantId = null;
        if (req.user.role === 'SUPERADMIN') {
            // SUPERADMIN pode especificar tenant ou criar usuário sem tenant (outro SUPERADMIN)
            tenantId = req.body.tenantId || null;
        }
        else {
            // Usuários normais só podem criar usuários no seu próprio tenant
            tenantId = req.user.tenantId || null;
        }
        // Criar usuário
        const user = await prisma.user.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                role,
                tenantId
            }
        });
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: {
                user: sanitizeUser(user)
            }
        });
    }
    catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.register = register;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                tenant: {
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        active: true
                    }
                }
            }
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                user: sanitizeUser(user),
                tenant: user.tenant
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getProfile = getProfile;
const verifyToken = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: req.user
            }
        });
    }
    catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=authController.js.map