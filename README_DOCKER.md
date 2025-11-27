# Guia de Instalação com Docker

Este guia explica como rodar a aplicação completa (Frontend + Backend + Banco de Dados + Redis) utilizando Docker Compose.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

## Como Rodar

1. **Construir e iniciar os containers:**

   Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute:

   ```bash
   docker compose up --build -d
   ```

   Isso irá:
   - Baixar as imagens do Postgres e Redis
   - Construir a imagem do Backend
   - Construir a imagem do Frontend
   - Iniciar todos os serviços na ordem correta

2. **Acessar a aplicação:**

   - **Frontend:** [http://localhost:8080](http://localhost:8080)
   - **Backend API:** [http://localhost:3001](http://localhost:3001)

3. **Verificar logs:**

   Para ver os logs de todos os serviços:
   ```bash
   docker compose logs -f
   ```

   Para ver logs de um serviço específico:
   ```bash
   docker compose logs -f work_backend
   ```

4. **Parar a aplicação:**

   ```bash
   docker compose down
   ```

   Para parar e remover os volumes (apagar dados do banco):
   ```bash
   docker compose down -v
   ```

## Estrutura dos Serviços

- **postgres**: Banco de dados PostgreSQL 16
- **redis**: Cache e filas
- **work_backend**: API Node.js (Porta 3001)
- **work_frontend**: Servidor Nginx servindo o React App (Porta 8080)

## Notas Importantes

- O backend executa automaticamente as migrações e seeds do banco de dados ao iniciar (via `start.sh`).
- O frontend está configurado para proxyar requisições `/api` para o backend internamente.
- Os dados do banco e uploads são persistidos em volumes Docker locais.
