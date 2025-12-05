# Exemplos de API - Sistema de Agentes WhatsApp com RAG

## Índice

1. [Autenticação](#1-autenticação)
2. [Usuários e Organizações](#2-usuários-e-organizações)
3. [Agentes](#3-agentes)
4. [Documentos](#4-documentos)
5. [RAG](#5-rag)
6. [WhatsApp](#6-whatsapp)
7. [Billing](#7-billing)
8. [Tratamento de Erros](#8-tratamento-de-erros)

---

## 1. Autenticação

### 1.1 Registro

**curl:**

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

**JavaScript (fetch):**

```javascript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'SenhaSegura123!',
    firstName: 'João',
    lastName: 'Silva',
    organizationName: 'Minha Empresa',
  }),
});

const data = await response.json();
console.log(data);
```

**Python (requests):**

```python
import requests

response = requests.post(
    'http://localhost:3000/auth/register',
    json={
        'email': 'usuario@example.com',
        'password': 'SenhaSegura123!',
        'firstName': 'João',
        'lastName': 'Silva',
        'organizationName': 'Minha Empresa',
    }
)

data = response.json()
print(data)
```

**Resposta esperada:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@example.com",
    "firstName": "João",
    "lastName": "Silva"
  },
  "organization": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Minha Empresa",
    "slug": "minha-empresa"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Login

**curl:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123!"
  }'
```

**JavaScript:**

```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'SenhaSegura123!',
  }),
});

const { accessToken, refreshToken, user } = await response.json();
// Guarde os tokens para uso posterior
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

**Python:**

```python
import requests

response = requests.post(
    'http://localhost:3000/auth/login',
    json={
        'email': 'usuario@example.com',
        'password': 'SenhaSegura123!',
    }
)

data = response.json()
access_token = data['accessToken']
refresh_token = data['refreshToken']
```

### 1.3 Refresh Token

**curl:**

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu_refresh_token_aqui"
  }'
```

**JavaScript:**

```javascript
const refreshToken = localStorage.getItem('refreshToken');

const response = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ refreshToken }),
});

const { accessToken, refreshToken: newRefreshToken } = await response.json();
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', newRefreshToken);
```

### 1.4 Gerar API Key

**curl:**

```bash
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/auth/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const { apiKey } = await response.json();
// ⚠️ Guarde a API Key imediatamente - ela só é mostrada uma vez!
console.log('API Key:', apiKey);
```

---

## 2. Usuários e Organizações

### 2.1 Obter Perfil do Usuário

**curl:**

```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/users/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const user = await response.json();
console.log(user);
```

### 2.2 Listar Organizações

**curl:**

```bash
curl -X GET http://localhost:3000/organizations \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**Python:**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
}

response = requests.get(
    'http://localhost:3000/organizations',
    headers=headers
)

organizations = response.json()
print(organizations)
```

### 2.3 Obter Detalhes da Organização

**curl:**

```bash
curl -X GET http://localhost:3000/organizations/{organizationId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 3. Agentes

### 3.1 Criar Agente

**curl:**

```bash
curl -X POST http://localhost:3000/agents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Atendente Virtual",
    "systemPrompt": "Você é um assistente virtual especializado em atendimento ao cliente.",
    "llmModel": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 1000,
    "whatsappPhoneNumber": "5511999999999"
  }'
```

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/agents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Atendente Virtual',
    systemPrompt: 'Você é um assistente virtual especializado em atendimento ao cliente.',
    llmModel: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    whatsappPhoneNumber: '5511999999999',
  }),
});

const agent = await response.json();
console.log('Agente criado:', agent);
```

**Python:**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json',
}

data = {
    'name': 'Atendente Virtual',
    'systemPrompt': 'Você é um assistente virtual especializado em atendimento ao cliente.',
    'llmModel': 'gpt-4o',
    'temperature': 0.7,
    'maxTokens': 1000,
    'whatsappPhoneNumber': '5511999999999',
}

response = requests.post(
    'http://localhost:3000/agents',
    headers=headers,
    json=data
)

agent = response.json()
print(agent)
```

### 3.2 Listar Agentes

**curl:**

```bash
curl -X GET http://localhost:3000/agents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 3.3 Atualizar Agente

**curl:**

```bash
curl -X PUT http://localhost:3000/agents/{agentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Nova instrução do agente",
    "temperature": 0.8
  }'
```

### 3.4 Deletar Agente

**curl:**

```bash
curl -X DELETE http://localhost:3000/agents/{agentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 3.5 Upload de Avatar do Agente

**curl:**

```bash
curl -X POST http://localhost:3000/agents/{agentId}/avatar \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -F "file=@/caminho/para/avatar.png"
```

**JavaScript (FormData):**

```javascript
const accessToken = localStorage.getItem('accessToken');
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);

const response = await fetch(`http://localhost:3000/agents/${agentId}/avatar`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const agent = await response.json();
console.log('Avatar atualizado:', agent);
```

**Python:**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
}

files = {
    'file': ('avatar.png', open('/caminho/para/avatar.png', 'rb'), 'image/png'),
}

response = requests.post(
    f'http://localhost:3000/agents/{agent_id}/avatar',
    headers=headers,
    files=files
)

agent = response.json()
print(agent)
```

**Resposta esperada:**

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
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3.6 Remover Avatar do Agente

**curl:**

```bash
curl -X DELETE http://localhost:3000/agents/{agentId}/avatar \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch(`http://localhost:3000/agents/${agentId}/avatar`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});

const agent = await response.json();
console.log('Avatar removido:', agent);
```

**Python:**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
}

response = requests.delete(
    f'http://localhost:3000/agents/{agent_id}/avatar',
    headers=headers
)

agent = response.json()
print(agent)
```

---

## 4. Documentos

### 4.1 Upload de Documento

**curl:**

```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -F "file=@/caminho/para/documento.pdf" \
  -F "agentId=uuid-do-agente"
```

**JavaScript (FormData):**

```javascript
const accessToken = localStorage.getItem('accessToken');
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);
formData.append('agentId', 'uuid-do-agente');

const response = await fetch('http://localhost:3000/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    // Não defina Content-Type - o browser fará isso automaticamente
  },
  body: formData,
});

const document = await response.json();
console.log('Documento enviado:', document);
```

**Python (requests):**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
}

files = {
    'file': ('documento.pdf', open('/caminho/para/documento.pdf', 'rb'), 'application/pdf'),
}

data = {
    'agentId': 'uuid-do-agente',
}

response = requests.post(
    'http://localhost:3000/documents/upload',
    headers=headers,
    files=files,
    data=data
)

document = response.json()
print(document)
```

**Resposta esperada:**

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "filename": "documento.pdf",
  "originalFilename": "documento.pdf",
  "fileType": "pdf",
  "fileSize": 1024000,
  "status": "uploaded",
  "organizationId": "660e8400-e29b-41d4-a716-446655440000",
  "agentId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 4.2 Listar Documentos

**curl:**

```bash
curl -X GET "http://localhost:3000/documents?status=processed&agentId=uuid" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');
const params = new URLSearchParams({
  status: 'processed',
  agentId: 'uuid-do-agente',
});

const response = await fetch(
  `http://localhost:3000/documents?${params}`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }
);

const documents = await response.json();
console.log(documents);
```

### 4.3 Obter Detalhes do Documento

**curl:**

```bash
curl -X GET http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 4.4 Deletar Documento

**curl:**

```bash
curl -X DELETE http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 5. RAG

### 5.1 Fazer Query RAG

**curl:**

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

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/rag/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'Qual é a política de reembolso?',
    agentId: 'uuid-do-agente',
    topK: 5,
    minScore: 0.7,
    includeSources: true,
  }),
});

const result = await response.json();
console.log('Resposta:', result.answer);
console.log('Fontes:', result.sources);
```

**Python:**

```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json',
}

data = {
    'query': 'Qual é a política de reembolso?',
    'agentId': 'uuid-do-agente',
    'topK': 5,
    'minScore': 0.7,
    'includeSources': True,
}

response = requests.post(
    'http://localhost:3000/rag/query',
    headers=headers,
    json=data
)

result = response.json()
print('Resposta:', result['answer'])
print('Fontes:', result['sources'])
```

**Resposta esperada:**

```json
{
  "answer": "A política de reembolso permite devoluções em até 30 dias após a compra...",
  "sources": [
    {
      "documentId": "770e8400-e29b-41d4-a716-446655440000",
      "documentName": "politicas.pdf",
      "chunkId": "880e8400-e29b-41d4-a716-446655440000",
      "chunkIndex": 5,
      "pageNumber": 3,
      "score": 0.89,
      "excerpt": "texto relevante do chunk..."
    }
  ],
  "queryId": "990e8400-e29b-41d4-a716-446655440000",
  "processingTimeMs": 1234,
  "model": "gpt-4o",
  "tokensUsed": 456
}
```

### 5.2 Query com Contexto de Conversação

**curl:**

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

---

## 6. WhatsApp

### 6.1 Enviar Mensagem

**curl:**

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

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/whatsapp/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '5511999999999',
    message: 'Olá! Como posso ajudar?',
    agentId: 'uuid-do-agente',
  }),
});

const result = await response.json();
console.log('Mensagem enviada:', result);
```

**Resposta esperada:**

```json
{
  "messageId": "wamid.xxx",
  "status": "sent",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 6.2 Listar Conversas

**curl:**

```bash
curl -X GET http://localhost:3000/whatsapp/conversations \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 6.3 Obter Mensagens de uma Conversa

**curl:**

```bash
curl -X GET http://localhost:3000/whatsapp/conversations/{conversationId}/messages \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 7. Billing

### 7.1 Criar Checkout Session

**curl:**

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

**JavaScript:**

```javascript
const accessToken = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:3000/billing/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 'uuid-do-plano',
    successUrl: 'https://app.example.com/success',
    cancelUrl: 'https://app.example.com/cancel',
  }),
});

const { url } = await response.json();
// Redirecione o usuário para a URL do Stripe
window.location.href = url;
```

**Resposta esperada:**

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

### 7.2 Obter Assinatura

**curl:**

```bash
curl -X GET http://localhost:3000/billing/subscription \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 7.3 Listar Invoices

**curl:**

```bash
curl -X GET http://localhost:3000/billing/invoices \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### 7.4 Cancelar Assinatura

**curl:**

```bash
curl -X POST http://localhost:3000/billing/cancel-subscription \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

---

## 8. Tratamento de Erros

### 8.1 Estrutura de Erros

A API retorna erros no seguinte formato:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

### 8.2 Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Não autenticado
- **403 Forbidden**: Sem permissão
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: email já existe)
- **413 Payload Too Large**: Arquivo muito grande
- **500 Internal Server Error**: Erro do servidor

### 8.3 Exemplo de Tratamento de Erros (JavaScript)

```javascript
async function fazerRequisicao() {
  try {
    const response = await fetch('http://localhost:3000/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          // Token expirado, fazer refresh
          await refreshToken();
          break;
        case 400:
          console.error('Dados inválidos:', error.message);
          break;
        case 404:
          console.error('Recurso não encontrado');
          break;
        default:
          console.error('Erro:', error.message);
      }
      
      throw new Error(error.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}
```

### 8.4 Exemplo de Tratamento de Erros (Python)

```python
import requests
from requests.exceptions import RequestException

def fazer_requisicao():
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        response = requests.post(
            'http://localhost:3000/endpoint',
            headers=headers,
            json=data
        )
        
        response.raise_for_status()  # Lança exceção para status >= 400
        return response.json()
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            # Token expirado, fazer refresh
            refresh_token()
        elif e.response.status_code == 400:
            error = e.response.json()
            print(f'Dados inválidos: {error["message"]}')
        else:
            print(f'Erro HTTP: {e.response.status_code}')
        raise
    except RequestException as e:
        print(f'Erro na requisição: {e}')
        raise
```

### 8.5 Erros Comuns

**401 Unauthorized:**
- Token expirado ou inválido
- Solução: Fazer login novamente ou usar refresh token

**400 Bad Request:**
- Dados de entrada inválidos
- Solução: Verificar formato dos dados enviados

**413 Payload Too Large:**
- Arquivo muito grande
- Solução: Verificar limite do plano e reduzir tamanho do arquivo

**409 Conflict:**
- Recurso já existe (ex: email duplicado)
- Solução: Usar recurso existente ou escolher outro identificador

---

## Dicas de Uso

1. **Sempre guarde os tokens** após login/registro
2. **Use refresh token** antes que o access token expire
3. **Guarde a API Key imediatamente** - ela só é mostrada uma vez
4. **Monitore o status** dos documentos após upload
5. **Ajuste parâmetros RAG** conforme qualidade dos resultados
6. **Trate erros adequadamente** para melhor experiência do usuário

---

## Recursos Adicionais

- [Guia de Onboarding](../docs/ONBOARDING.md)
- [Guia de Usuário](../docs/USER_GUIDE.md)
- [Guia de Troubleshooting](../docs/TROUBLESHOOTING.md)
- [Guia Rápido](../docs/QUICK_START.md)

