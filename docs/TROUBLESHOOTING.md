# Guia de Troubleshooting - Sistema de Agentes WhatsApp com RAG

## Índice

1. [Problemas de Instalação](#1-problemas-de-instalação)
2. [Problemas com Docker](#2-problemas-com-docker)
3. [Problemas de Autenticação](#3-problemas-de-autenticação)
4. [Problemas com Documentos](#4-problemas-com-documentos)
5. [Problemas com RAG](#5-problemas-com-rag)
6. [Problemas com WhatsApp](#6-problemas-com-whatsapp)
7. [Problemas com Billing](#7-problemas-com-billing)
8. [Comandos Úteis de Diagnóstico](#8-comandos-úteis-de-diagnóstico)
9. [Logs Importantes](#9-logs-importantes)

---

## 1. Problemas de Instalação

### 1.1 Node.js não encontrado

**Sintoma:**
```bash
command not found: node
```

**Solução:**
1. Instale Node.js 20 ou superior
2. Verifique a instalação: `node --version`
3. Se necessário, adicione ao PATH

### 1.2 Erro ao instalar dependências

**Sintoma:**
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solução:**
```bash
# Limpe o cache
npm cache clean --force

# Delete node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Reinstale
npm install
```

### 1.3 Erro com bcrypt

**Sintoma:**
```
Cannot find module 'bcrypt_lib.node'
```

**Solução:**
```bash
# Reinstale bcrypt
npm rebuild bcrypt

# Ou reinstale todas as dependências
rm -rf node_modules
npm install
```

---

## 2. Problemas com Docker

### 2.1 Docker daemon não está rodando

**Sintoma:**
```
Cannot connect to the Docker daemon
```

**Solução:**
1. Abra o Docker Desktop
2. Aguarde até que o ícone fique verde
3. Execute novamente: `npm run docker:up`

### 2.2 Porta já em uso

**Sintoma:**
```
Error: bind: address already in use
```

**Solução:**
```bash
# Verifique o que está usando a porta
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Pare os serviços Docker
npm run docker:down

# Ou altere as portas no docker-compose.yml
```

### 2.3 Container não inicia

**Sintoma:**
```
Container keeps restarting
```

**Solução:**
```bash
# Veja os logs do container
docker compose logs nome-do-servico

# Verifique o status
docker compose ps

# Reinicie os serviços
npm run docker:down
npm run docker:up
```

### 2.4 Erro ao executar migrações

**Sintoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:**
1. Verifique se o PostgreSQL está rodando: `docker compose ps`
2. Aguarde alguns segundos após iniciar os containers
3. Verifique a URL no `.env`: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_api`

---

## 3. Problemas de Autenticação

### 3.1 Token expirado

**Sintoma:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solução:**
1. Use o refresh token para obter novo access token
2. Ou faça login novamente

**Exemplo:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "seu_refresh_token"}'
```

### 3.2 Credenciais inválidas

**Sintoma:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Solução:**
1. Verifique se o email está correto
2. Verifique se a senha está correta
3. Se necessário, crie uma nova conta

### 3.3 API Key inválida

**Sintoma:**
```json
{
  "statusCode": 401,
  "message": "Invalid API key"
}
```

**Solução:**
1. Verifique se a API Key está correta
2. Gere uma nova API Key se necessário
3. Lembre-se: a API Key só é mostrada uma vez na criação

---

## 4. Problemas com Documentos

### 4.1 Documento não processa

**Sintoma:**
Status permanece em `uploaded` ou `processing` por muito tempo

**Solução:**
1. Verifique os logs do servidor
2. Verifique se o OpenAI API Key está configurado
3. Verifique se há espaço em disco
4. Tente reindexar: `POST /admin/documents/{id}/reindex`

**Verificar status:**
```bash
curl -X GET http://localhost:3000/documents/{documentId} \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 4.2 Erro ao fazer upload

**Sintoma:**
```json
{
  "statusCode": 400,
  "message": "File too large"
}
```

**Solução:**
1. Verifique o limite do seu plano
2. Reduza o tamanho do arquivo
3. Divida documentos grandes em partes menores

### 4.3 Formato não suportado

**Sintoma:**
```json
{
  "statusCode": 400,
  "message": "File type not supported"
}
```

**Solução:**
1. Use formatos suportados: PDF, DOCX, MD, TXT, PNG, JPG, JPEG
2. Verifique a extensão do arquivo
3. Converta o arquivo se necessário

### 4.4 Documento processado mas não aparece no RAG

**Sintoma:**
Documento com status `processed` mas não retorna resultados no RAG

**Solução:**
1. Verifique se o documento está associado ao agente correto
2. Verifique se o `minScore` não está muito alto
3. Tente reindexar o documento
4. Verifique se há chunks criados: `chunkCount > 0`

---

## 5. Problemas com RAG

### 5.1 Resposta vazia ou "não encontrei informações"

**Sintoma:**
```json
{
  "answer": "Não encontrei informações relevantes nos documentos disponíveis.",
  "sources": []
}
```

**Solução:**
1. Verifique se há documentos processados e associados ao agente
2. Reduza o `minScore` (ex: de 0.7 para 0.5)
3. Aumente o `topK` (ex: de 5 para 10)
4. Reformule a query de forma mais específica
5. Verifique se os documentos contêm informações relevantes

**Exemplo de query otimizada:**
```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Qual é a política de reembolso?",
    "agentId": "uuid",
    "topK": 10,
    "minScore": 0.5
  }'
```

### 5.2 Respostas imprecisas

**Sintoma:**
Respostas não correspondem ao conteúdo dos documentos

**Solução:**
1. Aumente o `minScore` para filtrar resultados menos relevantes
2. Melhore a qualidade dos documentos (mais estruturados)
3. Ajuste o `systemPrompt` do agente para ser mais específico
4. Reduza a `temperature` para respostas mais precisas

### 5.3 Timeout na query

**Sintoma:**
Requisição demora muito ou retorna timeout

**Solução:**
1. Reduza o `topK` (menos chunks para processar)
2. Reduza o `maxTokens` na resposta
3. Verifique a conexão com OpenAI
4. Verifique se há muitos documentos indexados

### 5.4 Erro ao gerar embedding

**Sintoma:**
```json
{
  "statusCode": 500,
  "message": "Error generating embedding"
}
```

**Solução:**
1. Verifique se o `OPENAI_API_KEY` está configurado corretamente
2. Verifique se há créditos na conta OpenAI
3. Verifique a conexão com a internet
4. Verifique os logs do servidor para mais detalhes

---

## 6. Problemas com WhatsApp

### 6.1 Webhook não recebe mensagens

**Sintoma:**
Mensagens do WhatsApp não chegam ao sistema

**Solução:**
1. Verifique se o webhook está configurado corretamente no PlugzAPI
2. Verifique se a URL do webhook está acessível publicamente
3. Verifique se o `PLUGZAPI_WEBHOOK_SECRET` está correto
4. Teste o webhook manualmente

**Testar webhook:**
```bash
curl -X POST http://localhost:3000/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "from": "5511999999999",
      "text": {"body": "teste"}
    }]
  }'
```

### 6.2 Mensagens não são enviadas

**Sintoma:**
Erro ao enviar mensagem via API

**Solução:**
1. Verifique se o `PLUGZAPI_TOKEN` está configurado
2. Verifique se o `PLUGZAPI_INSTANCE_ID` está correto
3. Verifique se o número está no formato correto (código país + DDD + número)
4. Verifique os logs do servidor

### 6.3 Respostas automáticas não funcionam

**Sintoma:**
Mensagens chegam mas não há resposta automática

**Solução:**
1. Verifique se o agente está ativo (`isActive: true`)
2. Verifique se há documentos processados associados ao agente
3. Verifique se o número WhatsApp está associado ao agente
4. Verifique os logs do processamento de mensagens
5. Verifique se há erros no job de processamento

---

## 7. Problemas com Billing

### 7.1 Checkout não funciona

**Sintoma:**
Erro ao criar checkout session

**Solução:**
1. Verifique se o `STRIPE_SECRET_KEY` está configurado
2. Verifique se está usando a chave correta (test vs production)
3. Verifique se o plano existe
4. Verifique os logs do servidor

### 7.2 Webhook do Stripe não processa

**Sintoma:**
Pagamento feito mas assinatura não atualiza

**Solução:**
1. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
2. Verifique se a URL do webhook está configurada no Stripe
3. Verifique os logs do webhook
4. Reprocesse o evento manualmente se necessário

### 7.3 Limites não atualizam após assinatura

**Sintoma:**
Assinatura ativa mas limites ainda do plano anterior

**Solução:**
1. Verifique se o webhook foi processado corretamente
2. Verifique os logs do webhook
3. Atualize manualmente se necessário
4. Entre em contato com suporte

---

## 8. Comandos Úteis de Diagnóstico

### 8.1 Verificar Status dos Serviços

```bash
# Status dos containers Docker
docker compose ps

# Logs de todos os serviços
docker compose logs

# Logs de um serviço específico
docker compose logs postgres
docker compose logs redis
docker compose logs minio
```

### 8.2 Verificar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it agent_api_postgres psql -U postgres -d agent_api

# Listar tabelas
\dt

# Verificar usuários
SELECT * FROM users;

# Verificar organizações
SELECT * FROM organizations;

# Verificar documentos
SELECT id, filename, status, chunk_count FROM documents;
```

### 8.3 Verificar Redis

```bash
# Conectar ao Redis
docker exec -it agent_api_redis redis-cli

# Verificar chaves
KEYS *

# Verificar uma chave específica
GET chave
```

### 8.4 Verificar MinIO

```bash
# Acesse o console do MinIO
# http://localhost:9001
# Login: minioadmin / minioadmin
```

### 8.5 Verificar Logs da Aplicação

```bash
# Se usando npm
npm run start:dev

# Ver logs em tempo real
tail -f logs/app.log  # se houver arquivo de log
```

### 8.6 Testar Conectividade

```bash
# Testar API
curl http://localhost:3000/health

# Testar autenticação
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha"}'
```

---

## 9. Logs Importantes

### 9.1 Onde Encontrar Logs

- **Aplicação**: Console onde o servidor está rodando
- **Docker**: `docker compose logs`
- **PostgreSQL**: `docker compose logs postgres`
- **Redis**: `docker compose logs redis`

### 9.2 O Que Procurar nos Logs

**Erros de autenticação:**
```
[AuthService] Invalid credentials
```

**Erros de processamento de documentos:**
```
[DocumentProcessor] Error processing document
```

**Erros de RAG:**
```
[RagService] Error generating embedding
[RagService] No chunks found
```

**Erros de WhatsApp:**
```
[WhatsAppService] Error sending message
[WhatsAppService] Webhook verification failed
```

**Erros de Billing:**
```
[BillingService] Stripe webhook error
[BillingService] Invalid signature
```

### 9.3 Níveis de Log

- **ERROR**: Erros críticos que impedem funcionamento
- **WARN**: Avisos que podem indicar problemas
- **INFO**: Informações sobre operações normais
- **DEBUG**: Detalhes para debugging

---

## Checklist de Troubleshooting

Ao reportar um problema, inclua:

- [ ] Versão do Node.js (`node --version`)
- [ ] Versão do Docker (`docker --version`)
- [ ] Status dos serviços (`docker compose ps`)
- [ ] Logs relevantes (`docker compose logs`)
- [ ] Configuração do `.env` (sem valores sensíveis)
- [ ] Passos para reproduzir o problema
- [ ] Mensagem de erro completa
- [ ] Comportamento esperado vs comportamento atual

---

## Contato de Suporte

Se o problema persistir após seguir este guia:

1. Consulte a [documentação completa](../README.md)
2. Verifique os [exemplos de API](../docs/API_EXAMPLES.md)
3. Abra uma issue no repositório (se aplicável)
4. Entre em contato com o suporte técnico

---

## Recursos Adicionais

- [Guia de Onboarding](../docs/ONBOARDING.md)
- [Guia de Usuário](../docs/USER_GUIDE.md)
- [Exemplos de API](../docs/API_EXAMPLES.md)
- [Guia Rápido](../docs/QUICK_START.md)

