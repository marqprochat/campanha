# Guia de Instalação no Easypanel

Este guia explica como instalar a aplicação **Astra Campaign** no Easypanel sem erros.

## 📋 Pré-requisitos

- Acesso ao painel do Easypanel
- Repositório Git com o código (GitHub, GitLab, etc.)

---

## 🏗️ Arquitetura no Easypanel

O Easypanel usa **Traefik** como proxy reverso para rotear requisições HTTP/HTTPS.
Internamente, os serviços do **mesmo projeto** se comunicam através de uma rede Docker compartilhada.

```
Internet → Traefik → Frontend (nginx:80) → /api → Backend (node:3001)
                                         → Postgres (5432)
                                         → Redis (6379)
```

---

## 🚀 Passo a Passo

### 1. Criar um Novo Projeto

1. No Easypanel, clique em **"Create Project"**
2. Dê um nome ao projeto: `astracampaign` (use minúsculas, sem espaços)

---

### 2. Criar Serviço PostgreSQL

1. Dentro do projeto, clique em **"+ Service"**
2. Selecione **"Postgres"** na lista de templates
3. Configure:
   - **Service Name**: `postgres` ⚠️ **IMPORTANTE: use exatamente este nome**
   - **Image**: `postgres:16-alpine`
   - **Database**: `contacts`
   - **Username**: `postgres`
   - **Password**: Uma senha forte (ex: `SuaSenhaSegura123!`)
4. Clique em **"Create"**
5. Aguarde o serviço ficar **Running** (verde)

---

### 3. Criar Serviço Redis

1. Clique em **"+ Service"**
2. Selecione **"Redis"** na lista de templates
3. Configure:
   - **Service Name**: `redis` ⚠️ **IMPORTANTE: use exatamente este nome**
   - **Image**: `redis:7-alpine`
4. Clique em **"Create"**
5. Aguarde o serviço ficar **Running**

---

### 4. Criar Serviço Backend (App)

1. Clique em **"+ Service"**
2. Selecione **"App"** (para build a partir de código)
3. Configure:
   - **Service Name**: `backend` ⚠️ **IMPORTANTE: use exatamente este nome**

4. Na aba **"Source"**:
   - **Type**: GitHub/GitLab
   - Conecte seu repositório
   - **Branch**: `main` (ou sua branch principal)

5. Na aba **"Build"**:
   - **Build Type**: Dockerfile
   - **Context**: `./backend`
   - **Dockerfile**: `Dockerfile`

6. Na aba **"Environment"**, adicione estas variáveis:

```env
# Domínio da aplicação
DOMAIN=seudominio.com

# Conexão com PostgreSQL (mesma rede Docker, use o nome do serviço)
DATABASE_URL=postgresql://postgres:SuaSenhaSegura123!@postgres:5432/contacts?schema=public

# Conexão com Redis (mesma rede Docker, use o nome do serviço)
REDIS_URL=redis://redis:6379

# Autenticação JWT
JWT_SECRET=gere-uma-chave-com-openssl-rand-hex-32
JWT_EXPIRES_IN=24h

# Configurações da Evolution API (WhatsApp)
DEFAULT_EVOLUTION_HOST=https://sua-evolution-api.com
DEFAULT_EVOLUTION_API_KEY=sua-api-key

# Configurações visuais
DEFAULT_COMPANY_NAME=Sua Empresa
DEFAULT_PAGE_TITLE=Gerenciamento de Campanha

# CORS - domínio completo do frontend COM https://
ALLOWED_ORIGINS=https://seudominio.com
```

> **⚠️ SUBSTITUA:**
> - `SuaSenhaSegura123!` pela senha definida no PostgreSQL
> - `seudominio.com` pelo seu domínio real
> - Gere o `JWT_SECRET` com: `openssl rand -hex 32`

7. Na aba **"Storage"** (Mounts/Volumes), adicione:

| Type | Mount Path | Description |
|------|------------|-------------|
| Volume | `/app/data` | Dados da aplicação |
| Volume | `/app/uploads` | Arquivos enviados |
| Volume | `/app/backups` | Backups |

8. Na aba **"Network"**:
   - **Port**: `3001`
   - **NÃO** é necessário expor domínio público (o frontend fará proxy)

9. Clique em **"Create"** e depois em **"Deploy"**

---

### 5. Criar Serviço Frontend (App)

1. Clique em **"+ Service"**
2. Selecione **"App"**
3. Configure:
   - **Service Name**: `frontend` ⚠️ **IMPORTANTE: use exatamente este nome**

4. Na aba **"Source"**:
   - **Type**: GitHub/GitLab (mesmo repositório)
   - **Branch**: `main`

5. Na aba **"Build"**:
   - **Build Type**: Dockerfile
   - **Context**: `./frontend`
   - **Dockerfile**: `Dockerfile`

6. Na aba **"Domains"**:
   - Clique em **"Add Domain"**
   - Adicione seu domínio: `campanha.seudominio.com`
   - Ative **HTTPS** (Traefik gerará o certificado automaticamente via Let's Encrypt)

7. Na aba **"Network"**:
   - **Port**: `80`

8. Clique em **"Create"** e depois em **"Deploy"**

---

## � Como Funciona a Comunicação

### Traefik (Externo)
- O Traefik é o proxy reverso do Easypanel
- Roteia `https://seudominio.com` → container frontend:80
- Gerencia certificados SSL automaticamente

### Rede Docker Interna
- Todos os serviços do mesmo projeto compartilham uma rede Docker
- Serviços se comunicam pelo **nome do serviço prefixado com o projeto**:
  - Exemplo: projeto `apps` e serviço `backend` → hostname `apps_backend`
  - Frontend chama Backend: `http://apps_backend:3001`
  - Backend chama Postgres: `apps_postgres:5432`

> **💡 DICA DE OURO**: Verifique a variável `DATABASE_URL` do backend. Se ela usa `apps_postgres`, então o padrão é `[projeto]_[serviço]`.

### 🚑 Alternativa: Usar URL Pública (Garantido)

Se a rede interna estiver dando dor de cabeça (Erro 502), use a URL pública do backend no `nginx.conf`. O tráfego sai para a internet e volta, mas **funciona sempre**.

```nginx
location /api {
    # Sua URL pública do backend (pegue na aba Domínios)
    set $backend "https://apps-campanha-backend.h41tex.easypanel.host";
    proxy_pass $backend;

    # Obrigatório para HTTPS
    proxy_ssl_server_name on;
    proxy_set_header Host apps-campanha-backend.h41tex.easypanel.host;
    proxy_ssl_verify off;
}
```

### Nginx (Dentro do Frontend)
- O Nginx dentro do container frontend:
  - Serve arquivos estáticos do React em `/`
  - Faz proxy de `/api/*` para `http://backend:3001/api/*`

---

## 🔧 Solução de Problemas Comuns

### ❌ Erro 502 Bad Gateway nas requisições /api

**Causa**: Frontend não consegue se comunicar com o backend.

**Soluções**:
1. Verifique se o backend está **Running** (verde)
2. Confirme que o nome do serviço do backend é exatamente `backend`
3. Verifique os logs do backend (clique no serviço → Logs)
4. Se necessário, verifique o `nginx.conf` do frontend:
   ```nginx
   location /api {
       set $backend "backend:3001";
       proxy_pass http://$backend;
   }
   ```

---

### ❌ Erro: Backend não conecta ao PostgreSQL

**Causa**: URL de conexão incorreta ou Postgres não está rodando.

**Soluções**:
1. Confirme que o serviço Postgres está **Running**
2. Verifique a variável `DATABASE_URL`:
   ```
   postgresql://postgres:SENHA@postgres:5432/contacts?schema=public
   ```
   - Use `postgres` como host (nome do serviço, não `localhost`)
   - A senha deve ser a mesma configurada no serviço Postgres

---

### ❌ Erro: Prisma migration falha no deploy

**Causa**: Banco ainda não está pronto quando o backend inicia.

**Soluções**:
1. Aguarde alguns segundos e faça **Redeploy** do backend
2. Ou acesse o terminal do container:
   ```bash
   npx prisma db push --accept-data-loss
   npx prisma db seed
   ```

---

### ❌ Erro CORS: Origin not allowed

**Causa**: Domínio do frontend não está na lista de origins permitidos.

**Soluções**:
1. Verifique a variável `ALLOWED_ORIGINS` no backend
2. Use a URL **completa** com protocolo:
   ```env
   ALLOWED_ORIGINS=https://campanha.seudominio.com
   ```
3. Se usar múltiplos domínios, separe por vírgula:
   ```env
   ALLOWED_ORIGINS=https://campanha.seudominio.com,https://admin.seudominio.com
   ```

---

### ❌ Erro: Redis connection refused

**Causa**: Redis não está rodando ou URL incorreta.

**Soluções**:
1. Verifique se o serviço Redis está **Running**
2. Confirme a variável `REDIS_URL`:
   ```
   redis://redis:6379
   ```

---

### ❌ Frontend carrega mas mostra página em branco

**Causa**: Erro no build do React ou configuração de rotas.

**Soluções**:
1. Verifique os logs do build no Easypanel
2. Confirme que `nginx.conf` tem a configuração para SPA:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

---

## 📝 Configuração de DNS

Para usar seu domínio customizado:

1. No painel DNS do seu provedor (Cloudflare, Route53, etc.)
2. Crie um registro **A** ou **CNAME**:
   - **Tipo**: A (ou CNAME)
   - **Nome**: `campanha` (ou o subdomínio desejado)
   - **Valor**: IP do seu servidor Easypanel
3. Aguarde propagação do DNS (pode levar alguns minutos)
4. O Traefik gerará o certificado SSL automaticamente

---

## � Verificação Final

Após a instalação, você deve ter:

| Serviço | Status | Porta Interna |
|---------|--------|---------------|
| postgres | 🟢 Running | 5432 |
| redis | 🟢 Running | 6379 |
| backend | 🟢 Running | 3001 |
| frontend | 🟢 Running | 80 |

Acesse `https://seudominio.com` e você deverá ver a tela de login.

---

## 🔄 Atualizações Futuras

### Deploy Automático
- Configure **Auto Deploy** no serviço para deploy automático a cada push

### Deploy Manual
1. Faça push das mudanças para o Git
2. No Easypanel, clique no serviço
3. Clique em **"Redeploy"**

---

## ⚡ Dicas de Performance

1. **Ative Health Checks**: Configure health checks para que o Easypanel reinicie serviços com problemas
2. **Recursos**: Ajuste limites de CPU/memória se necessário
3. **Logs**: Use os logs do Easypanel para debugar problemas

---

## 🔐 Segurança

- ✅ Use senhas fortes para PostgreSQL
- ✅ Gere JWT_SECRET aleatório: `openssl rand -hex 32`
- ✅ Sempre use HTTPS (Traefik faz isso automaticamente)
- ✅ Configure ALLOWED_ORIGINS apenas com domínios necessários
- ✅ Mantenha as imagens Docker atualizadas
