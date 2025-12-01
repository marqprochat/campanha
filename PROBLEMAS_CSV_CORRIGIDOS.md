# 🔧 Problemas de Importação CSV - Análise e Correções

## 📋 Resumo do Problema

**Erro:** 502 Bad Gateway ao importar CSV em produção via Docker
**Causa Raiz:** Múltiplos problemas de configuração e tratamento de erros

---

## 🔴 Problemas Identificados e Corrigidos

### 1. **Diretório Temporário em Local Incorreto**

**Problema:**
```typescript
// ❌ ANTES - Errado em Docker
const tmpDir = path.join(process.cwd(), 'tmp', 'uploads');
```

Em Docker, `process.cwd()` aponta para `/app`, criando `/app/tmp/uploads` que:
- Não é um volume persistente
- Não tem permissões corretas
- É apagada em restarts

**Solução:**
```typescript
// ✅ DEPOIS - Correto em Docker
const tmpDir = process.env.NODE_ENV === 'production' 
  ? '/app/uploads/csv-temp'
  : path.join(process.cwd(), 'uploads', 'csv-temp');
```

**Arquivo modificado:** `backend/src/controllers/csvImportController.ts`

---

### 2. **Falta de Validação de Existência do Arquivo**

**Problema:**
O `csv-parser` tenta ler um arquivo que pode não ter sido salvo corretamente, causando stream error silencioso.

**Solução:**
```typescript
// Validar se arquivo existe antes de processar
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
```

**Arquivo modificado:** `backend/src/services/csvImportService.ts`

---

### 3. **Falta de Tratamento de Erro de Stream**

**Problema:**
O stream de leitura do arquivo não tinha tratamento de erro.

**Solução:**
```typescript
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
  .pipe(csvParser(...))
```

**Arquivo modificado:** `backend/src/services/csvImportService.ts`

---

### 4. **Dockerfile sem Criação dos Diretórios Necessários**

**Problema:**
```dockerfile
# ❌ ANTES - Diretório csv-temp não criado
RUN mkdir -p /app/data /app/uploads /app/backups
```

**Solução:**
```dockerfile
# ✅ DEPOIS - Incluindo csv-temp
RUN mkdir -p /app/data /app/uploads /app/uploads/csv-temp /app/backups
```

**Arquivo modificado:** `backend/Dockerfile`

---

### 5. **Script Start.sh sem Garantir Diretórios**

**Problema:**
O script não verificava se os diretórios existiam ao iniciar.

**Solução:**
```bash
# Criar diretórios necessários
echo "📁 Creating necessary directories..."
mkdir -p /app/uploads /app/uploads/csv-temp /app/data /app/backups 2>/dev/null || true
```

**Arquivo modificado:** `backend/start.sh`

---

### 6. **Erro do Multer sem Mensagens Detalhadas**

**Problema:**
```typescript
// ❌ ANTES - Pouca informação de erro
if (err instanceof multer.MulterError) {
  console.error('❌ Erro do Multer:', err.code, err.message);
  return res.status(400).json({ error: `Erro ao fazer upload: ${err.message}` });
}
```

**Solução:**
```typescript
// ✅ DEPOIS - Melhor tratamento
if (err instanceof multer.MulterError) {
  console.error('❌ Erro do Multer - Código:', err.code);
  console.error('❌ Erro do Multer - Mensagem:', err.message);
  
  let message = err.message;
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Arquivo muito grande. Máximo permitido: 5MB';
  }
  // ... mais casos
  return res.status(400).json({ error: `Erro ao fazer upload: ${message}`, code: err.code });
}
```

**Arquivo modificado:** `backend/src/controllers/csvImportController.ts`

---

## 📦 Verificação de Dependências

As dependências necessárias **já estão instaladas** em `backend/package.json`:

✅ `csv-parser`: ^3.2.0 - Para parsing de CSV
✅ `multer`: ^1.4.5-lts.1 - Para upload de arquivos
✅ `@prisma/client`: ^5.7.1 - Para persistência
✅ `postgresql`: Volume em Docker Compose

---

## 🚀 Próximos Passos em Produção

### 1. **Reconstruir a imagem Docker**
```bash
docker compose down
docker compose up --build -d
```

### 2. **Verificar se diretórios foram criados**
```bash
docker exec astra_backend ls -la /app/uploads/
# Deve mostrar: csv-temp
```

### 3. **Testar importação de CSV**
- Acessar o frontend
- Ir para a seção de importação
- Enviar um arquivo CSV pequeno
- Verificar logs: `docker logs astra_backend -f`

### 4. **Logs a procurar (sucesso)**
```
✅ Diretório de uploads CSV criado: /app/uploads/csv-temp
📄 Arquivo CSV será salvo como: import-1234567890-123456789.csv
📊 CSVImportService - Processando X linhas do CSV para tenantId: xxx
✅ Linha 2 importada: João Silva (tenant: xxx)
📈 Resultado da importação: { success: true, totalRows: 1, successfulImports: 1, ... }
```

### 5. **Logs a procurar (erros)**
Se ainda houver erro, procure por:
```
❌ Arquivo CSV não encontrado:
❌ Erro ao abrir arquivo CSV:
❌ Erro ao criar diretório durante upload:
```

---

## 📝 Arquivos Modificados

1. ✅ `backend/src/controllers/csvImportController.ts` - Corrigir diretório temporário e melhorar erro
2. ✅ `backend/src/services/csvImportService.ts` - Adicionar validações de arquivo
3. ✅ `backend/Dockerfile` - Incluir diretório csv-temp
4. ✅ `backend/start.sh` - Garantir criação de diretórios

---

## 🔍 Teste de Validação

Para testar localmente antes de aplicar em produção:

```bash
# 1. Reconstruir backend
cd backend
npm run build
cd ..

# 2. Iniciar Docker
docker compose up --build -d

# 3. Verificar logs
docker compose logs -f backend

# 4. Criar um CSV de teste
cat > test.csv << 'EOF'
nome,telefone,email,observacoes,categoriaId
João Silva,+5511999999999,joao@email.com,Teste,
Maria Santos,+5511888888888,maria@email.com,Teste,
EOF

# 5. Fazer curl test (após obter token)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csv=@test.csv" \
  http://localhost:3001/api/csv/import
```

---

## ⚠️ Observações Importantes

1. **Volume persistente:** O `docker-compose.yml` já tem `uploads_data:/app/uploads` configurado, então arquivos são preservados em restarts.

2. **Permissões:** O usuário `nodejs` tem permissões completas em `/app/uploads` graças ao Dockerfile.

3. **Limpeza de arquivos:** Os arquivos CSV são removidos após importação, evitando acúmulo.

4. **Espaço em disco:** Monitorar `/app/uploads` para evitar preenchimento de espaço em produção.

---

## 📞 Se Ainda Houver Problemas

1. Verificar se o banco de dados está acessível: 
   ```bash
   docker exec astra_shared_postgres psql -U postgres -d contacts -c "SELECT 1"
   ```

2. Verificar espaço em disco do container:
   ```bash
   docker exec astra_backend df -h /app/uploads
   ```

3. Verificar permissões:
   ```bash
   docker exec astra_backend ls -la /app/uploads/
   ```

4. Limpar dados corruptos:
   ```bash
   docker exec astra_backend rm -rf /app/uploads/csv-temp/*
   ```

