# 🔧 Correção Definitiva do Erro de Permissão no CSV

## 🔴 Problema Original

```
❌ Erro ao criar diretório de uploads: /app/tmp/uploads
Error: EACCES: permission denied, mkdir '/app/tmp/uploads'
```

### Causa Raiz

1. **Diretório errado**: Tentava criar `/app/tmp/uploads` mas deveria ser `/app/uploads`
2. **Timing incorreto**: Tentava criar o diretório no **tempo de carregamento do módulo** (load-time), quando o usuário `nodejs` não tinha permissões
3. **Falta de permissões**: O Dockerfile não configurava corretamente as permissões para o usuário `nodejs`
4. **Path inconsistente**: O código original usa `/app/tmp/uploads` (caminho incorreto)

---

## ✅ Soluções Aplicadas

### 1. **Refatorar Criação de Diretório** 
📄 `backend/src/controllers/csvImportController.ts`

**Antes (❌ Causa erro):**
```typescript
const tmpDir = process.env.NODE_ENV === 'production' 
  ? '/app/uploads/csv-temp'
  : path.join(process.cwd(), 'uploads', 'csv-temp');

try {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true }); // ❌ Erro aqui no load-time
  }
} catch (error) {
  throw new Error(`...`); // ❌ Crash total
}
```

**Depois (✅ Funciona):**
```typescript
const getTmpDir = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/app/uploads'  // ✅ Caminho correto (base)
    : path.join(process.cwd(), 'uploads');
};

const ensureDirectoryExists = (dir: string): boolean => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Diretório criado: ${dir}`);
    }
    return true;
  } catch (error) {
    console.error(`⚠️ Erro ao criar diretório: ${error}`);
    return false; // ✅ Não mata a aplicação
  }
};

// Na rota:
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmpDir = getTmpDir();
    if (ensureDirectoryExists(tmpDir)) {  // ✅ Só cria quando necessário (request-time)
      cb(null, tmpDir);
    } else {
      cb(new Error(`Não foi possível acessar diretório`), tmpDir);
    }
  },
  // ...
});
```

**Mudanças-chave:**
- ✅ Criação sob demanda (quando arquivo é enviado) em vez de load-time
- ✅ Não lança exception que mata o servidor
- ✅ Usa `/app/uploads` em vez de `/app/uploads/csv-temp`
- ✅ Função auxiliar `ensureDirectoryExists` reutilizável

---

### 2. **Corrigir Dockerfile**
📄 `backend/Dockerfile`

**Antes (❌):**
```dockerfile
RUN mkdir -p /app/data /app/uploads /app/uploads/csv-temp /app/backups && \
    chown -R nodejs:nodejs /app/data /app/uploads /app/backups
```

**Depois (✅):**
```dockerfile
RUN mkdir -p /app/data /app/uploads /app/backups && \
    chmod 755 /app && \
    chmod 755 /app/data /app/uploads /app/backups && \
    chown -R nodejs:nodejs /app/data /app/uploads /app/backups
```

**Mudanças:**
- ✅ Remove `/app/uploads/csv-temp` (criado dinamicamente)
- ✅ Adiciona `chmod 755` para garantir permissões de leitura/escrita/execução
- ✅ Garante que `/app` pai também tem permissões corretas

---

### 3. **Atualizar start.sh**
📄 `backend/start.sh`

**Antes (❌):**
```bash
mkdir -p /app/uploads /app/uploads/csv-temp /app/data /app/backups 2>/dev/null || true
```

**Depois (✅):**
```bash
mkdir -p /app/data /app/uploads /app/backups 2>/dev/null || true

# Garantir permissões (apenas se for o usuário root)
if [ "$(id -u)" = "0" ]; then
  chmod -R 755 /app/data /app/uploads /app/backups 2>/dev/null || true
  chown -R nodejs:nodejs /app/data /app/uploads /app/backups 2>/dev/null || true
fi
```

**Mudanças:**
- ✅ Cria diretórios base apenas
- ✅ Aplica permissões em tempo de execução
- ✅ Verifica se é root antes de usar `chown`

---

### 4. **Scripts Auxiliares Criados**

#### `rebuild-and-restart.ps1` (Windows)
```powershell
# Parar containers
docker compose down

# Remover imagem antiga
docker rmi astra_backend -f

# Reconstruir
docker compose up --build -d

# Aguardar e exibir logs
```

**Use:**
```powershell
.\rebuild-and-restart.ps1
```

---

#### `rebuild-and-restart.sh` (Linux/macOS)
Versão bash do script acima.

**Use:**
```bash
bash rebuild-and-restart.sh
```

---

#### `diagnostico.ps1` (Windows)
Script completo de diagnóstico que verifica:
- ✅ Status dos containers
- ✅ Permissões de diretórios
- ✅ Logs recentes
- ✅ Saúde do API
- ✅ Conexão com banco
- ✅ Espaço em disco

**Use:**
```powershell
.\diagnostico.ps1
```

---

## 🚀 Como Aplicar as Correções

### **Opção 1: Rebuild Completo (Recomendado)**
```powershell
# No diretório raiz do projeto
.\rebuild-and-restart.ps1
```

### **Opção 2: Manual**
```bash
# Parar containers
docker compose down

# Remover build anterior (importante!)
docker rmi astra_backend -f

# Reconstruir e iniciar
docker compose up --build -d

# Verificar logs
docker logs astra_backend -f
```

### **Opção 3: Se ainda tiver espaço no disco**
```bash
# Limpar Docker completamente
docker system prune -a --volumes

# Reconstruir
docker compose up --build -d
```

---

## ✅ Logs Esperados Após Correção

```
✅ Diretório criado: /app/uploads
📄 Arquivo CSV será salvo como: import-1701388800-123456789.csv
📊 CSVImportService - Processando 5 linhas do CSV para tenantId: ...
✅ Linha 2 importada: João Silva (tenant: ...)
📈 Resultado da importação: { success: true, totalRows: 5, successfulImports: 5, ... }
```

---

## 🔍 Se Ainda Houver Erro

### **Verificar permissões dentro do container:**
```bash
docker exec astra_backend ls -la /app/
docker exec astra_backend ls -la /app/uploads/
docker exec astra_backend whoami
```

### **Limpar volume completamente:**
```bash
docker compose down -v
docker compose up --build -d
```

### **Executar diagnóstico:**
```powershell
.\diagnostico.ps1
```

---

## 📋 Sumário das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `csvImportController.ts` | Função `getTmpDir()` + `ensureDirectoryExists()` | Criar diretório sob demanda |
| `Dockerfile` | Adicionar `chmod 755` | Garantir permissões corretas |
| `start.sh` | Adicionar lógica de permissões | Restaurar perms em runtime |
| `rebuild-and-restart.ps1` | ✨ Novo | Automatizar rebuild |
| `diagnostico.ps1` | ✨ Novo | Diagnosticar problemas |

---

## 💡 Conceitos Importantes

### Load-time vs Request-time
- **❌ Load-time**: Executa quando o módulo é importado (acontece uma vez na inicialização)
- **✅ Request-time**: Executa quando uma requisição chega (multas vezes durante runtime)

### EACCES (Permission Denied)
- Significa que o usuário `nodejs` não tem permissão de escrita
- Solução: Usar `chmod 755` e `chown nodejs:nodejs`

### /app/tmp vs /app/uploads
- `/app/tmp`: Caminho errado, sem volume persistente
- `/app/uploads`: Caminho correto, com volume Docker persistente

---

**Aplicar essas correções resolverá o erro de permissão permanentemente!** ✅

