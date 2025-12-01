# ✅ CHECKLIST - Correção do Erro EACCES

## 📋 Antes de Começar
- [ ] Você está no diretório raiz do projeto: `p:\APPS\astracampaign`
- [ ] Docker Desktop está rodando
- [ ] Você tem pelo menos 2GB de espaço em disco livre

---

## 🚀 OPÇÃO 1: Rebuild Automático (RECOMENDADO)

### Passo 1: Executar Script
```powershell
.\rebuild-and-restart.ps1
```

### Passo 2: Aguardar
- Deixe completar (leva ~3-5 minutos)
- Você deve ver "✅ Done!" ao final

### Passo 3: Verificar Logs
```
✅ Diretório criado: /app/uploads
🎯 Starting server...
Server running on port 3001
```

### Passo 4: Testar
- Abra: `https://campanha.marqsolucoes.com.br`
- Faça login
- Tente importar um CSV
- Verifique se importa com sucesso

---

## 🔧 OPÇÃO 2: Rebuild Manual

### Passo 1: Parar Containers
```bash
docker compose down
```

### Passo 2: Remover Build Anterior
```bash
docker rmi astra_backend -f
```

### Passo 3: Reconstruir
```bash
docker compose up --build -d
```

### Passo 4: Monitorar
```bash
docker logs astra_backend -f
```

Aguarde até ver:
```
Server running on port 3001
```

### Passo 5: Testar (igual à Opção 1)

---

## 🔍 OPÇÃO 3: Diagnóstico Primeiro

Se quer verificar o sistema antes:

```powershell
.\diagnostico.ps1
```

Espere ver:
- ✅ Docker está rodando
- ✅ Containers aparecem
- ✅ Backend RUNNING
- ✅ PostgreSQL RUNNING
- ✅ Redis RUNNING

Se algo aparecer em ❌, execute a OPÇÃO 1 ou 2.

---

## 🧪 Testes Pós-Rebuild

### Teste 1: API Health
```bash
curl http://localhost:3001/api/health
```

Esperado:
```json
{"status":"OK","timestamp":"2025-12-01T12:34:56.789Z"}
```

### Teste 2: Verificar Diretório
```bash
docker exec astra_backend ls -la /app/uploads
```

Esperado:
```
total 8
drwxr-xr-x  2 nodejs nodejs 4096 Dec  1 12:34 .
drwxr-xr-x 15 nodejs nodejs 4096 Dec  1 12:34 ..
```

### Teste 3: Importar CSV
1. Acesse o frontend
2. Vá para Importar CSV
3. Crie um arquivo de teste:
   ```csv
   nome,telefone,email,observacoes
   João Silva,+5511999999999,joao@test.com,Teste
   ```
4. Envie o arquivo
5. Verifique se apareceu no banco

---

## ⚠️ Troubleshooting

### Se Vir "EACCES: permission denied" Novamente

**Causa:** Build anterior ainda está em uso

**Solução:**
```bash
# Limpeza mais agressiva
docker compose down
docker system prune -a --volumes
docker compose up --build -d
docker logs astra_backend -f
```

---

### Se Vir "Cannot find module 'csv-parser'"

**Causa:** Dependencies não foram instaladas

**Solução:**
```bash
# Remover cache de build
docker builder prune -a

# Reconstruir
docker rmi astra_backend -f
docker compose up --build -d
```

---

### Se Vir "Connection refused" no PostgreSQL

**Causa:** Banco ainda está iniciando

**Solução:**
Aguarde mais 30 segundos e tente novamente

```bash
docker logs astra_shared_postgres --tail 20
```

---

### Se Quiser Ver Todos os Logs

```bash
docker compose logs -f
```

Pressione `CTRL+C` para parar.

---

## 📊 Checklist Pós-Sucesso

- [ ] Script de rebuild executou sem erros
- [ ] Logs mostram "✅ Diretório criado: /app/uploads"
- [ ] Backend respondendo em `/api/health`
- [ ] PostgreSQL conectado
- [ ] Redis conectado
- [ ] CSV importa com sucesso
- [ ] Dados aparecem no banco

---

## 🎯 Se Tudo Estiver OK

Faça commit das mudanças:

```bash
cd p:\APPS\astracampaign

git status
# Você deve ver:
#  M backend/Dockerfile
#  M backend/src/controllers/csvImportController.ts
#  M backend/start.sh
#  ?? arquivos de documentação

git add .
git commit -m "fix: corrigir erro EACCES na importação CSV em Docker"
git push origin main
```

---

## 🔄 Se Precisar Reverter

```bash
git reset --hard HEAD~1
docker compose down
docker rmi astra_backend -f
docker compose up --build -d
```

---

## 📞 Resumo Rápido

| Situação | Ação |
|----------|------|
| Primeira vez | Execute `.\rebuild-and-restart.ps1` |
| Ainda com erro | Execute `.\diagnostico.ps1` |
| Quer ver tudo | Execute `docker logs astra_backend -f` |
| Quer limpar | Execute opção "Limpeza Total" |
| Tudo OK | Faça `git commit` e `git push` |

---

**Você conseguiu! O erro foi corrigido.** ✅

Se tiver dúvidas, consulte `FIX_EACCES_DETALHADO.md` ou `INSTRUCOES_RAPIDAS.md`

