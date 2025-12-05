# Guia Rápido - Comece em 5 Minutos

## 🚀 Início Rápido

Este guia permite que você tenha o sistema rodando em poucos minutos.

---

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Docker Desktop rodando

---

## Passo 1: Instalação (2 minutos)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd agent/api

# 2. Instale dependências
npm install

# 3. Configure o .env
cp .env.example .env
# Edite o .env com as configurações mínimas (veja ENV_SETUP.md)

# 4. Gere chaves JWT
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para JWT_REFRESH_SECRET
```

---

## Passo 2: Iniciar Serviços (1 minuto)

```bash
# 1. Inicie Docker Desktop (se ainda não estiver rodando)

# 2. Inicie os serviços
npm run docker:up

# 3. Aguarde alguns segundos e execute migrações
npm run migration:run

# 4. Inicie o servidor
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

---

## Passo 3: Criar Conta (30 segundos)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "SenhaSegura123!",
    "firstName": "Seu",
    "lastName": "Nome",
    "organizationName": "Minha Empresa"
  }'
```

**Guarde o `accessToken` retornado!**

---

## Passo 4: Criar Primeiro Agente (30 segundos)

```bash
curl -X POST http://localhost:3000/agents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Agente",
    "systemPrompt": "Você é um assistente útil e educado."
  }'
```

**Guarde o `id` do agente retornado!**

---

## Passo 5: Fazer Upload de Documento (1 minuto)

```bash
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -F "file=@/caminho/para/documento.pdf" \
  -F "agentId=ID_DO_AGENTE"
```

**Aguarde o processamento** (verifique o status):

```bash
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

Quando `status` for `processed`, está pronto!

---

## Passo 6: Testar RAG (30 segundos)

```bash
curl -X POST http://localhost:3000/rag/query \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Resuma o conteúdo do documento",
    "agentId": "ID_DO_AGENTE",
    "includeSources": true
  }'
```

**Pronto!** Você já tem o sistema funcionando! 🎉

---

## Checklist Rápido

- [ ] Node.js 20+ instalado
- [ ] Docker rodando
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` configurado
- [ ] Serviços iniciados (`npm run docker:up`)
- [ ] Migrações executadas (`npm run migration:run`)
- [ ] Servidor rodando (`npm run start:dev`)
- [ ] Conta criada
- [ ] Agente criado
- [ ] Documento enviado e processado
- [ ] Query RAG funcionando

---

## Próximos Passos

Agora que você tem o básico funcionando:

1. **[Guia de Onboarding Completo](./ONBOARDING.md)** - Detalhes de cada etapa
2. **[Guia de Usuário](./USER_GUIDE.md)** - Aprenda todas as funcionalidades
3. **[Exemplos de API](./API_EXAMPLES.md)** - Veja exemplos práticos
4. **[Troubleshooting](./TROUBLESHOOTING.md)** - Resolva problemas comuns

---

## Comandos Essenciais

```bash
# Iniciar serviços
npm run docker:up

# Parar serviços
npm run docker:down

# Ver logs
npm run docker:logs

# Executar migrações
npm run migration:run

# Iniciar servidor
npm run start:dev

# Verificar Docker
npm run docker:check
```

---

## Problemas?

Se algo não funcionar:

1. Verifique se o Docker está rodando
2. Verifique os logs: `npm run docker:logs`
3. Consulte o [Guia de Troubleshooting](./TROUBLESHOOTING.md)
4. Verifique o [Guia de Onboarding Completo](./ONBOARDING.md)

---

## Links Rápidos

- **Documentação Completa**: [README.md](../README.md)
- **Configuração de Ambiente**: [ENV_SETUP.md](../ENV_SETUP.md)
- **Onboarding Detalhado**: [ONBOARDING.md](./ONBOARDING.md)
- **Guia de Usuário**: [USER_GUIDE.md](./USER_GUIDE.md)
- **Exemplos de API**: [API_EXAMPLES.md](./API_EXAMPLES.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Boa sorte com seu projeto! 🚀**

