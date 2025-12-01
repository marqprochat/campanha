# ⚡ Instruções Rápidas - Resolver Erro de Permissão no CSV

## 🎯 Problema
```
❌ Error: EACCES: permission denied, mkdir '/app/tmp/uploads'
```

## ✅ Solução Rápida

### **Passo 1: Navegar para o diretório do projeto**
```powershell
cd p:\APPS\astracampaign
```

### **Passo 2: Executar o script de rebuild**
```powershell
.\rebuild-and-restart.ps1
```

### **Passo 3: Aguardar 20 segundos e verificar**

Você deve ver logs como:
```
✅ Diretório criado: /app/uploads
🎯 Starting server...
Server running on port 3001
```

### **Passo 4: Testar importação de CSV**
1. Abra o navegador: `https://campanha.marqsolucoes.com.br`
2. Faça login
3. Vá para importar CSV
4. Envie um arquivo pequeno
5. Verifique se importa com sucesso

---

## 🔧 Se Tiver Problemas

### **Opção A: Diagnóstico Rápido**
```powershell
.\diagnostico.ps1
```

Isso mostra:
- ✅ Se Docker está rodando
- ✅ Se os containers estão saudáveis
- ✅ Se há erros nos logs
- ✅ Se o API está respondendo

### **Opção B: Limpeza Completa**
```powershell
# Parar tudo
docker compose down

# Remover imagens antigas
docker rmi astra_backend -f

# Remover volumes (CUIDADO: apaga dados!)
docker volume prune -f

# Reconstruir
docker compose up --build -d

# Monitorar logs
docker logs astra_backend -f
```

### **Opção C: Verificar Manualmente**
```powershell
# Entrar no container
docker exec -it astra_backend sh

# Verificar diretórios
ls -la /app/uploads

# Sair
exit
```

---

## 📊 O Que Foi Corrigido

| Item | Antes | Depois |
|------|-------|--------|
| Diretório | `/app/tmp/uploads` | `/app/uploads` |
| Criação | Load-time (crash) | Request-time (seguro) |
| Permissões | Não configuradas | ✅ 755 |
| Dockerfile | Sem chmod | ✅ chmod 755 |
| start.sh | Sem permissões | ✅ chown/chmod |

---

## 🚀 Próximas Ações

1. ✅ Execute `.\rebuild-and-restart.ps1`
2. ✅ Aguarde 20 segundos
3. ✅ Teste importação de CSV
4. ✅ Se funcionar, faça commit:
   ```powershell
   git add .
   git commit -m "fix: corrigir erro de permissão em importação CSV"
   git push origin main
   ```

---

## 📞 Checklist Final

- [ ] Container backend iniciou sem erros
- [ ] Logs mostram "✅ Diretório criado: /app/uploads"
- [ ] `/api/health` responde com 200
- [ ] CSV importa com sucesso
- [ ] Dados aparecem no banco de dados

**Se todos os itens forem ✅, o problema foi resolvido!**

