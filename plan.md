# Plano Técnico: API NestJS para Agentes WhatsApp com RAG

## 1. Visão Geral do Sistema

### 1.1 Arquitetura de Alto Nível

```

┌─────────────────┐

│   Frontend      │ (React/Vue - painel admin)

│   (Cliente)     │

└────────┬────────┘

         │ HTTPS/REST

         │

┌────────▼─────────────────────────────────────────────┐

│              API NestJS (Backend)                    │

│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │

│  │   Auth   │  │  Users   │  │  Billing │          │

│  │  Module  │  │  Module  │  │  Module  │          │

│  └──────────┘  └──────────┘  └──────────┘          │

│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │

│  │WhatsApp │  │Documents │  │   RAG    │          │

│  │ Module  │  │  Module  │  │  Module  │          │

│  └──────────┘  └──────────┘  └──────────┘          │

│  ┌──────────┐  ┌──────────┐                        │

│  │  Admin   │  │Webhooks │                        │

│  │  Module  │  │  Module  │                        │

│  └──────────┘  └──────────┘                        │

└────────┬─────────────────────────────────────────────┘

         │

    ┌────┴────┬──────────┬──────────┬──────────┬──────────┐

    │         │          │          │          │          │

┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐

│Postgre│ │Redis │ │  S3   │ │Qdrant │ │Stripe │ │WhatsApp│

│  SQL  │ │Cache │ │Storage│ │Vector │ │  API  │ │  API  │

│       │ │Queue │ │       │ │  DB   │ │       │ │       │

└───────┘ └──────┘ └───────┘ └───────┘ └───────┘ └───────┘

         │

    ┌────▼────┐

    │ OpenAI  │

    │ (LLM +  │

    │Embedding│

    │   s)    │

    └─────────┘

```

### 1.2 Componentes Principais

- **API NestJS**: Backend principal com arquitetura modular
- **PostgreSQL**: Banco relacional para dados estruturados
- **Redis**: Cache e filas (BullMQ) para processamento assíncrono
- **Qdrant**: Vector database para embeddings e busca semântica
- **S3**: Armazenamento de documentos e mídias
- **Stripe**: Processamento de pagamentos e assinaturas
- **WhatsApp Business API**: Integração direta para envio/recebimento
- **OpenAI**: Embeddings (text-embedding-3-large) e LLM (gpt-4o)

### 1.3 Fluxos Principais

1. **Onboarding**: Registro → Criação de organização → Plano → Chave API
2. **Upload Documento**: Upload → Parse → Chunk → Embed → Index
3. **Query RAG**: Query → Embed → Search → Context → LLM → Response
4. **Mensagem WhatsApp**: Webhook → Process → RAG → Response → Send

## 2. Módulos NestJS

### 2.1 AuthModule

**Responsabilidades:**

- Registro de usuários e organizações
- Login/logout com JWT (access + refresh tokens)
- Refresh token rotation
- Geração e validação de API keys por organização
- Middleware de autenticação (JWT guard, API key guard)

**Arquivos principais:**

- `auth/auth.module.ts`
- `auth/auth.controller.ts`
- `auth/auth.service.ts`
- `auth/guards/jwt-auth.guard.ts`
- `auth/guards/api-key.guard.ts`
- `auth/strategies/jwt.strategy.ts`
- `auth/dto/login.dto.ts`, `register.dto.ts`

### 2.2 UsersModule

**Responsabilidades:**

- CRUD de usuários
- Gestão de perfis
- Associação usuário-organização
- Roles e permissões (RBAC)

**Arquivos principais:**

- `users/users.module.ts`
- `users/users.controller.ts`
- `users/users.service.ts`
- `users/entities/user.entity.ts`
- `users/dto/create-user.dto.ts`, `update-user.dto.ts`

### 2.3 OrganizationsModule

**Responsabilidades:**

- CRUD de organizações/contas
- Gestão de membros da organização
- Configurações por organização
- Limites e quotas por plano

**Arquivos principais:**

- `organizations/organizations.module.ts`
- `organizations/organizations.controller.ts`
- `organizations/organizations.service.ts`
- `organizations/entities/organization.entity.ts`

### 2.4 BillingModule

**Responsabilidades:**

- Integração com Stripe
- Criação de checkout sessions
- Webhook handling (assinaturas, pagamentos)
- Gestão de planos e features
- Histórico de invoices

**Arquivos principais:**

- `billing/billing.module.ts`
- `billing/billing.controller.ts`
- `billing/billing.service.ts`
- `billing/stripe.service.ts`
- `billing/webhook.controller.ts`
- `billing/entities/subscription.entity.ts`, `invoice.entity.ts`

### 2.5 DocumentsModule

**Responsabilidades:**

- Upload de documentos (multipart/form-data)
- Armazenamento em S3
- Parsing (PDF, DOCX, MD, TXT, imagens com OCR)
- Chunking (tamanho configurável, overlap)
- Versionamento de documentos
- Metadata extraction

**Arquivos principais:**

- `documents/documents.module.ts`
- `documents/documents.controller.ts`
- `documents/documents.service.ts`
- `documents/processors/pdf.processor.ts`
- `documents/processors/docx.processor.ts`
- `documents/processors/image.processor.ts` (OCR)
- `documents/chunking/chunk.service.ts`
- `documents/entities/document.entity.ts`, `document-chunk.entity.ts`

### 2.6 RAGModule

**Responsabilidades:**

- Geração de embeddings (OpenAI)
- Indexação em Qdrant
- Query processing (k-NN search)
- Construção de prompts com contexto
- Chamadas ao LLM (OpenAI GPT-4o)
- Citações e atribuições
- Cache de respostas similares

**Arquivos principais:**

- `rag/rag.module.ts`
- `rag/rag.controller.ts`
- `rag/rag.service.ts`
- `rag/embeddings.service.ts`
- `rag/qdrant.service.ts`
- `rag/llm.service.ts`
- `rag/prompt-builder.service.ts`
- `rag/dto/query.dto.ts`, `query-response.dto.ts`

### 2.7 WhatsAppModule

**Responsabilidades:**

- Recebimento de webhooks do WhatsApp
- Verificação de assinatura do webhook
- Envio de mensagens via WhatsApp Business API
- Gestão de conversas e mensagens
- Integração com RAG para respostas automáticas
- Fallback para atendimento humano

**Arquivos principais:**

- `whatsapp/whatsapp.module.ts`
- `whatsapp/whatsapp.controller.ts` (webhook)
- `whatsapp/whatsapp.service.ts`
- `whatsapp/whatsapp-api.service.ts`
- `whatsapp/message-processor.service.ts`
- `whatsapp/entities/conversation.entity.ts`, `message.entity.ts`

### 2.8 AgentsModule

**Responsabilidades:**

- CRUD de agentes de atendimento
- Configuração de agentes (nome, avatar, instruções)
- Associação agente-organização
- Configurações de comportamento (temperatura, modelo LLM)

**Arquivos principais:**

- `agents/agents.module.ts`
- `agents/agents.controller.ts`
- `agents/agents.service.ts`
- `agents/entities/agent.entity.ts`

### 2.9 AdminModule

**Responsabilidades:**

- Dashboard com métricas
- Reindexação de documentos
- Gestão de jobs/filas
- Logs e auditoria
- Configurações globais

**Arquivos principais:**

- `admin/admin.module.ts`
- `admin/admin.controller.ts`
- `admin/admin.service.ts`
- `admin/dashboard.service.ts`

### 2.10 WebhooksModule

**Responsabilidades:**

- Roteamento de webhooks (Stripe, WhatsApp)
- Verificação de assinaturas
- Processamento assíncrono de eventos
- Logging de eventos

**Arquivos principais:**

- `webhooks/webhooks.module.ts`
- `webhooks/webhooks.controller.ts`
- `webhooks/webhooks.service.ts`
- `webhooks/entities/webhook-event.entity.ts`

### 2.11 CommonModule

**Responsabilidades:**

- Configurações compartilhadas
- Helpers e utilities
- DTOs base
- Exceptions customizadas
- Filters e interceptors

## 3. Modelos de Dados (PostgreSQL)

### 3.1 Entidades Principais

#### User

```sql

CREATE TABLE users (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email VARCHAR(255) UNIQUE NOT NULL,

  password_hash VARCHAR(255) NOT NULL,

  first_name VARCHAR(100),

  last_name VARCHAR(100),

  role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, agent, read_only

  is_active BOOLEAN DEFAULT true,

  email_verified_at TIMESTAMP,

  last_login_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_role ON users(role);

```

#### Organization

```sql

CREATE TABLE organizations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(255) NOT NULL,

  slug VARCHAR(100) UNIQUE NOT NULL,

  api_key_hash VARCHAR(255) UNIQUE, -- hashed API key

  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise

  subscription_status VARCHAR(50) DEFAULT 'inactive', -- active, canceled, past_due

  stripe_customer_id VARCHAR(255),

  stripe_subscription_id VARCHAR(255),

  max_documents INTEGER DEFAULT 10,

  max_agents INTEGER DEFAULT 1,

  max_monthly_messages INTEGER DEFAULT 100,

  settings JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_orgs_slug ON organizations(slug);

CREATE INDEX idx_orgs_stripe_customer ON organizations(stripe_customer_id);

```

#### UserOrganization (Many-to-Many)

```sql

CREATE TABLE user_organizations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, organization_id)

);


CREATE INDEX idx_user_orgs_user ON user_organizations(user_id);

CREATE INDEX idx_user_orgs_org ON user_organizations(organization_id);

```

#### Agent

```sql

CREATE TABLE agents (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,

  avatar_url VARCHAR(500),

  system_prompt TEXT,

  llm_model VARCHAR(100) DEFAULT 'gpt-4o',

  temperature DECIMAL(3,2) DEFAULT 0.7,

  max_tokens INTEGER DEFAULT 1000,

  is_active BOOLEAN DEFAULT true,

  whatsapp_phone_number VARCHAR(20), -- número associado no WhatsApp

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_agents_org ON agents(organization_id);

CREATE INDEX idx_agents_phone ON agents(whatsapp_phone_number);

```

#### Document

```sql

CREATE TABLE documents (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  filename VARCHAR(500) NOT NULL,

  original_filename VARCHAR(500) NOT NULL,

  file_type VARCHAR(50) NOT NULL, -- pdf, docx, md, txt, image

  file_size BIGINT NOT NULL,

  s3_key VARCHAR(1000) NOT NULL,

  s3_bucket VARCHAR(255) NOT NULL,

  mime_type VARCHAR(100),

  status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, processed, failed

  metadata JSONB DEFAULT '{}', -- title, author, pages, etc.

  processing_error TEXT,

  chunk_count INTEGER DEFAULT 0,

  version INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW(),

  processed_at TIMESTAMP

);


CREATE INDEX idx_docs_org ON documents(organization_id);

CREATE INDEX idx_docs_agent ON documents(agent_id);

CREATE INDEX idx_docs_status ON documents(status);

```

#### DocumentChunk

```sql

CREATE TABLE document_chunks (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,

  content TEXT NOT NULL,

  token_count INTEGER,

  page_number INTEGER,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(document_id, chunk_index)

);


CREATE INDEX idx_chunks_doc ON document_chunks(document_id);

CREATE INDEX idx_chunks_content_search ON document_chunks USING gin(to_tsvector('portuguese', content));

```

#### VectorIndexEntry (Qdrant - não é tabela SQL, mas estrutura)

```typescript

// Estrutura de metadados armazenada no Qdrant

interface VectorIndexEntry {

  id: string; // UUID do chunk

  vector: number[]; // embedding (1536 dims para text-embedding-3-large)

  payload: {

    organization_id: string;

    document_id: string;

    chunk_id: string;

    content: string;

    filename: string;

    page_number?: number;

    chunk_index: number;

    document_type: string;

    created_at: string;

  };

}

```

#### Conversation

```sql

CREATE TABLE conversations (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  whatsapp_phone_number VARCHAR(20) NOT NULL, -- número do cliente

  contact_name VARCHAR(255),

  status VARCHAR(50) DEFAULT 'active', -- active, archived, blocked

  metadata JSONB DEFAULT '{}',

  last_message_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_conv_org ON conversations(organization_id);

CREATE INDEX idx_conv_agent ON conversations(agent_id);

CREATE INDEX idx_conv_phone ON conversations(whatsapp_phone_number);

CREATE INDEX idx_conv_last_message ON conversations(last_message_at);

```

#### Message

```sql

CREATE TABLE messages (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  direction VARCHAR(20) NOT NULL, -- inbound, outbound

  whatsapp_message_id VARCHAR(255) UNIQUE,

  content TEXT NOT NULL,

  message_type VARCHAR(50) DEFAULT 'text', -- text, image, document, audio

  media_url VARCHAR(1000),

  is_from_rag BOOLEAN DEFAULT false,

  rag_sources JSONB, -- array de {document_id, chunk_id, score}

  processing_time_ms INTEGER,

  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_messages_conv ON messages(conversation_id);

CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);

CREATE INDEX idx_messages_created ON messages(created_at);

```

#### Subscription

```sql

CREATE TABLE subscriptions (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,

  stripe_customer_id VARCHAR(255) NOT NULL,

  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing

  plan_id VARCHAR(100) NOT NULL,

  current_period_start TIMESTAMP NOT NULL,

  current_period_end TIMESTAMP NOT NULL,

  cancel_at_period_end BOOLEAN DEFAULT false,

  canceled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_subs_org ON subscriptions(organization_id);

CREATE INDEX idx_subs_stripe_id ON subscriptions(stripe_subscription_id);

```

#### Invoice

```sql

CREATE TABLE invoices (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,

  amount INTEGER NOT NULL, -- em centavos

  currency VARCHAR(10) DEFAULT 'BRL',

  status VARCHAR(50) NOT NULL, -- paid, open, void, uncollectible

  invoice_pdf_url VARCHAR(1000),

  hosted_invoice_url VARCHAR(1000),

  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()

);


CREATE INDEX idx_invoices_org ON invoices(organization_id);

CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);

```

#### WebhookEvent

```sql

CREATE TABLE webhook_events (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source VARCHAR(50) NOT NULL, -- stripe, whatsapp

  event_type VARCHAR(100) NOT NULL,

  event_id VARCHAR(255) UNIQUE,

  payload JSONB NOT NULL,

  processed BOOLEAN DEFAULT false,

  processing_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  processed_at TIMESTAMP

);


CREATE INDEX idx_webhooks_source ON webhook_events(source);

CREATE INDEX idx_webhooks_processed ON webhook_events(processed);

CREATE INDEX idx_webhooks_event_id ON webhook_events(event_id);

```

#### Permission (RBAC)

```sql

CREATE TABLE permissions (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) UNIQUE NOT NULL,

  resource VARCHAR(100) NOT NULL, -- documents, agents, billing, etc.

  action VARCHAR(50) NOT NULL, -- create, read, update, delete

  description TEXT

);


CREATE TABLE role_permissions (

  role VARCHAR(50) NOT NULL,

  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  PRIMARY KEY (role, permission_id)

);

```

## 4. Endpoints REST Principais

### 4.1 Autenticação

#### POST /auth/register

**Request:**

```json

{

  "email": "user@example.com",

  "password": "SecurePass123!",

  "firstName": "João",

  "lastName": "Silva",

  "organizationName": "Minha Empresa"

}

```

**Response:** `201 Created`

```json

{

  "user": {

    "id": "uuid",

    "email": "user@example.com",

    "firstName": "João",

    "lastName": "Silva"

  },

  "organization": {

    "id": "uuid",

    "name": "Minha Empresa",

    "slug": "minha-empresa"

  },

  "accessToken": "jwt_token",

  "refreshToken": "refresh_token"

}

```

#### POST /auth/login

**Request:**

```json

{

  "email": "user@example.com",

  "password": "SecurePass123!"

}

```

**Response:** `200 OK`

```json

{

  "accessToken": "jwt_token",

  "refreshToken": "refresh_token",

  "user": { /* user object */ }

}

```

#### POST /auth/refresh

**Request:**

```json

{

  "refreshToken": "refresh_token"

}

```

**Response:** `200 OK`

```json

{

  "accessToken": "new_jwt_token",

  "refreshToken": "new_refresh_token"

}

```

#### POST /auth/logout

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

#### POST /auth/api-keys

**Headers:** `Authorization: Bearer {token}`

**Response:** `201 Created`

```json

{

  "apiKey": "org_xxx_yyyyyy", // mostrar apenas uma vez

  "organizationId": "uuid"

}

```

### 4.2 Usuários e Organizações

#### GET /users/me

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Perfil do usuário atual

#### PUT /users/me

**Request:** DTO com campos atualizáveis

**Response:** `200 OK` - Usuário atualizado

#### GET /organizations

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Lista de organizações do usuário

#### GET /organizations/:id

**Response:** `200 OK` - Detalhes da organização

#### PUT /organizations/:id

**Request:** DTO de atualização

**Response:** `200 OK`

### 4.3 Billing/Stripe

#### POST /billing/create-checkout-session

**Headers:** `Authorization: Bearer {token}`

**Request:**

```json

{

  "planId": "pro_monthly",

  "successUrl": "https://app.example.com/success",

  "cancelUrl": "https://app.example.com/cancel"

}

```

**Response:** `200 OK`

```json

{

  "sessionId": "cs_xxx",

  "url": "https://checkout.stripe.com/..."

}

```

#### GET /billing/subscription

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json

{

  "status": "active",

  "plan": "pro_monthly",

  "currentPeriodEnd": "2024-02-01T00:00:00Z",

  "cancelAtPeriodEnd": false

}

```

#### POST /billing/cancel-subscription

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

#### GET /billing/invoices

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` - Lista de invoices

#### POST /billing/webhook

**Headers:** `stripe-signature: {signature}`

**Body:** Evento Stripe (raw)

**Response:** `200 OK`

### 4.4 Documentos

#### POST /documents/upload

**Headers:** `Authorization: Bearer {token}`, `Content-Type: multipart/form-data`

**Request:**

- `file`: File (PDF, DOCX, MD, TXT, PNG, JPG)
- `agentId`: UUID (opcional)
- `metadata`: JSON string (opcional)

**Response:** `201 Created`

```json

{

  "id": "uuid",

  "filename": "documento.pdf",

  "status": "uploaded",

  "fileSize": 1024000,

  "fileType": "pdf"

}

```

#### GET /documents

**Query params:** `?page=1&limit=20&status=processed&agentId=uuid`

**Response:** `200 OK`

```json

{

  "data": [/* documentos */],

  "pagination": {

    "page": 1,

    "limit": 20,

    "total": 100,

    "totalPages": 5

  }

}

```

#### GET /documents/:id

**Response:** `200 OK` - Detalhes do documento

#### DELETE /documents/:id

**Response:** `204 No Content`

#### POST /documents/:id/process

**Response:** `202 Accepted` - Inicia processamento assíncrono

#### GET /documents/:id/chunks

**Response:** `200 OK` - Lista de chunks do documento

### 4.5 RAG

#### POST /rag/query

**Headers:** `Authorization: Bearer {token}` ou `X-API-Key: {api_key}`

**Request:**

```json

{

  "query": "Qual é a política de reembolso?",

  "agentId": "uuid",

  "conversationId": "uuid", // opcional, para contexto

  "temperature": 0.7,

  "maxTokens": 1000,

  "topK": 5, // número de chunks a recuperar

  "minScore": 0.7, // score mínimo de similaridade

  "includeSources": true

}

```

**Response:** `200 OK`

```json

{

  "answer": "A política de reembolso permite...",

  "sources": [

    {

      "documentId": "uuid",

      "documentName": "politicas.pdf",

      "chunkId": "uuid",

      "chunkIndex": 5,

      "pageNumber": 3,

      "score": 0.89,

      "excerpt": "texto relevante do chunk"

    }

  ],

  "queryId": "uuid",

  "processingTimeMs": 1234,

  "model": "gpt-4o",

  "tokensUsed": 456

}

```

#### GET /rag/sources/:queryId

**Response:** `200 OK` - Fontes detalhadas de uma query anterior

### 4.6 WhatsApp

#### POST /whatsapp/webhook

**Headers:** `X-Hub-Signature-256: {signature}`

**Body:** Webhook payload do WhatsApp

**Response:** `200 OK`

#### POST /whatsapp/send

**Headers:** `Authorization: Bearer {token}` ou `X-API-Key: {api_key}`

**Request:**

```json

{

  "to": "5511999999999",

  "message": "Olá! Como posso ajudar?",

  "agentId": "uuid"

}

```

**Response:** `200 OK`

```json

{

  "messageId": "wamid.xxx",

  "status": "sent",

  "timestamp": "2024-01-15T10:30:00Z"

}

```

#### GET /whatsapp/conversations

**Query params:** `?page=1&limit=20&agentId=uuid&status=active`

**Response:** `200 OK` - Lista de conversas

#### GET /whatsapp/conversations/:id/messages

**Response:** `200 OK` - Mensagens da conversa

### 4.7 Agentes

#### GET /agents

**Response:** `200 OK` - Lista de agentes da organização

#### POST /agents

**Request:**

```json

{

  "name": "Atendente Virtual",

  "systemPrompt": "Você é um assistente útil...",

  "llmModel": "gpt-4o",

  "temperature": 0.7,

  "whatsappPhoneNumber": "5511999999999"

}

```

**Response:** `201 Created`

#### PUT /agents/:id

**Request:** DTO de atualização

**Response:** `200 OK`

#### DELETE /agents/:id

**Response:** `204 No Content`

### 4.8 Admin

#### GET /admin/dashboard

**Headers:** `Authorization: Bearer {token}` (requer role: admin)

**Response:** `200 OK`

```json

{

  "stats": {

    "totalOrganizations": 150,

    "activeSubscriptions": 120,

    "totalDocuments": 5000,

    "totalMessages": 50000,

    "avgResponseTime": 1.2

  },

  "recentActivity": [/* eventos recentes */]

}

```

#### POST /admin/documents/:id/reindex

**Response:** `202 Accepted` - Reindexa documento no vector DB

#### POST /admin/reindex-all

**Query params:** `?organizationId=uuid` (opcional)

**Response:** `202 Accepted` - Reindexa todos os documentos

#### GET /admin/jobs

**Query params:** `?status=pending&type=document_processing`

**Response:** `200 OK` - Status de jobs

## 5. Fluxos Críticos Detalhados

### 5.1 Cadastro e Onboarding

1. **POST /auth/register**

   - Valida email único
   - Hash de senha (bcrypt, rounds=12)
   - Cria User com role='user'
   - Cria Organization com slug único
   - Cria UserOrganization com role='owner'
   - Gera JWT tokens (access + refresh)
   - Retorna tokens e dados do usuário/organização
2. **Geração de API Key** (após login)

   - **POST /auth/api-keys**
   - Gera chave: `org_{org_id}_{random_32_chars}`
   - Hash da chave (SHA-256) para armazenamento
   - Armazena hash em `organizations.api_key_hash`
   - Retorna chave plaintext (apenas uma vez)
   - Cliente deve armazenar localmente

### 5.2 Compra de Plano via Stripe

1. **POST /billing/create-checkout-session**

   - Valida organização existe e usuário tem permissão
   - Cria/recupera Stripe Customer (usando `stripe_customer_id` ou cria novo)
   - Cria Checkout Session com:

     - `customer`: Stripe Customer ID
     - `mode`: 'subscription'
     - `line_items`: [{ price: planId, quantity: 1 }]
     - `success_url`, `cancel_url`
     - `metadata`: { organizationId }
   - Retorna `sessionId` e `url`
2. **Cliente redireciona para URL do Stripe**
3. **Webhook Stripe: checkout.session.completed**

   - **POST /billing/webhook**
   - Verifica assinatura Stripe (header `stripe-signature`)
   - Processa evento:

     - Atualiza `organizations.stripe_customer_id`
     - Cria/atualiza `subscriptions`
     - Atualiza `organizations.subscription_tier` e `subscription_status`
     - Aplica limites do plano (max_documents, max_agents, etc.)
   - Salva evento em `webhook_events`
   - Retorna 200 OK
4. **Webhook Stripe: customer.subscription.updated**

   - Atualiza status da assinatura
   - Ajusta limites conforme novo plano
5. **Webhook Stripe: invoice.paid**

   - Cria registro em `invoices`
   - Atualiza `subscriptions.current_period_end`

### 5.3 Upload e Processamento de Documento

1. **POST /documents/upload**

   - Valida autenticação e permissões
   - Valida tipo de arquivo (whitelist: pdf, docx, md, txt, png, jpg, jpeg)
   - Valida tamanho (limite por plano)
   - Valida quota de documentos da organização
   - Upload para S3:

     - Bucket: `{org_id}/documents/{doc_id}/{filename}`
     - Metadata: `Content-Type`, `organization-id`, `agent-id`
   - Cria registro em `documents` com status='uploaded'
   - Enfileira job assíncrono: `document.process`
   - Retorna documento criado
2. **Job: document.process** (BullMQ)

   - Atualiza status para 'processing'
   - **Parsing:**

     - PDF: `pdf-parse` ou `pdfjs-dist`
     - DOCX: `mammoth` ou `docx`
     - MD/TXT: leitura direta
     - Imagens: Tesseract OCR (`tesseract.js`)
   - **Normalização:**

     - Remove caracteres especiais
     - Normaliza espaços
     - Encoding UTF-8
   - **Metadata extraction:**

     - PDF: título, autor, páginas (via `pdf-lib`)
     - DOCX: propriedades do documento
     - Salva em `documents.metadata`
   - **Chunking:**

     - Tamanho: 500 tokens (configurável)
     - Overlap: 50 tokens
     - Preserva contexto (não quebra no meio de frase)
     - Cria registros em `document_chunks`
   - **Embeddings:**

     - Batch de chunks (max 100 por batch)
     - Chama OpenAI Embeddings API (`text-embedding-3-large`)
     - Aguarda respostas
   - **Indexação Qdrant:**

     - Collection: `documents_{org_id}` (ou collection global com filtro)
     - Upsert vectors com payload:

       ```json

       {

         "organization_id": "uuid",

         "document_id": "uuid",

         "chunk_id": "uuid",

         "content": "texto do chunk",

         "filename": "doc.pdf",

         "page_number": 1,

         "chunk_index": 0

       }

       ```
   - Atualiza `documents.status='processed'`, `processed_at`, `chunk_count`
   - Em caso de erro: `status='failed'`, salva `processing_error`
3. **Retry e DLQ:**

   - Retry exponencial: 3 tentativas (1s, 5s, 30s)
   - Após falhas: move para Dead Letter Queue
   - Admin pode reprocessar via endpoint

### 5.4 Query RAG (Responder Pergunta)

1. **POST /rag/query**

   - Valida autenticação (JWT ou API Key)
   - Valida organização ativa e quota de mensagens
   - Recupera agente (se `agentId` fornecido) ou agente padrão
   - **Embedding da query:**

     - Chama OpenAI Embeddings API com query
     - Obtém vector de 1536 dimensões
   - **Busca no Qdrant:**

     - Collection: `documents_{org_id}` ou filtro por `organization_id`
     - Query: `search(vector, top_k=topK, score_threshold=minScore)`
     - Filtros: `organization_id = {org_id}`, opcionalmente `agent_id = {agent_id}`
     - Retorna chunks ordenados por score
   - **Construção do prompt:**

     - System prompt do agente (ou padrão)
     - Contexto: chunks recuperados (limitado por `maxTokens`)
     - Query do usuário
     - Instruções: "Responda baseado apenas no contexto. Cite as fontes."
   - **Chamada LLM:**

     - Modelo: `agent.llmModel` ou `gpt-4o`
     - Parâmetros: `temperature`, `maxTokens`
     - Stream: false (resposta completa)
   - **Processamento da resposta:**

     - Extrai citações (se LLM incluir)
     - Mapeia chunks para documentos
     - Constrói array de `sources` com metadados
   - **Cache (opcional):**

     - Hash da query + agentId
     - Redis TTL: 1 hora
     - Se cache hit: retorna resposta cached
   - Retorna resposta com `answer`, `sources`, `queryId`, métricas
2. **Logging:**

   - Salva query em tabela `rag_queries` (opcional, para analytics)
   - Métricas: tempo de processamento, tokens usados, custo estimado

### 5.5 Conversação WhatsApp

1. **Webhook WhatsApp: messages**

   - **POST /whatsapp/webhook**
   - Verifica assinatura (header `X-Hub-Signature-256`)
   - Parse do payload:

     ```json

     {

       "entry": [{

         "changes": [{

           "value": {

             "messages": [{

               "id": "wamid.xxx",

               "from": "5511999999999",

               "text": { "body": "Olá" },

               "timestamp": "1234567890"

             }],

             "metadata": {

               "phone_number_id": "xxx"

             }

           }

         }]

       }]

     }

     ```
   - Identifica organização pelo `phone_number_id` (mapeamento em `agents`)
   - **Localiza/abre conversa:**

     - Busca `conversations` por `whatsapp_phone_number`
     - Se não existe: cria nova conversa
     - Atualiza `last_message_at`
   - **Persiste mensagem:**

     - Cria registro em `messages`:

       - `direction='inbound'`
       - `whatsapp_message_id`
       - `content`
       - `conversation_id`
   - **Enfileira processamento:**

     - Job: `whatsapp.process_message`
     - Payload: `{ messageId, conversationId, agentId }`
2. **Job: whatsapp.process_message**

   - Recupera mensagem e conversa
   - **Decisão de roteamento:**

     - Se mensagem contém palavra-chave (ex: "humano"): envia para fila humana
     - Caso contrário: processa via RAG
   - **Processamento RAG:**

     - Chama `ragService.query()` com:

       - Query: conteúdo da mensagem
       - AgentId: agente da conversa
       - ConversationId: para contexto histórico (opcional)
     - Obtém resposta com fontes
   - **Envio via WhatsApp API:**

     - Chama WhatsApp Business API:

       ```

       POST https://graph.facebook.com/v18.0/{phone_number_id}/messages

       {

         "messaging_product": "whatsapp",

         "to": "5511999999999",

         "type": "text",

         "text": { "body": "Resposta do RAG..." }

       }

       ```
     - Headers: `Authorization: Bearer {access_token}`
   - **Persiste resposta:**

     - Cria `messages` com `direction='outbound'`, `is_from_rag=true`
     - Salva `rag_sources` (JSONB)
   - **Tratamento de erros:**

     - Se falha no envio: retry (3x)
     - Se falha no RAG: envia mensagem padrão ou notifica admin
3. **Envio manual: POST /whatsapp/send**

   - Valida permissões
   - Envia mensagem via WhatsApp API
   - Persiste em `messages`
   - Retorna status

## 6. Integrações Externas & Decisões Tecnológicas

### 6.1 WhatsApp Business API (Direto)

**Escolha:** WhatsApp Business API direto via Graph API

**Requisitos:**

- Conta Business verificada no Meta Business Manager
- App criado no Facebook Developers
- Número de telefone verificado
- Webhook configurado com URL HTTPS + TLS
- Access Token (temporário ou permanente)

**Vantagens:**

- Controle total sobre integração
- Sem intermediários (menor latência, menor custo)
- Acesso a todas as features da API

**Desvantagens:**

- Processo de aprovação mais rigoroso
- Requer infraestrutura própria para webhooks
- Gerenciamento manual de tokens

**Implementação:**

- SDK: `axios` para chamadas HTTP
- Webhook verification: validação de assinatura HMAC
- Rate limiting: respeitar limites da API (1000 mensagens/segundo por número)

**Alternativas consideradas:**

- **Twilio**: Mais fácil, sandbox disponível, mas custo por mensagem maior
- **360dialog**: Oficial, mas requer aprovação similar

### 6.2 Vector Database: Qdrant

**Escolha:** Qdrant (self-hosted)

**Configuração:**

- Docker: `qdrant/qdrant:latest`
- Collection: uma por organização ou global com filtros
- Vector size: 1536 (text-embedding-3-large)
- Distance: Cosine
- Payload index: `organization_id`, `document_id`, `agent_id`

**Vantagens:**

- Open-source, sem custos de licença
- Self-hosted (controle de dados)
- Performance excelente
- Fácil de escalar horizontalmente

**Desvantagens:**

- Requer infraestrutura própria
- Manutenção adicional

**Alternativas:**

- **Pinecone**: Managed, fácil, mas custo por uso
- **Milvus**: Enterprise-grade, mais complexo

### 6.3 Embeddings e LLM: OpenAI

**Embeddings:**

- Modelo: `text-embedding-3-large` (1536 dims)
- Batch size: 100 chunks
- Rate limit: 500 RPM (requests per minute)
- Custo: ~$0.00013 por 1K tokens

**LLM:**

- Modelo padrão: `gpt-4o`
- Alternativas: `gpt-4-turbo`, `gpt-3.5-turbo` (configurável por agente)
- Parâmetros: `temperature`, `max_tokens` configuráveis
- Custo: ~$2.50-$5.00 por 1M tokens (dependendo do modelo)

**Implementação:**

- SDK: `openai` (oficial)
- Retry: exponential backoff
- Timeout: 60s por request

### 6.4 Storage: Amazon S3

**Configuração:**

- Bucket: `agent-documents-{env}`
- Estrutura: `{org_id}/documents/{doc_id}/{filename}`
- Lifecycle: mover para Glacier após 90 dias
- Versioning: habilitado
- Encryption: SSE-S3 (server-side encryption)

**Alternativa local (dev):**

- MinIO (S3-compatible)

### 6.5 Banco de Dados: PostgreSQL + Redis

**PostgreSQL:**

- Versão: 15+
- Extensões: `uuid-ossp`, `pg_trgm` (trigram search)
- Connection pooling: PgBouncer
- Backup: daily snapshots + WAL archiving

**Redis:**

- Uso: Cache + BullMQ (filas)
- TTL padrão cache: 1 hora
- Persistência: RDB snapshots

### 6.6 Processamento Assíncrono: BullMQ

**Filas principais:**

- `document.process`: processamento de documentos
- `document.embed`: geração de embeddings
- `whatsapp.process_message`: processamento de mensagens
- `whatsapp.send`: envio de mensagens
- `rag.reindex`: reindexação de documentos

**Configuração:**

- Concurrency: 5 workers por fila
- Retry: exponential backoff (3 tentativas)
- DLQ: habilitada para jobs que falham

## 7. Segurança e Conformidade

### 7.1 Autenticação

**JWT:**

- Access token: expira em 15 minutos
- Refresh token: expira em 7 dias, armazenado em HttpOnly cookie
- Algoritmo: HS256 ou RS256
- Secret: variável de ambiente, rotacionada periodicamente

**API Keys:**

- Formato: `org_{org_id}_{32_chars_random}`
- Hash: SHA-256 antes de armazenar
- Validação: middleware `ApiKeyGuard`
- Rate limiting: 1000 req/min por API key

### 7.2 Autorização (RBAC)

**Roles:**

- `admin`: acesso total
- `agent`: gestão de agentes e documentos da org
- `read_only`: apenas leitura

**Verificações:**

- Middleware: `@RequirePermission(resource, action)`
- Queries: sempre filtrar por `organization_id`
- Validação: usuário pertence à organização

### 7.3 Proteção de Webhooks

**Stripe:**

- Verificação: `stripe.webhooks.constructEvent(payload, signature, secret)`
- Secret: `STRIPE_WEBHOOK_SECRET` (endpoint-specific)

**WhatsApp:**

- Verificação: HMAC-SHA256
- Header: `X-Hub-Signature-256`
- Secret: `WHATSAPP_WEBHOOK_SECRET`

### 7.4 Secrets Management

**Desenvolvimento:**

- Arquivo `.env` (não versionado)
- `.env.example` com placeholders

**Produção:**

- AWS Secrets Manager ou HashiCorp Vault
- Rotação automática de secrets
- Acesso via IAM roles

### 7.5 Encriptação

**At rest:**

- PostgreSQL: TDE (Transparent Data Encryption) ou encriptação de disco
- S3: SSE-S3
- Secrets: encriptados no Secrets Manager

**In transit:**

- TLS 1.3 para todas as conexões
- HTTPS obrigatório (redirect HTTP → HTTPS)

### 7.6 GDPR/LGPD

**Retenção de dados:**

- Configurável por organização
- Padrão: 2 anos para conversas, 1 ano para documentos inativos

**Exportação:**

- **GET /users/me/export**: exporta todos os dados do usuário (JSON)

**Deleção:**

- **DELETE /users/me**: soft delete (marca como deletado, remove PII após 30 dias)
- **DELETE /organizations/:id**: cascata para documentos, conversas (com confirmação)

**Logs:**

- Não logar dados sensíveis (senhas, tokens, conteúdo de mensagens em logs de produção)

## 8. Tratamento de Documentos

### 8.1 Pipeline Completo

```

Upload → Virus Scan (opcional) → Text Extraction → Normalization → 

Chunking → Embeddings → Vector DB Index → Metadata Storage

```

**1. Upload:**

- Validação: tipo, tamanho, quota
- Upload S3: multipart upload para arquivos grandes (>5MB)

**2. Virus Scan (opcional):**

- ClamAV ou AWS GuardDuty
- Se detectado: rejeita upload, notifica admin

**3. Text Extraction:**

- **PDF**: `pdf-parse` ou `pdfjs-dist`

  - Suporta texto e OCR (via `pdf2pic` + Tesseract)
  - Preserva estrutura (títulos, parágrafos)
- **DOCX**: `mammoth` ou `docx`

  - Converte para HTML/Markdown, depois extrai texto
- **MD/TXT**: leitura direta
- **Imagens**: Tesseract OCR (`tesseract.js`)

  - Suporta: PNG, JPG, JPEG
  - Pré-processamento: resize, contrast enhancement

**4. Normalization:**

- Encoding: UTF-8
- Remove caracteres de controle
- Normaliza espaços (múltiplos → único)
- Remove quebras de linha excessivas

**5. Chunking:**

- Estratégia: sliding window
- Tamanho: 500 tokens (configurável por organização)
- Overlap: 50 tokens
- Preserva contexto: não quebra no meio de frase
- Metadata por chunk: `chunk_index`, `page_number`, `token_count`

**6. Embeddings:**

- Batch: 100 chunks por request
- Modelo: `text-embedding-3-large`
- Rate limiting: 500 RPM
- Retry: exponential backoff

**7. Vector DB Index:**

- Collection: `documents_{org_id}` ou global com filtro
- Upsert: `id = chunk_id`, `vector = embedding`, `payload = metadata`
- Índices: `organization_id`, `document_id`, `agent_id`

**8. Metadata Storage:**

- PostgreSQL: `documents.metadata` (JSONB)
- Campos: `title`, `author`, `pages`, `created_date`, `language`

### 8.2 Versionamento

- `documents.version`: incrementa a cada reupload do mesmo arquivo
- Chunks antigos: soft delete (marca como `is_active=false`)
- Reindexação: remove chunks antigos, adiciona novos

### 8.3 Reindexação

**Endpoint: POST /admin/documents/:id/reindex**

- Remove chunks do vector DB
- Reprocessa documento (parsing → chunking → embeddings → index)
- Mantém versão atual

**Endpoint: POST /admin/reindex-all**

- Reindexa todos os documentos de uma organização (ou todas)
- Processa em fila com prioridade baixa
- Notifica admin ao concluir

## 9. Estratégia de Testes

### 9.1 Unit Tests (Jest)

**Cobertura alvo: 80%+**

**Serviços críticos:**

- `auth.service.spec.ts`: login, registro, refresh token
- `rag.service.spec.ts`: query, embedding, busca vector
- `documents.service.spec.ts`: upload, parsing, chunking
- `whatsapp.service.spec.ts`: envio, recebimento, processamento
- `billing.service.spec.ts`: checkout, webhook handling

**Mocks:**

- OpenAI API (nock ou msw)
- Stripe API (stripe-mock)
- WhatsApp API (nock)
- S3 (localstack ou minio)
- Qdrant (mock client)

### 9.2 Integration Tests

**Módulos:**

- `auth.integration.spec.ts`: fluxo completo de autenticação
- `documents.integration.spec.ts`: upload → process → index
- `rag.integration.spec.ts`: query end-to-end com vector DB real
- `billing.integration.spec.ts`: checkout → webhook → subscription

**Setup:**

- Test database (PostgreSQL)
- Test Redis
- Containers Docker para Qdrant, MinIO

### 9.3 E2E Tests (Supertest)

**Fluxos completos:**

- Onboarding: registro → plano → upload → query
- Mensagem WhatsApp: webhook → process → RAG → send
- Billing: checkout → webhook → subscription update

**Ambiente:**

- Docker Compose com todos os serviços
- Stripe test mode
- WhatsApp sandbox (se disponível)

### 9.4 Test Data

- Fixtures: usuários, organizações, documentos de exemplo
- Factories: `UserFactory`, `OrganizationFactory`, `DocumentFactory`

## 10. Observabilidade e Operação

### 10.1 Logging

**Structured JSON logs:**

```json

{

  "timestamp": "2024-01-15T10:30:00Z",

  "level": "info",

  "service": "api",

  "module": "rag",

  "message": "Query processed",

  "organizationId": "uuid",

  "queryId": "uuid",

  "processingTimeMs": 1234,

  "tokensUsed": 456

}

```

**Biblioteca:** `winston` ou `pino`

**Níveis:**

- `error`: erros críticos
- `warn`: avisos (rate limits, quotas)
- `info`: operações importantes (upload, query, payment)
- `debug`: detalhes de desenvolvimento

### 10.2 Tracing (OpenTelemetry)

**Instrumentação:**

- HTTP requests (incoming/outgoing)
- Database queries
- External API calls (OpenAI, Stripe, WhatsApp)
- BullMQ jobs

**Export:**

- Jaeger ou Zipkin (desenvolvimento)
- AWS X-Ray (produção)

### 10.3 Métricas (Prometheus)

**Métricas principais:**

- `http_requests_total`: contador por rota, status
- `http_request_duration_seconds`: histograma
- `rag_queries_total`: contador
- `rag_query_duration_seconds`: histograma
- `document_processing_duration_seconds`: histograma
- `whatsapp_messages_sent_total`: contador
- `stripe_webhooks_processed_total`: contador
- `bullmq_jobs_total`: contador por fila, status

**Grafana:**

- Dashboards: API performance, RAG metrics, document processing, billing

### 10.4 Health Checks

**GET /health**

```json

{

  "status": "ok",

  "timestamp": "2024-01-15T10:30:00Z",

  "services": {

    "database": "ok",

    "redis": "ok",

    "qdrant": "ok",

    "s3": "ok"

  }

}

```

**GET /health/ready**: readiness probe (Kubernetes)

**GET /health/live**: liveness probe (Kubernetes)

### 10.5 Alerting

**Alertas críticos:**

- Falhas em jobs de ingestão (>10% failure rate)
- Falhas em webhooks Stripe/WhatsApp
- Latência alta em queries RAG (>5s p95)
- Quota de API OpenAI próxima do limite
- Erros de processamento de documentos (>5% failure rate)

**Canais:**

- Slack/Discord
- PagerDuty (críticos)
- Email (avisos)

## 11. CI/CD, Deployment e Infra

### 11.1 Docker

**Dockerfile:**

```dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules

COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]

```

**Docker Compose (dev):**

```yaml

services:

  api:

    build: .

    ports:

      - "3000:3000"

    environment:

      - DATABASE_URL=postgresql://...

    depends_on:

      - postgres

      - redis

      - qdrant


  postgres:

    image: postgres:15

    environment:

      POSTGRES_DB: agent_api

      POSTGRES_USER: postgres

      POSTGRES_PASSWORD: postgres

    volumes:

      - postgres_data:/var/lib/postgresql/data


  redis:

    image: redis:7-alpine


  qdrant:

    image: qdrant/qdrant:latest

    ports:

      - "6333:6333"


  minio:

    image: minio/minio:latest

    command: server /data

    ports:

      - "9000:9000"

      - "9001:9001"

```

### 11.2 Kubernetes

**Manifests:**

- `deployment.yaml`: API deployment
- `service.yaml`: ClusterIP service
- `ingress.yaml`: Ingress com TLS
- `configmap.yaml`: Configurações
- `secret.yaml`: Secrets (referência ao Secrets Manager)
- `hpa.yaml`: Horizontal Pod Autoscaler

**Helm Chart (opcional):**

- Templates para todos os recursos
- Values por ambiente (dev, staging, prod)

### 11.3 CI/CD (GitHub Actions)

**Pipeline:**

1. **Lint & Test:**

   - `npm run lint`
   - `npm run test:unit`
   - `npm run test:integration`
2. **Build:**

   - Build Docker image
   - Push para ECR/Docker Hub
3. **Deploy (staging):**

   - Aplica manifests Kubernetes
   - Health check
4. **Deploy (production):**

   - Manual approval
   - Blue-green deployment
   - Rollback automático se health check falhar

### 11.4 Secrets e Config

**Desenvolvimento:**

- `.env` local

**Produção:**

- AWS Secrets Manager:

  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `WHATSAPP_ACCESS_TOKEN`
  - `OPENAI_API_KEY`
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

**ConfigMaps:**

- Configurações não sensíveis (URLs, timeouts, limites)

### 11.5 Autoscaling

**HPA (Horizontal Pod Autoscaler):**

- Métrica: CPU > 70% ou memória > 80%
- Min pods: 2
- Max pods: 10
- Scale down: após 5 minutos de baixa utilização

### 11.6 Backups

**PostgreSQL:**

- Snapshot diário (RDS ou manual)
- WAL archiving (point-in-time recovery)
- Retenção: 30 dias

**Qdrant:**

- Snapshot semanal
- Backup para S3

**S3:**

- Versioning habilitado
- Lifecycle: mover para Glacier após 90 dias

### 11.7 TLS/HTTPS

**Certificados:**

- Let's Encrypt (via cert-manager no Kubernetes)
- Auto-renovação

**Ingress:**

- Nginx Ingress Controller
- TLS termination
- Rate limiting: 100 req/s por IP

## 12. Tarefas/Epics e Checklist MVP

### Epic 1: Infraestrutura Base

- [ ] Configurar PostgreSQL local (Docker)
- [ ] Configurar Redis local (Docker)
- [ ] Configurar Qdrant local (Docker)
- [ ] Configurar MinIO local (Docker)
- [ ] Docker Compose para ambiente dev
- [ ] Scripts de migração (TypeORM ou Prisma)

### Epic 2: Scaffold NestJS

- [ ] Inicializar projeto NestJS
- [ ] Configurar estrutura de módulos
- [ ] Configurar TypeORM/Prisma
- [ ] Configurar validação (class-validator)
- [ ] Configurar logging (winston/pino)
- [ ] Configurar CORS e segurança (helmet)

### Epic 3: Autenticação e Usuários

- [ ] Implementar AuthModule (register, login, refresh)
- [ ] Implementar JWT strategy
- [ ] Implementar guards (JWT, API Key)
- [ ] Implementar UsersModule
- [ ] Implementar OrganizationsModule
- [ ] Geração de API keys
- [ ] Middleware de autorização (RBAC)

### Epic 4: Integração Stripe

- [ ] Configurar Stripe SDK
- [ ] Implementar BillingModule
- [ ] Endpoint: criar checkout session
- [ ] Webhook handler (Stripe signature verification)
- [ ] Atualização de assinaturas
- [ ] Controle de features por plano
- [ ] Endpoint: listar invoices

### Epic 5: Upload e Processamento de Documentos

- [ ] Implementar DocumentsModule
- [ ] Upload para S3 (multipart)
- [ ] Parsers: PDF, DOCX, MD, TXT
- [ ] Parser de imagens com OCR (Tesseract)
- [ ] Serviço de chunking
- [ ] Extração de metadata
- [ ] Versionamento de documentos

### Epic 6: Embeddings e Vector DB

- [ ] Integração OpenAI Embeddings
- [ ] Serviço de geração de embeddings (batch)
- [ ] Integração Qdrant (criação de collections, upsert)
- [ ] Job: processar documento (parsing → chunking → embeddings → index)
- [ ] Configurar BullMQ para jobs assíncronos
- [ ] Retry e DLQ para jobs

### Epic 7: RAG Query

- [ ] Implementar RAGModule
- [ ] Endpoint: POST /rag/query
- [ ] Embedding da query
- [ ] Busca k-NN no Qdrant
- [ ] Construção de prompt com contexto
- [ ] Chamada LLM (OpenAI)
- [ ] Extração de fontes/citações
- [ ] Cache de respostas (Redis)

### Epic 8: Integração WhatsApp

- [ ] Configurar WhatsApp Business API
- [ ] Implementar WhatsAppModule
- [ ] Webhook handler (verificação de assinatura)
- [ ] Persistência de conversas e mensagens
- [ ] Job: processar mensagem (RAG → resposta)
- [ ] Envio de mensagens via WhatsApp API
- [ ] Endpoint: POST /whatsapp/send
- [ ] Fallback para atendimento humano

### Epic 9: Agentes

- [ ] Implementar AgentsModule
- [ ] CRUD de agentes
- [ ] Configuração de agentes (prompt, modelo, temperatura)
- [ ] Associação agente-organização

### Epic 10: Painel Admin

- [ ] Implementar AdminModule
- [ ] Endpoint: GET /admin/dashboard (métricas)
- [ ] Endpoint: POST /admin/documents/:id/reindex
- [ ] Endpoint: POST /admin/reindex-all
- [ ] Endpoint: GET /admin/jobs (status de jobs)

### Epic 11: Testes

- [ ] Unit tests para serviços críticos
- [ ] Integration tests para módulos
- [ ] E2E tests para fluxos principais
- [ ] Configurar coverage reports
- [ ] CI pipeline (GitHub Actions)

### Epic 12: Observabilidade

- [ ] Configurar structured logging
- [ ] Health check endpoints
- [ ] Métricas Prometheus
- [ ] Dashboards Grafana
- [ ] Alerting (Slack/PagerDuty)

### Epic 13: Produção

- [ ] Dockerfile otimizado
- [ ] Kubernetes manifests
- [ ] Secrets management (AWS Secrets Manager)
- [ ] TLS/HTTPS (Let's Encrypt)
- [ ] Backups configurados
- [ ] Autoscaling (HPA)
- [ ] Rate limiting
- [ ] WAF (opcional)

## 13. Exemplos de Payloads

### 13.1 Login

```json

POST /auth/login

{

  "email": "user@example.com",

  "password": "SecurePass123!"

}

```

### 13.2 Upload Documento

```http

POST /documents/upload

Content-Type: multipart/form-data

Authorization: Bearer {token}


file: [binary]

agentId: "uuid"

metadata: {"title": "Manual do Usuário", "category": "docs"}

```

### 13.3 Webhook Stripe

```json

POST /billing/webhook

X-Stripe-Signature: t=1234567890,v1=signature


{

  "id": "evt_xxx",

  "type": "checkout.session.completed",

  "data": {

    "object": {

      "id": "cs_xxx",

      "customer": "cus_xxx",

      "subscription": "sub_xxx",

      "metadata": {

        "organizationId": "uuid"

      }

    }

  }

}

```

### 13.4 RAG Query

```json

POST /rag/query

Authorization: Bearer {token}


{

  "query": "Qual é a política de reembolso da empresa?",

  "agentId": "uuid",

  "conversationId": "uuid",

  "temperature": 0.7,

  "maxTokens": 1000,

  "topK": 5,

  "minScore": 0.7,

  "includeSources": true

}

```

### 13.5 Webhook WhatsApp

```json

POST /whatsapp/webhook

X-Hub-Signature-256: sha256=signature


{

  "object": "whatsapp_business_account",

  "entry": [{

    "id": "xxx",

    "changes": [{

      "value": {

        "messaging_product": "whatsapp",

        "metadata": {

          "display_phone_number": "5511999999999",

          "phone_number_id": "xxx"

        },

        "contacts": [{

          "profile": {

            "name": "João Silva"

          },

          "wa_id": "5511999999999"

        }],

        "messages": [{

          "from": "5511999999999",

          "id": "wamid.xxx",

          "timestamp": "1234567890",

          "text": {

            "body": "Olá, preciso de ajuda"

          },

          "type": "text"

        }]

      },

      "field": "messages"

    }]

  }]

}

```

## 14. Mecanismos de Falha e Reprocessamento

### 14.1 Retries Exponenciais

**Configuração BullMQ:**

```typescript

{

  attempts: 3,

  backoff: {

    type: 'exponential',

    delay: 1000, // 1s, 5s, 30s

  },

  removeOnComplete: true,

  removeOnFail: false, // move para DLQ

}

```

### 14.2 Dead Letter Queue (DLQ)

**Jobs que falham após 3 tentativas:**

- Movidos para DLQ
- Logados com erro completo
- Admin pode reprocessar via endpoint

### 14.3 Idempotência em Webhooks

**Stripe:**

- Verifica `event.id` já processado (tabela `webhook_events`)
- Se já processado: retorna 200 OK sem reprocessar

**WhatsApp:**

- Verifica `message.id` já processado (tabela `messages.whatsapp_message_id`)
- Se duplicado: ignora

### 14.4 Circuit Breaker

**Para APIs externas:**

- OpenAI: circuit breaker (abre após 5 falhas consecutivas)
- WhatsApp: circuit breaker
- Stripe: circuit breaker

**Implementação:** `@nestjs/circuit-breaker` ou `opossum`

## 15. Checklist de Produção

### Segurança

- [ ] TLS/HTTPS configurado (Let's Encrypt)
- [ ] Secrets rotacionados e armazenados no Secrets Manager
- [ ] WAF configurado (Cloudflare ou AWS WAF)
- [ ] Rate limiting ativo (100 req/s por IP, 1000 req/min por API key)
- [ ] CORS configurado corretamente
- [ ] Helmet.js ativo (security headers)
- [ ] Validação de inputs (class-validator)
- [ ] SQL injection prevention (TypeORM parameterized queries)

### Infraestrutura

- [ ] PostgreSQL com backups diários
- [ ] Redis com persistência
- [ ] Qdrant com snapshots
- [ ] S3 com versioning e lifecycle
- [ ] Autoscaling configurado (HPA)
- [ ] Health checks funcionando
- [ ] Logs centralizados (CloudWatch, ELK, ou similar)

### Monitoramento

- [ ] Métricas Prometheus coletadas
- [ ] Dashboards Grafana criados
- [ ] Alertas configurados (Slack/PagerDuty)
- [ ] Tracing OpenTelemetry ativo
- [ ] Uptime monitoring (Pingdom, UptimeRobot)

### Conformidade

- [ ] Política de retenção de dados configurada
- [ ] Endpoint de exportação de dados (GDPR/LGPD)
- [ ] Endpoint de deleção de dados
- [ ] Logs não contêm dados sensíveis
- [ ] Dados encriptados at rest e in transit

### Testes

- [ ] Testes unitários com cobertura >80%
- [ ] Testes de integração para módulos críticos
- [ ] E2E tests para fluxos principais
- [ ] Load testing realizado
- [ ] Testes de disaster recovery (backup/restore)

### Documentação

- [ ] API documentation (Swagger/OpenAPI)
- [ ] README com instruções de setup
- [ ] Documentação de deployment
- [ ] Runbook para operações comuns

## 16. Anexos (Snippets de Código)

### 16.1 Controller de Exemplo (RAG)

```typescript
// rag/rag.controller.ts

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RagService } from './rag.service';
import { QueryDto } from './dto/query.dto';
import { QueryResponseDto } from './dto/query-response.dto';

@Controller('rag')
@UseGuards(JwtAuthGuard, ApiKeyGuard) // Aceita JWT ou API Key
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  async query(
    @Body() dto: QueryDto,
    @Request() req,
  ): Promise<QueryResponseDto> {
    const organizationId = req.user?.organizationId || req.apiKey?.organizationId;
    
    return this.ragService.query({
      ...dto,
      organizationId,
    });
  }
}
```

### 16.2 Service de Exemplo (RAG)

```typescript
// rag/rag.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { QdrantService } from './qdrant.service';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { QueryDto } from './dto/query.dto';
import { QueryResponseDto } from './dto/query-response.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly llmService: LlmService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  async query(dto: QueryDto & { organizationId: string }): Promise<QueryResponseDto> {
    const startTime = Date.now();

    // 1. Gerar embedding da query
    const queryEmbedding = await this.embeddingsService.generateEmbedding(dto.query);

    // 2. Buscar chunks similares no Qdrant
    const chunks = await this.qdrantService.search({
      vector: queryEmbedding,
      organizationId: dto.organizationId,
      topK: dto.topK || 5,
      minScore: dto.minScore || 0.7,
      agentId: dto.agentId,
    });

    if (chunks.length === 0) {
      return {
        answer: 'Não encontrei informações relevantes nos documentos disponíveis.',
        sources: [],
        queryId: null,
        processingTimeMs: Date.now() - startTime,
        model: 'gpt-4o',
        tokensUsed: 0,
      };
    }

    // 3. Construir prompt com contexto
    const prompt = await this.promptBuilder.buildPrompt({
      query: dto.query,
      chunks,
      agentId: dto.agentId,
      conversationId: dto.conversationId,
    });

    // 4. Chamar LLM
    const llmResponse = await this.llmService.generateResponse({
      prompt,
      model: dto.model || 'gpt-4o',
      temperature: dto.temperature || 0.7,
      maxTokens: dto.maxTokens || 1000,
    });

    // 5. Construir resposta com fontes
    const sources = dto.includeSources
      ? chunks.map((chunk) => ({
          documentId: chunk.payload.document_id,
          documentName: chunk.payload.filename,
          chunkId: chunk.id,
          chunkIndex: chunk.payload.chunk_index,
          pageNumber: chunk.payload.page_number,
          score: chunk.score,
          excerpt: chunk.payload.content.substring(0, 200),
        }))
      : [];

    const processingTime = Date.now() - startTime;

    this.logger.log({
      organizationId: dto.organizationId,
      queryId: llmResponse.queryId,
      processingTimeMs: processingTime,
      tokensUsed: llmResponse.tokensUsed,
    });

    return {
      answer: llmResponse.text,
      sources,
      queryId: llmResponse.queryId,
      processingTimeMs: processingTime,
      model: llmResponse.model,
      tokensUsed: llmResponse.tokensUsed,
    };
  }
}
```

### 16.3 Entity de Exemplo (Document)

```typescript
// documents/entities/document.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { DocumentChunk } from './document-chunk.entity';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Agent, { nullable: true, onDelete: 'SET NULL' })
  agent: Agent;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @Column()
  filename: string;

  @Column({ name: 'original_filename' })
  originalFilename: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 's3_bucket' })
  s3Bucket: string;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError: string;

  @Column({ name: 'chunk_count', default: 0 })
  chunkCount: number;

  @Column({ default: 1 })
  version: number;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
  chunks: DocumentChunk[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;
}
```

### 16.4 Job Processor de Exemplo (Document Processing)

```typescript
// documents/processors/document.processor.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus } from '../entities/document.entity';
import { PdfProcessor } from './pdf.processor';
import { DocxProcessor } from './docx.processor';
import { ImageProcessor } from './image.processor';
import { ChunkService } from '../chunking/chunk.service';
import { EmbeddingsService } from '../../rag/embeddings.service';
import { QdrantService } from '../../rag/qdrant.service';
import { S3Service } from '../s3.service';

@Processor('document.process')
@Injectable()
export class DocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private pdfProcessor: PdfProcessor,
    private docxProcessor: DocxProcessor,
    private imageProcessor: ImageProcessor,
    private chunkService: ChunkService,
    private embeddingsService: EmbeddingsService,
    private qdrantService: QdrantService,
    private s3Service: S3Service,
  ) {
    super();
  }

  async process(job: Job<{ documentId: string }>): Promise<void> {
    const { documentId } = job.data;

    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      // 1. Atualizar status para processing
      document.status = DocumentStatus.PROCESSING;
      await this.documentRepository.save(document);

      // 2. Download do S3
      const fileBuffer = await this.s3Service.getObject(
        document.s3Bucket,
        document.s3Key,
      );

      // 3. Extrair texto baseado no tipo
      let text: string;
      let metadata: Record<string, any> = {};

      switch (document.fileType) {
        case 'pdf':
          ({ text, metadata } = await this.pdfProcessor.extract(fileBuffer));
          break;
        case 'docx':
          ({ text, metadata } = await this.docxProcessor.extract(fileBuffer));
          break;
        case 'image':
          ({ text, metadata } = await this.imageProcessor.extract(fileBuffer));
          break;
        case 'md':
        case 'txt':
          text = fileBuffer.toString('utf-8');
          break;
        default:
          throw new Error(`Unsupported file type: ${document.fileType}`);
      }

      // 4. Normalizar texto
      text = this.normalizeText(text);

      // 5. Chunking
      const chunks = await this.chunkService.createChunks(
        text,
        document.id,
        metadata,
      );

      // 6. Gerar embeddings em batch
      const embeddings = await this.embeddingsService.generateBatchEmbeddings(
        chunks.map((chunk) => chunk.content),
      );

      // 7. Indexar no Qdrant
      await this.qdrantService.upsertVectors(
        chunks.map((chunk, index) => ({
          id: chunk.id,
          vector: embeddings[index],
          payload: {
            organization_id: document.organizationId,
            document_id: document.id,
            chunk_id: chunk.id,
            content: chunk.content,
            filename: document.filename,
            page_number: chunk.pageNumber,
            chunk_index: chunk.chunkIndex,
            document_type: document.fileType,
            created_at: new Date().toISOString(),
          },
        })),
        document.organizationId,
      );

      // 8. Atualizar documento
      document.status = DocumentStatus.PROCESSED;
      document.chunkCount = chunks.length;
      document.metadata = { ...document.metadata, ...metadata };
      document.processedAt = new Date();
      await this.documentRepository.save(document);

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}:`, error);
      document.status = DocumentStatus.FAILED;
      document.processingError = error.message;
      await this.documentRepository.save(document);
      throw error;
    }
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
}
```

### 16.5 Guard de Exemplo (API Key)

```typescript
// auth/guards/api-key.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      return false; // Deixa JWT guard tentar
    }

    // Formato: org_{org_id}_{random_32_chars}
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'org') {
      throw new UnauthorizedException('Invalid API key format');
    }

    const organizationId = parts[1];

    // Buscar organização e validar hash
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization || !organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Verificar hash
    const hash = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    if (hash !== organization.apiKeyHash) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Adicionar organização ao request
    request.apiKey = {
      organizationId: organization.id,
      organization: organization,
    };

    return true;
  }

  private extractApiKey(request: any): string | null {
    return (
      request.headers['x-api-key'] ||
      request.headers['authorization']?.replace('Bearer ', '') ||
      null
    );
  }
}
```

### 16.6 DTO de Exemplo (Query)

```typescript
// rag/dto/query.dto.ts

import { IsString, IsOptional, IsUUID, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class QueryDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @IsOptional()
  @IsBoolean()
  includeSources?: boolean;

  @IsOptional()
  @IsString()
  model?: string;
}
```

### 16.7 Módulo Completo de Exemplo (RAG Module)

```typescript
// rag/rag.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingsService } from './embeddings.service';
import { QdrantService } from './qdrant.service';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    BullModule.registerQueue({
      name: 'rag.reindex',
    }),
    HttpModule,
    ConfigModule,
  ],
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingsService,
    QdrantService,
    LlmService,
    PromptBuilderService,
  ],
  exports: [RagService, EmbeddingsService, QdrantService],
})
export class RagModule {}
```

### 16.8 Esquema SQL Inicial Completo

```sql
-- migrations/001_initial_schema.sql

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabela de organizações
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  api_key_hash VARCHAR(255) UNIQUE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  max_documents INTEGER DEFAULT 10,
  max_agents INTEGER DEFAULT 1,
  max_monthly_messages INTEGER DEFAULT 100,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_orgs_stripe_customer ON organizations(stripe_customer_id);

-- Tabela de relacionamento usuário-organização
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX idx_user_orgs_org ON user_organizations(organization_id);

-- Tabela de agentes
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  system_prompt TEXT,
  llm_model VARCHAR(100) DEFAULT 'gpt-4o',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  whatsapp_phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_phone ON agents(whatsapp_phone_number);

-- Tabela de documentos
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  s3_bucket VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'uploaded',
  metadata JSONB DEFAULT '{}',
  processing_error TEXT,
  chunk_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_docs_org ON documents(organization_id);
CREATE INDEX idx_docs_agent ON documents(agent_id);
CREATE INDEX idx_docs_status ON documents(status);

-- Tabela de chunks de documentos
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  page_number INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_chunks_content_search ON document_chunks USING gin(to_tsvector('portuguese', content));

-- Tabela de conversas
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  whatsapp_phone_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conv_org ON conversations(organization_id);
CREATE INDEX idx_conv_agent ON conversations(agent_id);
CREATE INDEX idx_conv_phone ON conversations(whatsapp_phone_number);
CREATE INDEX idx_conv_last_message ON conversations(last_message_at);

-- Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction VARCHAR(20) NOT NULL,
  whatsapp_message_id VARCHAR(255) UNIQUE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  media_url VARCHAR(1000),
  is_from_rag BOOLEAN DEFAULT false,
  rag_sources JSONB,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  plan_id VARCHAR(100) NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subs_org ON subscriptions(organization_id);
CREATE INDEX idx_subs_stripe_id ON subscriptions(stripe_subscription_id);

-- Tabela de invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL,
  invoice_pdf_url VARCHAR(1000),
  hosted_invoice_url VARCHAR(1000),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);

-- Tabela de eventos de webhook
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_webhooks_source ON webhook_events(source);
CREATE INDEX idx_webhooks_processed ON webhook_events(processed);
CREATE INDEX idx_webhooks_event_id ON webhook_events(event_id);
```

### 16.9 Pseudocódigo do Pipeline RAG

```typescript
// Pseudocódigo do fluxo completo de uma query RAG

async function processRAGQuery(query: string, organizationId: string, agentId?: string) {
  // 1. VALIDAÇÃO E CONTEXTO
  validateOrganization(organizationId);
  validateQuota(organizationId);
  const agent = agentId ? await getAgent(agentId) : await getDefaultAgent(organizationId);
  
  // 2. EMBEDDING DA QUERY
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query,
  });
  const queryVector = queryEmbedding.data[0].embedding; // 1536 dims
  
  // 3. BUSCA SEMÂNTICA NO VECTOR DB
  const searchResults = await qdrant.search({
    collection: `documents_${organizationId}`,
    vector: queryVector,
    limit: 5, // topK
    score_threshold: 0.7, // minScore
    filter: {
      must: [
        { key: 'organization_id', match: { value: organizationId } },
        ...(agentId ? [{ key: 'agent_id', match: { value: agentId } }] : []),
      ],
    },
  });
  
  // 4. CONSTRUÇÃO DO PROMPT
  const contextChunks = searchResults.map(result => result.payload.content);
  const context = contextChunks.join('\n\n---\n\n');
  
  const systemPrompt = agent.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = `
Contexto dos documentos:
${context}

Pergunta do usuário: ${query}

Instruções:
- Responda baseado APENAS no contexto fornecido
- Se a informação não estiver no contexto, diga que não sabe
- Cite as fontes quando relevante
- Seja claro e objetivo
`;
  
  // 5. CHAMADA AO LLM
  const llmResponse = await openai.chat.completions.create({
    model: agent.llmModel || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: agent.temperature || 0.7,
    max_tokens: agent.maxTokens || 1000,
  });
  
  const answer = llmResponse.choices[0].message.content;
  
  // 6. MAPEAMENTO DE FONTES
  const sources = searchResults.map(result => ({
    documentId: result.payload.document_id,
    documentName: result.payload.filename,
    chunkId: result.id,
    chunkIndex: result.payload.chunk_index,
    pageNumber: result.payload.page_number,
    score: result.score,
    excerpt: result.payload.content.substring(0, 200),
  }));
  
  // 7. RETORNO
  return {
    answer,
    sources,
    queryId: generateUUID(),
    processingTimeMs: Date.now() - startTime,
    model: agent.llmModel,
    tokensUsed: llmResponse.usage.total_tokens,
  };
}
```

### 16.10 Configuração de Ambiente (.env.example)

```bash
# .env.example

# Aplicação
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_api
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
WHATSAPP_API_VERSION=v18.0

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_LLM_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_PREFIX=documents_

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=agent-documents-dev
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

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

### 16.11 Docker Compose Completo

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: agent_api_postgres
    environment:
      POSTGRES_DB: agent_api
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: agent_api_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  qdrant:
    image: qdrant/qdrant:latest
    container_name: agent_api_qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: agent_api_minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: agent_api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agent_api
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - S3_ENDPOINT=http://minio:9000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_healthy
      minio:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./node_modules:/app/node_modules
    command: npm run start:dev

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  minio_data:
```

## 17. Ordem de Implementação Recomendada

### Fase 1: Fundação (Semanas 1-2)
1. Configurar ambiente de desenvolvimento (Docker Compose)
2. Scaffold do projeto NestJS
3. Configurar TypeORM e migrações
4. Implementar AuthModule básico (register, login)
5. Implementar UsersModule e OrganizationsModule

### Fase 2: Core Features (Semanas 3-4)
1. Implementar BillingModule (Stripe checkout + webhooks)
2. Implementar DocumentsModule (upload + S3)
3. Implementar parsers básicos (PDF, TXT)
4. Implementar chunking service
5. Configurar BullMQ e filas

### Fase 3: RAG e Vector DB (Semanas 5-6)
1. Integrar OpenAI Embeddings
2. Integrar Qdrant
3. Implementar pipeline completo: upload → parse → chunk → embed → index
4. Implementar RAGModule com query endpoint
5. Testes de integração do pipeline RAG

### Fase 4: WhatsApp (Semanas 7-8)
1. Configurar WhatsApp Business API
2. Implementar WhatsAppModule
3. Webhook handler para mensagens recebidas
4. Integração RAG com WhatsApp (respostas automáticas)
5. Persistência de conversas e mensagens

### Fase 5: Agentes e Admin (Semanas 9-10)
1. Implementar AgentsModule (CRUD)
2. Implementar AdminModule (dashboard, reindex)
3. Endpoints de gestão e métricas
4. Testes E2E dos fluxos principais

### Fase 6: Produção (Semanas 11-12)
1. Configurar observabilidade (logging, métricas, tracing)
2. Health checks e monitoramento
3. CI/CD pipeline
4. Kubernetes manifests
5. Documentação completa
6. Load testing e otimizações

## 18. Considerações Finais

### Performance
- Cache de respostas RAG similares (Redis, TTL 1h)
- Batch processing de embeddings (100 chunks por vez)
- Connection pooling (PgBouncer para PostgreSQL)
- CDN para assets estáticos (opcional)

### Escalabilidade
- Horizontal scaling da API (stateless)
- Sharding de collections no Qdrant por organização (se necessário)
- Filas separadas por tipo de job (prioridades)
- Read replicas do PostgreSQL para queries de leitura

### Custos Estimados (Mensal, 1000 organizações ativas)
- OpenAI: ~$500-1000 (embeddings + LLM)
- Stripe: % das transações
- AWS S3: ~$50-100 (storage + transfer)
- Infraestrutura (servidores): ~$200-500
- WhatsApp Business API: ~$0.005-0.01 por mensagem

### Próximos Passos Após MVP
- Suporte a múltiplos idiomas
- Fine-tuning de modelos LLM
- Analytics avançado (dashboards)
- Integração com outros canais (Telegram, Email)
- API GraphQL (além de REST)
- WebSockets para updates em tempo real
- Multi-tenancy avançado
