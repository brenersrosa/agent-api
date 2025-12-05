# Guia de Usuário - Sistema de Agentes WhatsApp com RAG

## Índice

1. [Introdução](#1-introdução)
2. [Guia de Configuração Básica](#2-guia-de-configuração-básica)
3. [Guia de Upload e Processamento de Documentos](#3-guia-de-upload-e-processamento-de-documentos)
4. [Guia de Uso do Sistema RAG](#4-guia-de-uso-do-sistema-rag)
5. [Guia de Integração WhatsApp](#5-guia-de-integração-whatsapp)
6. [Guia de Assinaturas e Billing](#6-guia-de-assinaturas-e-billing)
7. [Guia de Administração](#7-guia-de-administração)

---

## 1. Introdução

Este guia detalha como usar todas as funcionalidades principais do sistema de Agentes WhatsApp com RAG. O sistema permite criar agentes inteligentes que respondem automaticamente a mensagens do WhatsApp usando informações de documentos que você faz upload.

### Fluxo Geral do Sistema

```
1. Upload de Documentos → 2. Processamento e Indexação → 3. Criação de Agente → 
4. Configuração WhatsApp → 5. Mensagens Automáticas via RAG
```

---

## 2. Guia de Configuração Básica

### 2.1 Configuração da Organização

#### Visualizar Informações da Organização

**Endpoint:** `GET /organizations/{id}`

```bash
curl -X GET http://localhost:3000/organizations/{organizationId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
{
  "id": "uuid",
  "name": "Minha Empresa",
  "slug": "minha-empresa",
  "subscriptionTier": "free",
  "subscriptionStatus": "inactive",
  "maxDocuments": 10,
  "maxAgents": 1,
  "maxMonthlyMessages": 100,
  "settings": {},
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

#### Atualizar Configurações da Organização

**Endpoint:** `PUT /organizations/{id}`

```bash
curl -X PUT http://localhost:3000/organizations/{organizationId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "timezone": "America/Sao_Paulo",
      "language": "pt-BR"
    }
  }'
```

### 2.2 Configuração de Agentes

#### Criar um Agente

**Endpoint:** `POST /agents`

```bash
curl -X POST http://localhost:3000/agents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Atendente Virtual",
    "systemPrompt": "Você é um assistente virtual especializado em atendimento ao cliente. Seja sempre educado, objetivo e útil.",
    "llmModel": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 1000,
    "whatsappPhoneNumber": "5511999999999"
  }'
```

**Parâmetros:**

- `name` (obrigatório): Nome do agente
- `avatarUrl` (opcional): URL do avatar do agente (pode ser URL externa ou será definido via upload separado)
- `systemPrompt` (opcional): Instruções de comportamento do agente
- `llmModel` (opcional): Modelo LLM a usar (padrão: "gpt-4o")
- `temperature` (opcional): Criatividade (0-1, padrão: 0.7)
- `maxTokens` (opcional): Máximo de tokens na resposta (padrão: 1000)
- `whatsappPhoneNumber` (opcional): Número WhatsApp associado

**Nota sobre Avatar:** Você pode definir o avatar de duas formas:
1. Via JSON usando `avatarUrl` com uma URL externa
2. Via upload de arquivo usando o endpoint `POST /agents/{id}/avatar` (recomendado)

**Resposta:**

```json
{
  "id": "uuid-do-agente",
  "organizationId": "uuid-da-organizacao",
  "name": "Atendente Virtual",
  "systemPrompt": "Você é um assistente virtual...",
  "llmModel": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 1000,
  "isActive": true,
  "whatsappPhoneNumber": "5511999999999",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Listar Agentes

**Endpoint:** `GET /agents`

```bash
curl -X GET http://localhost:3000/agents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Atualizar um Agente

**Endpoint:** `PUT /agents/{id}`

```bash
curl -X PUT http://localhost:3000/agents/{agentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Nova instrução do agente",
    "temperature": 0.8
  }'
```

#### Deletar um Agente

**Endpoint:** `DELETE /agents/{id}`

```bash
curl -X DELETE http://localhost:3000/agents/{agentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Upload de Avatar do Agente

**Endpoint:** `POST /agents/{id}/avatar`

O upload de avatar é feito em uma rota separada para facilitar o manuseio no front-end. O arquivo de imagem é enviado via `multipart/form-data` e o agente é atualizado automaticamente com a URL do avatar.

**Formatos suportados:** PNG, JPG, JPEG, WEBP, SVG
**Tamanho máximo:** 5MB

```bash
curl -X POST http://localhost:3000/agents/{agentId}/avatar \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -F "file=@/caminho/para/avatar.png"
```

**Resposta:**

```json
{
  "id": "uuid-do-agente",
  "organizationId": "uuid-da-organizacao",
  "name": "Atendente Virtual",
  "avatarUrl": "http://localhost:9000/agent-documents-dev/{orgId}/avatars/{agentId}/avatar.png",
  "systemPrompt": "Você é um assistente virtual...",
  "llmModel": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 1000,
  "isActive": true,
  "whatsappPhoneNumber": "5511999999999",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Notas:**
- O avatar anterior é automaticamente removido do S3 ao fazer um novo upload
- Se o agente não pertence à sua organização, retornará erro 403
- A URL retornada aponta para o arquivo no S3/MinIO

#### Remover Avatar do Agente

**Endpoint:** `DELETE /agents/{id}/avatar`

Remove o avatar do agente e limpa o campo `avatarUrl`.

```bash
curl -X DELETE http://localhost:3000/agents/{agentId}/avatar \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
{
  "id": "uuid-do-agente",
  "organizationId": "uuid-da-organizacao",
  "name": "Atendente Virtual",
  "avatarUrl": null,
  "systemPrompt": "Você é um assistente virtual...",
  "llmModel": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 1000,
  "isActive": true,
  "whatsappPhoneNumber": "5511999999999",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

---

## 3. Guia de Upload e Processamento de Documentos

### 3.1 Upload de Documentos

#### Formatos Suportados

- **PDF** (.pdf)
- **Word** (.docx)
- **Markdown** (.md)
- **Texto** (.txt)
- **Imagens** (.png, .jpg, .jpeg) - com OCR

#### Fazer Upload de um Documento

**Endpoint:** `POST /documents/upload`

```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -F "file=@/caminho/para/documento.pdf" \
  -F "agentId=uuid-do-agente"
```

**Parâmetros:**

- `file` (obrigatório): Arquivo a ser enviado
- `agentId` (opcional): ID do agente para associar o documento

**Resposta:**

```json
{
  "id": "uuid-do-documento",
  "filename": "documento.pdf",
  "originalFilename": "documento.pdf",
  "fileType": "pdf",
  "fileSize": 1024000,
  "status": "uploaded",
  "organizationId": "uuid-da-organizacao",
  "agentId": "uuid-do-agente",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Status do Documento:**

- `uploaded`: Documento enviado, aguardando processamento
- `processing`: Sendo processado
- `processed`: Processado com sucesso e indexado
- `failed`: Falha no processamento

#### Listar Documentos

**Endpoint:** `GET /documents`

```bash
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Query Parameters (opcionais):**

- `status`: Filtrar por status (uploaded, processing, processed, failed)
- `agentId`: Filtrar por agente

**Exemplo:**

```bash
curl -X GET "http://localhost:3000/documents?status=processed&agentId=uuid" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Ver Detalhes de um Documento

**Endpoint:** `GET /documents/{id}`

```bash
curl -X GET http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
{
  "id": "uuid",
  "filename": "documento.pdf",
  "fileType": "pdf",
  "fileSize": 1024000,
  "status": "processed",
  "chunkCount": 25,
  "metadata": {
    "title": "Manual do Usuário",
    "pages": 10,
    "author": "Sistema"
  },
  "processedAt": "2024-01-15T10:05:00Z",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Deletar um Documento

**Endpoint:** `DELETE /documents/{id}`

```bash
curl -X DELETE http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 3.2 Processamento e Indexação

#### Entendimento do Pipeline

Quando você faz upload de um documento, ele passa por este processo:

1. **Upload**: Arquivo enviado para S3/MinIO
2. **Parsing**: Extração de texto (PDF, DOCX, OCR para imagens)
3. **Chunking**: Divisão em pedaços menores (chunks)
4. **Embeddings**: Geração de vetores semânticos
5. **Indexação**: Armazenamento no vector database (Qdrant)

**Tempo estimado:** 1-5 minutos dependendo do tamanho do arquivo

#### Verificar Status de Processamento

Monitore o status do documento:

```bash
# Verificar status
curl -X GET http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

Quando `status` for `processed`, o documento está pronto para uso no RAG.

#### Reindexação de Documentos

Se necessário reindexar um documento (após atualização, por exemplo):

**Endpoint:** `POST /admin/documents/{id}/reindex`

```bash
curl -X POST http://localhost:3000/admin/documents/{documentId}/reindex \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Nota:** Requer permissões de administrador.

---

## 4. Guia de Uso do Sistema RAG

### 4.1 Consultas RAG Básicas

#### Fazer uma Query RAG

**Endpoint:** `POST /rag/query`

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Qual é a política de reembolso?",
    "agentId": "uuid-do-agente",
    "topK": 5,
    "minScore": 0.7,
    "includeSources": true
  }'
```

**Parâmetros:**

- `query` (obrigatório): Pergunta a ser respondida
- `agentId` (opcional): ID do agente (usa documentos associados)
- `conversationId` (opcional): ID da conversa (para contexto)
- `temperature` (opcional): Criatividade da resposta (0-1)
- `maxTokens` (opcional): Máximo de tokens na resposta
- `topK` (opcional): Número de chunks a recuperar (padrão: 5)
- `minScore` (opcional): Score mínimo de similaridade (0-1, padrão: 0.7)
- `includeSources` (opcional): Incluir fontes na resposta (padrão: true)

**Resposta:**

```json
{
  "answer": "A política de reembolso permite devoluções em até 30 dias após a compra...",
  "sources": [
    {
      "documentId": "uuid",
      "documentName": "politicas.pdf",
      "chunkId": "uuid",
      "chunkIndex": 5,
      "pageNumber": 3,
      "score": 0.89,
      "excerpt": "texto relevante do chunk..."
    }
  ],
  "queryId": "uuid",
  "processingTimeMs": 1234,
  "model": "gpt-4o",
  "tokensUsed": 456
}
```

#### Entendimento das Respostas

- **answer**: Resposta gerada pelo LLM baseada nos documentos
- **sources**: Chunks de documentos usados como fonte
  - **score**: Similaridade (0-1, quanto maior melhor)
  - **excerpt**: Trecho do documento usado
- **processingTimeMs**: Tempo de processamento em milissegundos
- **tokensUsed**: Tokens consumidos (afeta custo)

### 4.2 Otimização de Consultas

#### Ajuste de Parâmetros

**topK (Número de Chunks):**
- **Menor (3-5)**: Respostas mais focadas, menos contexto
- **Maior (10-20)**: Mais contexto, pode incluir informações menos relevantes

**minScore (Score Mínimo):**
- **Alto (0.8-0.9)**: Apenas chunks muito relevantes
- **Baixo (0.5-0.6)**: Inclui chunks menos relevantes

**Exemplo otimizado:**

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como funciona o processo de devolução?",
    "agentId": "uuid-do-agente",
    "topK": 3,
    "minScore": 0.8,
    "temperature": 0.5,
    "includeSources": true
  }'
```

#### Uso de Contexto de Conversação

Para manter contexto em conversas:

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "E quanto tempo leva?",
    "agentId": "uuid-do-agente",
    "conversationId": "uuid-da-conversa"
  }'
```

O sistema usará o histórico da conversa para melhorar a resposta.

#### Filtragem por Agente

Ao especificar `agentId`, apenas documentos associados a esse agente serão considerados:

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Qual é o horário de funcionamento?",
    "agentId": "uuid-do-agente-especifico"
  }'
```

---

## 5. Guia de Integração WhatsApp

### 5.1 Configuração Inicial

#### Configurar Webhook

O webhook do WhatsApp deve apontar para:

```
POST http://seu-dominio.com/whatsapp/webhook
```

**Configuração no PlugzAPI:**

1. Acesse o painel do PlugzAPI
2. Configure o webhook URL
3. Configure o webhook secret no `.env`:

```env
PLUGZAPI_WEBHOOK_SECRET=seu-secret-aqui
```

#### Associar Número WhatsApp ao Agente

Ao criar ou atualizar um agente, inclua o número:

```bash
curl -X PUT http://localhost:3000/agents/{agentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsappPhoneNumber": "5511999999999"
  }'
```

**Formato do número:** Código do país + DDD + número (sem espaços ou caracteres especiais)

#### Verificar Conectividade

Teste o webhook enviando uma mensagem de teste do WhatsApp para o número configurado.

### 5.2 Operação do Sistema

#### Fluxo de Mensagens Recebidas

1. **Mensagem chega no WhatsApp**
2. **Webhook recebe a mensagem** (`POST /whatsapp/webhook`)
3. **Sistema identifica o agente** pelo número
4. **Query RAG é executada** automaticamente
5. **Resposta é enviada** via WhatsApp

#### Envio Manual de Mensagens

**Endpoint:** `POST /whatsapp/send`

```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Como posso ajudar?",
    "agentId": "uuid-do-agente"
  }'
```

**Resposta:**

```json
{
  "messageId": "wamid.xxx",
  "status": "sent",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Visualizar Conversas

**Endpoint:** `GET /whatsapp/conversations`

```bash
curl -X GET http://localhost:3000/whatsapp/conversations \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
[
  {
    "id": "uuid",
    "whatsappPhoneNumber": "5511999999999",
    "contactName": "João Silva",
    "status": "active",
    "lastMessageAt": "2024-01-15T10:30:00Z",
    "agentId": "uuid-do-agente",
    "createdAt": "2024-01-15T09:00:00Z"
  }
]
```

#### Ver Mensagens de uma Conversa

**Endpoint:** `GET /whatsapp/conversations/{id}/messages`

```bash
curl -X GET http://localhost:3000/whatsapp/conversations/{conversationId}/messages \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 6. Guia de Assinaturas e Billing

### 6.1 Planos Disponíveis

#### Listar Planos

**Endpoint:** `GET /plans`

```bash
curl -X GET http://localhost:3000/plans
```

**Resposta:**

```json
[
  {
    "id": "uuid",
    "name": "Plano Pro",
    "description": "Plano profissional",
    "price": 99.90,
    "currency": "BRL",
    "billingInterval": "monthly",
    "features": {
      "maxDocuments": 100,
      "maxAgents": 5,
      "maxMonthlyMessages": 10000
    },
    "isActive": true
  }
]
```

#### Comparação de Features

Cada plano tem limites diferentes:

- **Free**: 10 documentos, 1 agente, 100 mensagens/mês
- **Pro**: 100 documentos, 5 agentes, 10.000 mensagens/mês
- **Enterprise**: Ilimitado (sob consulta)

### 6.2 Processo de Assinatura

#### Criar Checkout Session

**Endpoint:** `POST /billing/create-checkout-session`

```bash
curl -X POST http://localhost:3000/billing/create-checkout-session \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "successUrl": "https://app.example.com/success",
    "cancelUrl": "https://app.example.com/cancel"
  }'
```

**Resposta:**

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### Processar Pagamento

1. Redirecione o usuário para a `url` retornada
2. Usuário completa o pagamento no Stripe
3. Webhook do Stripe atualiza a assinatura automaticamente

#### Verificar Status de Assinatura

**Endpoint:** `GET /billing/subscription`

```bash
curl -X GET http://localhost:3000/billing/subscription \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
{
  "status": "active",
  "plan": "pro_monthly",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false
}
```

#### Visualizar Invoices

**Endpoint:** `GET /billing/invoices`

```bash
curl -X GET http://localhost:3000/billing/invoices \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Cancelar Assinatura

**Endpoint:** `POST /billing/cancel-subscription`

```bash
curl -X POST http://localhost:3000/billing/cancel-subscription \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 7. Guia de Administração

### 7.1 Dashboard Administrativo

#### Obter Métricas

**Endpoint:** `GET /admin/dashboard`

```bash
curl -X GET http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Resposta:**

```json
{
  "stats": {
    "totalOrganizations": 150,
    "activeSubscriptions": 120,
    "totalDocuments": 5000,
    "totalMessages": 50000,
    "avgResponseTime": 1.2
  },
  "recentActivity": [
    {
      "type": "document_uploaded",
      "organizationId": "uuid",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Nota:** Requer permissões de administrador.

### 7.2 Operações Administrativas

#### Reindexar Documento

**Endpoint:** `POST /admin/documents/{id}/reindex`

```bash
curl -X POST http://localhost:3000/admin/documents/{documentId}/reindex \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

#### Reindexar Todos os Documentos

**Endpoint:** `POST /admin/reindex-all`

```bash
curl -X POST "http://localhost:3000/admin/reindex-all?organizationId=uuid" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Query Parameters:**
- `organizationId` (opcional): Reindexar apenas de uma organização

---

## Boas Práticas

1. **Documentos:**
   - Use documentos bem estruturados
   - Evite documentos muito grandes (divida se necessário)
   - Mantenha documentos atualizados

2. **Agentes:**
   - Configure system prompts claros e específicos
   - Ajuste temperatura conforme necessidade (mais criativo vs mais preciso)
   - Teste diferentes configurações

3. **RAG:**
   - Ajuste `topK` e `minScore` conforme qualidade dos resultados
   - Use `conversationId` para manter contexto
   - Monitore `tokensUsed` para controlar custos

4. **WhatsApp:**
   - Configure webhooks corretamente
   - Monitore conversas regularmente
   - Teste antes de colocar em produção

---

## Próximos Passos

- Veja [exemplos práticos de API](../docs/API_EXAMPLES.md)
- Consulte o [guia de troubleshooting](../docs/TROUBLESHOOTING.md)
- Acesse o [guia rápido](../docs/QUICK_START.md)

