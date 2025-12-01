import * as fs from 'fs';
import csvParser from 'csv-parser';
import { ContactService } from './contactService';
import { ContactInput, ImportResult } from '../types';

interface CSVRow {
  nome?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  tags?: string;
  categoriaid?: string; // CSV parser converte para lowercase
}

export class CSVImportService {
  static async importContacts(filePath: string, tenantId: string, defaultCategoryId?: string): Promise<ImportResult> {
    const results: CSVRow[] = [];
    const errors: string[] = [];
    let successfulImports = 0;
    let failedImports = 0;

    // Validar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo CSV não encontrado: ${filePath}`);
      return {
        success: false,
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [`Arquivo não encontrado: ${filePath}`]
      };
    }

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .on('error', (error: any) => {
          console.error(`❌ Erro ao abrir arquivo CSV: ${filePath}`, error);
          resolve({
            success: false,
            totalRows: 0,
            successfulImports: 0,
            failedImports: 0,
            errors: [`Erro ao ler arquivo: ${error.message}`]
          });
        })
        .pipe(csvParser({
          mapHeaders: ({ header }: { header: string }) => header.toLowerCase().trim()
        }))
        .on('data', (data: CSVRow) => {
          results.push(data);
        })
        .on('end', async () => {
          console.log(`📊 CSVImportService - Processando ${results.length} linhas do CSV para tenantId: ${tenantId}`);
          if (defaultCategoryId) {
            console.log(`📂 Categoria padrão será aplicada a todos os contatos: ${defaultCategoryId}`);
          }

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
              const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [];

              // Aplicar categoria padrão se fornecida, caso contrário usar a do CSV
              const categoryToUse = defaultCategoryId || row.categoriaid?.trim() || undefined;

              const contactData: ContactInput = {
                nome: row.nome.trim(),
                telefone: row.telefone.trim(),
                email: row.email?.trim() || undefined,
                observacoes: row.observacoes?.trim() || undefined,
                tags: tags,
                categoriaId: categoryToUse,
                tenantId: tenantId
              };

              console.log(`🏷️ Linha ${rowNumber} - Tags extraídas:`, tags);
              console.log(`📂 Linha ${rowNumber} - CategoriaId aplicada:`, categoryToUse);
              if (defaultCategoryId && row.categoriaid) {
                console.log(`⚠️ Linha ${rowNumber} - Categoria do CSV (${row.categoriaid}) sobrescrita pela categoria padrão (${defaultCategoryId})`);
              }

              // Criar contato
              await ContactService.createContact(contactData);
              successfulImports++;
              console.log(`✅ Linha ${rowNumber} importada: ${contactData.nome} (tenant: ${tenantId})`);

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              errors.push(`Linha ${rowNumber}: ${errorMessage}`);
              failedImports++;
              console.log(`❌ Erro na linha ${rowNumber}: ${errorMessage}`);
            }
          }

          // Limpar arquivo temporário
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Arquivo temporário removido: ${filePath}`);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao limpar arquivo temporário:', error);
          }

          const result: ImportResult = {
            success: errors.length === 0,
            totalRows: results.length,
            successfulImports,
            failedImports,
            errors
          };

          console.log('📈 Resultado da importação:', result);
          resolve(result);
        })
        .on('error', (error: any) => {
          console.error('❌ Erro ao processar CSV com csv-parser:', error);
          reject(error);
        });
    });
  }
}