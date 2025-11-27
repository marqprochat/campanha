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
exports.CSVImportService = void 0;
const fs = __importStar(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const contactService_1 = require("./contactService");
class CSVImportService {
    static async importContacts(filePath, tenantId) {
        const results = [];
        const errors = [];
        let successfulImports = 0;
        let failedImports = 0;
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)({
                mapHeaders: ({ header }) => header.toLowerCase().trim()
            }))
                .on('data', (data) => {
                results.push(data);
            })
                .on('end', async () => {
                console.log(`📊 CSVImportService - Processando ${results.length} linhas do CSV para tenantId: ${tenantId}`);
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNumber = i + 2; // +2 porque CSV tem header e arrays começam em 0
                    console.log(`🔍 Linha ${rowNumber} - Dados parseados:`, JSON.stringify(row));
                    console.log(`📋 Headers disponíveis:`, Object.keys(row));
                    try {
                        // Validar campos obrigatórios
                        if (!row.nome || !row.telefone) {
                            console.log(`❌ Linha ${rowNumber} - nome: "${row.nome}", telefone: "${row.telefone}"`);
                            errors.push(`Linha ${rowNumber}: Nome e telefone são obrigatórios`);
                            failedImports++;
                            continue;
                        }
                        // Preparar dados do contato incluindo tenantId
                        const tags = row.tags ? row.tags.split(',').map((tag) => tag.trim()) : [];
                        const contactData = {
                            nome: row.nome.trim(),
                            telefone: row.telefone.trim(),
                            email: row.email?.trim() || undefined,
                            observacoes: row.observacoes?.trim() || undefined,
                            tags: tags,
                            categoriaId: row.categoriaid?.trim() || undefined,
                            tenantId: tenantId
                        };
                        console.log(`🏷️ Linha ${rowNumber} - Tags extraídas:`, tags);
                        console.log(`📂 Linha ${rowNumber} - CategoriaId:`, row.categoriaid);
                        // Criar contato
                        await contactService_1.ContactService.createContact(contactData);
                        successfulImports++;
                        console.log(`✅ Linha ${rowNumber} importada: ${contactData.nome} (tenant: ${tenantId})`);
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                        errors.push(`Linha ${rowNumber}: ${errorMessage}`);
                        failedImports++;
                        console.log(`❌ Erro na linha ${rowNumber}: ${errorMessage}`);
                    }
                }
                // Limpar arquivo temporário
                try {
                    fs.unlinkSync(filePath);
                }
                catch (error) {
                    console.warn('Erro ao limpar arquivo temporário:', error);
                }
                const result = {
                    success: errors.length === 0,
                    totalRows: results.length,
                    successfulImports,
                    failedImports,
                    errors
                };
                console.log('📈 Resultado da importação:', result);
                resolve(result);
            })
                .on('error', (error) => {
                console.error('❌ Erro ao processar CSV:', error);
                reject(error);
            });
        });
    }
}
exports.CSVImportService = CSVImportService;
//# sourceMappingURL=csvImportService.js.map