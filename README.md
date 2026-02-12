# 🚀 **Boilerplate NestJS**

Um boilerplate robusto para desenvolvimento de aplicações backend utilizando **NestJS**, configurado com TypeORM, PostgreSQL, autenticação JWT, upload de arquivos, audit log, feature flags e muito mais.

---

## 📦 **Tecnologias Utilizadas**

- **Node.js** v22+
- **NestJS** v10+
- **TypeORM** (PostgreSQL)
- **Redis** (Cache e Rate Limiting)
- **JWT** (Autenticação com Refresh Token)
- **Supabase** (Storage para uploads e Social Login)
- **Swagger** (Documentação de API)
- **Jest** (Testes unitários)
- **Docker** (PostgreSQL, Redis)

---

## 📂 **Estrutura do Projeto**

```
src/
├── auth/           # Autenticação (JWT, Social Login, Reset Password)
├── user/           # CRUD de usuários
├── file-upload/    # Upload de arquivos (Supabase Storage)
├── audit-log/      # Logs de auditoria
├── feature-flag/   # Feature flags
├── health-check/   # Health check
├── common/         # Recursos compartilhados (guards, interceptors, DTOs)
├── config/         # Configurações (TypeORM, Redis, Winston)
├── database/       # Seeds
├── migrations/     # Migrações do banco de dados
├── app.module.ts   # Módulo principal
└── main.ts         # Ponto de entrada
```

---

## ⚙️ **Configuração do Ambiente**

### 1. Clone e instale

```bash
git clone git@github.com:arthur-cgomes/boilerplate-nestjs.git
cd boilerplate-nestjs
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

### 3. Variáveis de ambiente

```env
# JWT
AUTH_SECRET=sua_chave_secreta_jwt
EXPIRE_IN=7200

# Database
TYPEORM_CONNECTION=postgres
TYPEORM_HOST=localhost
TYPEORM_PORT=5432
TYPEORM_USERNAME=postgres
TYPEORM_PASSWORD=postgres
TYPEORM_DATABASE=boilerplate
TYPEORM_SYNCHRONIZE=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Supabase (Opcional - para uploads e social login)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon
SUPABASE_BUCKET=uploads

# Email Service (Opcional - para reset de senha)
EMAIL_SERVICE_URL=https://sua-cloud-function.com/send-email
EMAIL_SERVICE_KEY=sua_chave_api

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### 4. Inicie os serviços (Docker)

```bash
docker-compose up -d
```

### 5. Execute as migrações e seeds

```bash
npm run migration:run
npm run seed
```

### 6. Inicie a aplicação

```bash
npm run start:dev
```

---

## 🛠️ **Scripts Disponíveis**

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Inicia em modo desenvolvimento (hot-reload) |
| `npm run start:debug` | Inicia em modo debug |
| `npm run build` | Compila para produção |
| `npm run start:prod` | Executa migrações e inicia produção |
| `npm run test` | Executa testes unitários |
| `npm run test:cov` | Testes com cobertura |
| `npm run lint` | Executa ESLint com auto-fix |
| `npm run format` | Formata código com Prettier |
| `npm run migration:generate` | Gera migration a partir de mudanças |
| `npm run migration:run` | Executa migrações pendentes |
| `npm run migration:revert` | Reverte última migração |
| `npm run seed` | Executa seeds |

---

## 📊 **Documentação da API (Swagger)**

Após iniciar o servidor, acesse:

```
http://localhost:3000/api
```

---

## 📬 **Coleção Postman**

Uma coleção completa do Postman está disponível em `docs/postman_collection.json`.

### Importar no Postman

1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `docs/postman_collection.json`
4. A coleção será importada com todas as variáveis configuradas

### Variáveis da Coleção

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `baseUrl` | `http://localhost:3000/v1` | URL base da API |
| `accessToken` | (vazio) | Token JWT de acesso (preenchido automaticamente após login) |
| `refreshToken` | (vazio) | Token de refresh (preenchido automaticamente após login) |

### Funcionalidades

- **Auto-save de tokens**: Após fazer login, os tokens são salvos automaticamente
- **Autenticação Bearer**: Todas as rotas protegidas já estão configuradas com o token
- **Documentação inline**: Cada request possui descrição detalhada

---

## 🔐 **Módulos**

### Auth (`/auth`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login com email/senha | ❌ |
| POST | `/auth/social` | Login social (Google, GitHub, etc) | ❌ |
| POST | `/auth/refresh` | Renovar access token | ❌ |
| POST | `/auth/logout` | Logout (invalida refresh token) | ✅ |
| POST | `/auth/logout-all` | Logout de todos os dispositivos | ✅ |
| POST | `/auth/password/request-reset` | Solicitar reset de senha | ❌ |
| POST | `/auth/password/confirm-reset` | Confirmar reset de senha | ❌ |

### User (`/user`)

| Método | Endpoint | Descrição | Auth | Roles |
|--------|----------|-----------|------|-------|
| POST | `/user` | Criar usuário | ✅ | ADMIN |
| GET | `/user` | Listar usuários (paginado) | ✅ | ADMIN, GLOBAL |
| GET | `/user/:id` | Buscar usuário por ID | ✅ | - |
| PUT | `/user/:id` | Atualizar usuário | ✅ | - |
| DELETE | `/user/:id` | Remover usuário (soft delete) | ✅ | ADMIN |

### File Upload (`/files`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/files/upload` | Upload de arquivo único | ✅ |
| POST | `/files/upload/multiple` | Upload de múltiplos arquivos | ✅ |
| GET | `/files` | Listar arquivos do usuário | ✅ |
| GET | `/files/:id` | Buscar arquivo por ID | ✅ |
| GET | `/files/:id/signed-url` | Gerar URL assinada | ✅ |
| DELETE | `/files/:id` | Remover arquivo | ✅ |

### Audit Log (`/audit-log`)

| Método | Endpoint | Descrição | Auth | Roles |
|--------|----------|-----------|------|-------|
| GET | `/audit-log` | Listar logs de auditoria | ✅ | ADMIN, GLOBAL |
| GET | `/audit-log/entity/:name/:id` | Histórico de uma entidade | ✅ | ADMIN, GLOBAL |
| GET | `/audit-log/user/:userId` | Atividades de um usuário | ✅ | ADMIN, GLOBAL |

### Feature Flags (`/feature-flags`)

| Método | Endpoint | Descrição | Auth | Roles |
|--------|----------|-----------|------|-------|
| GET | `/feature-flags/check/:key` | Verificar se flag está ativa | ✅ | - |
| GET | `/feature-flags/check` | Status de todas as flags | ✅ | - |
| GET | `/feature-flags` | Listar todas as flags | ✅ | ADMIN, GLOBAL |
| GET | `/feature-flags/:id` | Buscar flag por ID | ✅ | ADMIN, GLOBAL |
| POST | `/feature-flags` | Criar feature flag | ✅ | ADMIN |
| PUT | `/feature-flags/:id` | Atualizar feature flag | ✅ | ADMIN |
| POST | `/feature-flags/:id/toggle` | Alternar status da flag | ✅ | ADMIN |
| DELETE | `/feature-flags/:id` | Remover feature flag | ✅ | ADMIN |

### Health Check (`/health-check`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/health-check` | Status da aplicação | ❌ |

---

## 🧪 **Guia de Testes das Rotas**

### Pré-requisitos

1. Aplicação rodando: `npm run start:dev`
2. Migrations executadas: `npm run migration:run`
3. Seeds executados: `npm run seed`

### 1. Health Check

```bash
curl http://localhost:3000/v1/health-check
```

### 2. Login

```bash
# Login com usuário admin do seed
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin@123"}'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expiresIn": 7200,
    "userId": "uuid",
    "name": "Admin User",
    "userType": "admin"
  },
  "meta": { "correlationId": "uuid" },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Usar Access Token

```bash
# Guardar o token
TOKEN="seu_access_token_aqui"

# Listar usuários
curl http://localhost:3000/v1/user \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "seu_refresh_token"}'
```

### 5. Criar Usuário

```bash
curl -X POST http://localhost:3000/v1/user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Usuario",
    "email": "novo@example.com",
    "password": "Senha@123"
  }'
```

### 6. Upload de Arquivo

```bash
curl -X POST http://localhost:3000/v1/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/arquivo.jpg" \
  -F "folder=avatars"
```

### 7. Listar Arquivos

```bash
curl http://localhost:3000/v1/files \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Verificar Feature Flag

```bash
curl http://localhost:3000/v1/feature-flags/check/dark_mode \
  -H "Authorization: Bearer $TOKEN"
```

### 9. Listar Feature Flags (Admin)

```bash
curl http://localhost:3000/v1/feature-flags \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Criar Feature Flag

```bash
curl -X POST http://localhost:3000/v1/feature-flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "nova_feature",
    "name": "Nova Feature",
    "description": "Descrição da feature",
    "active": false,
    "rolloutPercentage": 50
  }'
```

### 11. Listar Audit Logs

```bash
curl "http://localhost:3000/v1/audit-log?take=10&skip=0" \
  -H "Authorization: Bearer $TOKEN"
```

### 12. Histórico de Alterações de um Usuário

```bash
curl http://localhost:3000/v1/audit-log/entity/User/USER_ID_AQUI \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Logout

```bash
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### 14. Logout de Todos os Dispositivos

```bash
curl -X POST http://localhost:3000/v1/auth/logout-all \
  -H "Authorization: Bearer $TOKEN"
```

### 15. Solicitar Reset de Senha

```bash
curl -X POST http://localhost:3000/v1/auth/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### 16. Confirmar Reset de Senha

```bash
curl -X POST http://localhost:3000/v1/auth/password/confirm-reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "token_recebido_no_email",
    "newPassword": "NovaSenha@123"
  }'
```

### 17. Testar Account Lockout

```bash
# Faça 5 tentativas com senha errada
for i in {1..5}; do
  curl -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "senha_errada"}'
  echo ""
done

# A 6ª tentativa deve retornar erro de conta bloqueada
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin@123"}'
```

### 18. Verificar Correlation ID

```bash
# O header X-Correlation-ID é retornado em todas as respostas
curl -v http://localhost:3000/v1/health-check 2>&1 | grep -i correlation
```

---

## 👤 **Usuários do Seed**

| Email | Senha | Tipo |
|-------|-------|------|
| admin@example.com | Admin@123 | ADMIN |
| global@example.com | Global@123 | GLOBAL |
| user@example.com | User@123 | USER |

---

## 🐳 **Docker**

### Desenvolvimento Local (apenas databases)

```bash
# Iniciar PostgreSQL e Redis para desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Verificar status
docker-compose -f docker-compose.dev.yml ps

# Parar serviços
docker-compose -f docker-compose.dev.yml down
```

### Produção (API + databases)

```bash
# Build e iniciar todos os serviços
docker-compose up -d --build

# Ver logs da API
docker-compose logs -f api

# Parar tudo
docker-compose down

# Remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Build Manual da Imagem

```bash
# Build da imagem
docker build -t nestjs-boilerplate:latest .

# Verificar tamanho
docker images nestjs-boilerplate

# Rodar container isolado
docker run -p 3000:3000 \
  -e AUTH_SECRET=your-super-secret-key-min-32-chars!! \
  -e TYPEORM_HOST=host.docker.internal \
  -e TYPEORM_PORT=5432 \
  -e TYPEORM_USERNAME=postgres \
  -e TYPEORM_PASSWORD=postgres \
  -e TYPEORM_DATABASE=pg_database \
  -e REDIS_HOST=host.docker.internal \
  nestjs-boilerplate:latest
```

### Dockerfile (Multi-stage optimizado)

O Dockerfile utiliza multi-stage build para otimização:

1. **Stage deps**: Instala dependências
2. **Stage builder**: Compila TypeScript e prune devDependencies
3. **Stage production**: Imagem final mínima (~150MB)

Características:
- Node 20 Alpine (imagem leve)
- Usuário não-root (segurança)
- Health check integrado
- Apenas arquivos necessários copiados

---

## 🤝 **Contribuindo**

1. Fork o projeto
2. Crie sua branch: `git checkout -b feature/nova-feature`
3. Commit suas alterações: `git commit -m "Adiciona nova feature"`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📜 **Licença**

Este projeto está licenciado sob a licença **UNLICENSED**.
