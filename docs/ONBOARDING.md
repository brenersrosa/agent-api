# Guia de Onboarding - Sistema de Agentes WhatsApp com RAG

## Índice

1. [Pré-requisitos e Instalação](#1-pré-requisitos-e-instalação)
2. [Primeiro Acesso](#2-primeiro-acesso)
3. [Próximos Passos](#3-próximos-passos)

---

## 1. Pré-requisitos e Instalação

### 1.1 Requisitos do Sistema

Antes de começar, certifique-se de ter instalado:

- **Node.js** 20 ou superior
- **Docker** e **Docker Compose**
- **Docker Desktop** rodando (macOS/Windows)
- **npm** ou **yarn** ou **pnpm**
- **Git** (para clonar o repositório)

#### Verificando as Instalações

```bash
# Verificar Node.js
node --version  # Deve ser >= 20.0.0

# Verificar Docker
docker --version

# Verificar Docker Compose
docker compose version

# Verificar npm/yarn/pnpm
npm --version
# ou
yarn --version
# ou
pnpm --version
```

### 1.2 Clonando o Repositório

```bash
git clone <repository-url>
cd agent/api
```

### 1.3 Instalação de Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 1.4 Configuração do Ambiente

1. **Crie o arquivo `.env`** na raiz do projeto:

```bash
cp .env.example .env
# ou crie manualmente
touch .env
```

2. **Configure as variáveis de ambiente** no arquivo `.env`:

Consulte o arquivo [ENV_SETUP.md](../ENV_SETUP.md) para detalhes completos.

**Configuração mínima necessária:**

```env
# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_api
DATABASE_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT - Gere chaves seguras!
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

**Gerando chaves JWT seguras:**

```bash
# Gere JWT_SECRET
openssl rand -base64 32

# Gere JWT_REFRESH_SECRET (execute novamente)
openssl rand -base64 32
```

### 1.5 Inicialização dos Serviços Docker

1. **Certifique-se de que o Docker Desktop está rodando**

   - Abra o Docker Desktop
   - Aguarde até que o ícone fique verde na barra de menus

2. **Inicie os serviços:**

```bash
npm run docker:up
# ou
docker compose up -d
```

Isso iniciará os seguintes serviços:
- **PostgreSQL** (porta 5432) - Banco de dados principal
- **Redis** (porta 6379) - Cache e filas
- **MinIO** (portas 9000 e 9001) - Armazenamento S3 local

3. **Verifique se os serviços estão rodando:**

```bash
docker compose ps
```

Você deve ver todos os serviços com status "Up".

4. **Verifique os logs (opcional):**

```bash
npm run docker:logs
# ou
docker compose logs -f
```

### 1.6 Execução de Migrações do Banco de Dados

Após os serviços Docker estarem rodando, execute as migrações:

```bash
npm run migration:run
# ou
pnpm run migration:run
```

Isso criará todas as tabelas necessárias no banco de dados.

**Verificando as migrações:**

```bash
# Conecte-se ao PostgreSQL (opcional)
docker exec -it agent_api_postgres psql -U postgres -d agent_api

# Liste as tabelas
\dt
```

### 1.7 Verificação de Saúde do Sistema

1. **Inicie o servidor de desenvolvimento:**

```bash
npm run start:dev
# ou
pnpm run start:dev
```

2. **Verifique se o servidor está rodando:**

A API estará disponível em `http://localhost:3000`

3. **Teste o endpoint de saúde (se disponível):**

```bash
curl http://localhost:3000/health
```

4. **Acesse a documentação Swagger (se configurada):**

```
http://localhost:3000/api
```

---

## 2. Primeiro Acesso

### 2.1 Registro de Usuário e Organização

O registro cria automaticamente um usuário e uma organização associada.

**Endpoint:** `POST /auth/register`

**Exemplo de requisição:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!",
    "firstName": "João",
    "lastName": "Silva",
    "organizationName": "Minha Empresa"
  }'
```

**Resposta esperada:**

```json
{
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@example.com",
    "firstName": "João",
    "lastName": "Silva"
  },
  "organization": {
    "id": "uuid-da-organizacao",
    "name": "Minha Empresa",
    "slug": "minha-empresa"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

**Importante:**
- Guarde o `accessToken` e `refreshToken` em local seguro
- O `accessToken` expira em 15 minutos
- Use o `refreshToken` para obter novos tokens

### 2.2 Login e Autenticação

Se você já possui uma conta, faça login:

**Endpoint:** `POST /auth/login`

**Exemplo de requisição:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!"
  }'
```

**Resposta esperada:**

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@example.com",
    "firstName": "João",
    "lastName": "Silva"
  }
}
```

### 2.3 Geração de API Key

A API Key permite autenticação sem usar JWT tokens, útil para integrações.

**Endpoint:** `POST /auth/api-keys`

**Exemplo de requisição:**

```bash
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta esperada:**

```json
{
  "apiKey": "org_xxx_yyyyyy",
  "organizationId": "uuid-da-organizacao"
}
```

**⚠️ ATENÇÃO:**
- A API Key é mostrada **apenas uma vez**
- Guarde-a em local seguro
- Use no header `X-API-Key` ou `Authorization: Bearer {apiKey}`

**Exemplo de uso da API Key:**

```bash
curl -X GET http://localhost:3000/documents \
  -H "X-API-Key: org_xxx_yyyyyy"
```

### 2.4 Navegação Inicial no Sistema

Após o registro/login, você pode explorar os seguintes endpoints:

#### Verificar seu perfil

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Listar organizações

```bash
curl -X GET http://localhost:3000/organizations \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Ver detalhes da organização

```bash
curl -X GET http://localhost:3000/organizations/{organizationId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 3. Próximos Passos

Agora que você completou o onboarding básico, siga para:

1. **[Guia de Configuração Básica](../docs/USER_GUIDE.md#2-guia-de-configuração-básica)**
   - Configure sua organização
   - Crie seu primeiro agente

2. **[Guia de Upload de Documentos](../docs/USER_GUIDE.md#3-guia-de-upload-e-processamento-de-documentos)**
   - Faça upload de documentos
   - Entenda o processamento

3. **[Guia de Uso do RAG](../docs/USER_GUIDE.md#4-guia-de-uso-do-sistema-rag)**
   - Faça suas primeiras consultas
   - Otimize os resultados

4. **[Guia de Integração WhatsApp](../docs/USER_GUIDE.md#5-guia-de-integração-whatsapp)**
   - Configure o WhatsApp
   - Teste mensagens automáticas

5. **[Exemplos de API](../docs/API_EXAMPLES.md)**
   - Veja exemplos práticos de uso

---

## Checklist de Onboarding

Use este checklist para garantir que completou todos os passos:

- [ ] Node.js 20+ instalado
- [ ] Docker e Docker Compose instalados
- [ ] Docker Desktop rodando
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Chaves JWT geradas e configuradas
- [ ] Serviços Docker iniciados (`npm run docker:up`)
- [ ] Migrações executadas (`npm run migration:run`)
- [ ] Servidor iniciado (`npm run start:dev`)
- [ ] Usuário registrado ou login realizado
- [ ] API Key gerada (opcional)
- [ ] Endpoints básicos testados

---

## Problemas Comuns

Se encontrar problemas durante o onboarding, consulte:

- **[Guia de Troubleshooting](../docs/TROUBLESHOOTING.md)**
- Seção de troubleshooting no [README.md](../README.md)

---

## Suporte

Para mais informações:
- Consulte a [documentação completa](../README.md)
- Veja os [exemplos de API](../docs/API_EXAMPLES.md)
- Acesse o [guia rápido](../docs/QUICK_START.md)

