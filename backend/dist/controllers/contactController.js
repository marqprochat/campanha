"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const express_validator_1 = require("express-validator");
const contactService_1 = require("../services/contactService");
class ContactController {
    static async getContacts(req, res) {
        try {
            const { search, tag, page = '1', pageSize = '30' } = req.query;
            // Sempre usar tenantId do token
            const tenantId = req.tenantId;
            const result = await contactService_1.ContactService.getContacts(search, parseInt(page), parseInt(pageSize), tenantId, tag);
            res.json(result);
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao buscar contatos',
                details: error instanceof Error ? error.message : error
            };
            res.status(500).json(apiError);
        }
    }
    static async getContactById(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId;
            const contact = await contactService_1.ContactService.getContactById(id, tenantId);
            res.json(contact);
        }
        catch (error) {
            const apiError = {
                error: 'Contato não encontrado',
                details: error instanceof Error ? error.message : error
            };
            res.status(404).json(apiError);
        }
    }
    static async createContact(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const apiError = {
                    error: 'Dados inválidos',
                    details: errors.array()
                };
                return res.status(400).json(apiError);
            }
            // Usar tenantId do token
            const tenantId = req.tenantId;
            const contactData = { ...req.body, tenantId };
            const contact = await contactService_1.ContactService.createContact(contactData);
            res.status(201).json(contact);
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao criar contato',
                details: error instanceof Error ? error.message : error
            };
            res.status(400).json(apiError);
        }
    }
    static async updateContact(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const apiError = {
                    error: 'Dados inválidos',
                    details: errors.array()
                };
                return res.status(400).json(apiError);
            }
            const { id } = req.params;
            const tenantId = req.tenantId;
            const contact = await contactService_1.ContactService.updateContact(id, req.body, tenantId);
            res.json(contact);
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao atualizar contato',
                details: error instanceof Error ? error.message : error
            };
            res.status(400).json(apiError);
        }
    }
    static async deleteContact(req, res) {
        try {
            const { id } = req.params;
            const tenantId = req.tenantId;
            await contactService_1.ContactService.deleteContact(id, tenantId);
            res.status(204).send();
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao excluir contato',
                details: error instanceof Error ? error.message : error
            };
            res.status(400).json(apiError);
        }
    }
    static async bulkUpdateContacts(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const apiError = {
                    error: 'Dados inválidos',
                    details: errors.array()
                };
                return res.status(400).json(apiError);
            }
            const { contactIds, updates } = req.body;
            const tenantId = req.tenantId;
            if (!Array.isArray(contactIds) || contactIds.length === 0) {
                const apiError = {
                    error: 'IDs de contatos são obrigatórios',
                    details: 'Forneça um array de IDs'
                };
                return res.status(400).json(apiError);
            }
            const result = await contactService_1.ContactService.bulkUpdateContacts(contactIds, updates, tenantId);
            res.json(result);
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao atualizar contatos em massa',
                details: error instanceof Error ? error.message : error
            };
            res.status(400).json(apiError);
        }
    }
    static async bulkDeleteContacts(req, res) {
        try {
            const { contactIds } = req.body;
            const tenantId = req.tenantId;
            if (!Array.isArray(contactIds) || contactIds.length === 0) {
                const apiError = {
                    error: 'IDs de contatos são obrigatórios',
                    details: 'Forneça um array de IDs'
                };
                return res.status(400).json(apiError);
            }
            const result = await contactService_1.ContactService.bulkDeleteContacts(contactIds, tenantId);
            res.json(result);
        }
        catch (error) {
            const apiError = {
                error: 'Erro ao excluir contatos em massa',
                details: error instanceof Error ? error.message : error
            };
            res.status(400).json(apiError);
        }
    }
}
exports.ContactController = ContactController;
//# sourceMappingURL=contactController.js.map