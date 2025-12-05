# Guia de Configuração do .env

## 📋 Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

### 🔴 Obrigatórias (Mínimo para rodar)

```env
# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Banco de Dados (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_api
DATABASE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT - IMPORTANTE: Gere chaves seguras!
# Execute: openssl rand -base64 32 (duas vezes)
JWT_SECRET=<gere-uma-chave-segura-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<gere-outra-chave-segura-32-chars>
JWT_REFRESH_EXPIRES_IN=7d

# MinIO (S3 local)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=agent-documents-dev
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

### 🟡 Opcionais (para funcionalidades específicas)

```env
# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# PlugzAPI (WhatsApp)
PLUGZAPI_BASE_URL=https://api.plugzapi.com.br
PLUGZAPI_INSTANCE_ID=your-instance-id
PLUGZAPI_TOKEN=your-instance-token
PLUGZAPI_WEBHOOK_SECRET=your-webhook-secret

# OpenAI (para RAG)
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_LLM_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Health Check
HEALTH_CHECK_ENABLED=true
```

## 🚀 Setup Rápido

1. **Crie o arquivo .env:**
```bash
touch .env
```

2. **Gere as chaves JWT:**
```bash
# Gere JWT_SECRET
openssl rand -base64 32

# Gere JWT_REFRESH_SECRET (execute novamente)
openssl rand -base64 32
```

3. **Copie o template mínimo:**
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_api
DATABASE_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=<cole-aqui-o-resultado-do-openssl>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<cole-aqui-o-segundo-resultado>
JWT_REFRESH_EXPIRES_IN=7d

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=agent-documents-dev
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

## 📝 Explicação das Variáveis

### Aplicação
- `NODE_ENV`: Ambiente (development/production)
- `PORT`: Porta do servidor (padrão: 3000)
- `API_PREFIX`: Prefixo das rotas (padrão: api/v1)

### Banco de Dados
- `DATABASE_URL`: URL completa do PostgreSQL
- `DATABASE_SSL`: Usar SSL (false para local)

### Redis
- `REDIS_HOST`: Host do Redis (localhost com Docker)
- `REDIS_PORT`: Porta do Redis (6379 padrão)

### JWT
- `JWT_SECRET`: Chave para assinar tokens de acesso
- `JWT_REFRESH_SECRET`: Chave para refresh tokens
- **IMPORTANTE**: Use chaves diferentes e seguras!

### Integrações Externas
- **Stripe**: Configure quando for testar pagamentos
- **PlugzAPI**: Configure quando for testar mensagens WhatsApp (obtenha Instance ID e Token no painel)
- **OpenAI**: Configure quando for testar RAG

## ⚠️ Segurança

- **NUNCA** commite o `.env` no Git
- Use valores diferentes para desenvolvimento e produção
- Rotacione as chaves JWT periodicamente
- Em produção, use um gerenciador de secrets

