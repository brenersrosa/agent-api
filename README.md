# API NestJS para Agentes WhatsApp com RAG

API RESTful em NestJS para gerenciar agentes de atendimento integrados ao WhatsApp, com autenticação, assinaturas via Stripe, e sistema RAG (Retrieval-Augmented Generation) para processamento de documentos.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Docker Desktop rodando (macOS/Windows)
- npm ou yarn

### Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd agent/api
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

4. **Inicie o Docker Desktop** (importante!)
   - Abra o Docker Desktop
   - Aguarde até que o ícone fique verde na barra de menus

5. Inicie os serviços com Docker Compose
```bash
npm run docker:up
# ou
docker compose up -d
```

6. Execute as migrações do banco de dados
```bash
npm run migration:run
```

7. Inicie o servidor de desenvolvimento
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── auth/              # Módulo de autenticação
├── users/             # Módulo de usuários
├── organizations/     # Módulo de organizações
├── agents/            # Módulo de agentes
├── documents/         # Módulo de documentos
├── rag/               # Módulo RAG
├── whatsapp/          # Módulo WhatsApp
├── billing/           # Módulo de billing (Stripe)
├── admin/             # Módulo administrativo
├── webhooks/          # Módulo de webhooks
├── common/            # Módulo comum (guards, filters, etc)
└── main.ts            # Arquivo principal
```

## 🔧 Tecnologias

- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados relacional com pgvector para busca vetorial
- **Redis** - Cache e filas (BullMQ)
- **OpenAI** - Embeddings e LLM
- **Stripe** - Pagamentos
- **WhatsApp Business API** - Integração WhatsApp
- **S3/MinIO** - Armazenamento de documentos

## 📚 Documentação

### Guias de Usuário

- **[🚀 Guia Rápido](./docs/QUICK_START.md)** - Comece em 5 minutos
- **[📖 Guia de Onboarding](./docs/ONBOARDING.md)** - Passo a passo completo desde instalação até primeiro uso
- **[📘 Guia de Usuário](./docs/USER_GUIDE.md)** - Guias detalhados de todas as funcionalidades
- **[💡 Exemplos de API](./docs/API_EXAMPLES.md)** - Exemplos práticos em diferentes linguagens
- **[🔧 Troubleshooting](./docs/TROUBLESHOOTING.md)** - Solução de problemas comuns

### Documentação Técnica

- **[📋 Plano Técnico](./plan.md)** - Documentação técnica completa do projeto
- **[⚙️ Configuração de Ambiente](./ENV_SETUP.md)** - Guia de configuração das variáveis de ambiente

## 🐳 Comandos Docker

```bash
# Iniciar serviços
npm run docker:up

# Parar serviços
npm run docker:down

# Ver logs
npm run docker:logs

# Verificar se Docker está rodando
npm run docker:check
```

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🔍 Linting e Formatação

Este projeto usa [BiomeJS](https://biomejs.dev/) para linting e formatação.

```bash
# Verificar código
pnpm run check

# Corrigir automaticamente
pnpm run check:fix

# Apenas lint
pnpm run lint

# Apenas formatação
pnpm run format
```

**VS Code**: Instale a extensão [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) para formatação automática.

## ⚠️ Troubleshooting

Para problemas comuns e soluções detalhadas, consulte o **[Guia de Troubleshooting](./docs/TROUBLESHOOTING.md)**.

### Problemas Comuns Rápidos

**Docker daemon não está rodando:**
1. Abra o Docker Desktop
2. Aguarde até que o ícone fique verde
3. Execute novamente: `npm run docker:up`

**Porta já em uso:**
1. Pare os serviços: `npm run docker:down`
2. Altere as portas no `docker-compose.yml` se necessário
3. Inicie novamente: `npm run docker:up`

**Erro ao carregar módulo bcrypt:**
1. O arquivo `.npmrc` já está configurado com `ignore-scripts=false`
2. Se o problema persistir, compile manualmente:
   ```bash
   cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt
   npm run install
   ```
3. Ou reinstale as dependências: `pnpm install`

## 📝 Licença

UNLICENSED
