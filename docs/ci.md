# Pipeline de CI - GitHub Actions

Este documento descreve o pipeline de Integração Contínua (CI) configurado no GitHub Actions.

## Visão Geral

O CI roda automaticamente em todo **push** e **pull request** para as branches `main` e `develop`.

### Jobs Executados

| Job | Descrição | Dependências |
|-----|-----------|--------------|
| `type-check` | Verificação de tipos TypeScript | - |
| `lint` | Análise estática com ESLint | - |
| `e2e` | Testes E2E com Playwright + Supabase local | - |
| `build` | Verificação de build | type-check, lint |

## Arquitetura do CI

```
┌─────────────┐     ┌─────────────┐
│ type-check  │     │    lint     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
          ┌──────▼──────┐
          │    build    │
          └─────────────┘

┌─────────────────────────────────────┐
│              e2e                    │
│  (paralelo, com Supabase local)     │
└─────────────────────────────────────┘
```

## Estratégia de Testes E2E

Usamos **Supabase local** no CI para garantir:

1. **Determinismo**: Banco sempre no mesmo estado inicial
2. **Isolamento**: Não afeta ambiente de produção/staging
3. **Velocidade**: Não depende de conexão externa
4. **Sem secrets**: Usa credenciais padrão do Supabase local

### Fluxo do Job E2E

1. Instala dependências Node.js
2. Instala Playwright (apenas Chromium)
3. Inicia Supabase local via CLI
4. Aplica migrations do banco
5. Aplica seed E2E (`supabase/seed-e2e.sql`)
6. Faz build do Next.js
7. Roda testes E2E
8. Salva artefatos em caso de falha
9. Para Supabase local

## Executando Localmente

### Pré-requisitos

```bash
# Instalar Supabase CLI
npm install -g supabase

# Instalar Docker (necessário para Supabase local)
# https://docs.docker.com/get-docker/
```

### Rodar CI local

```bash
# 1. Iniciar Supabase local
supabase start

# 2. Aplicar seed E2E
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed-e2e.sql

# 3. Rodar type-check
npm run type-check

# 4. Rodar lint
npm run lint

# 5. Rodar E2E (em outro terminal)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
npm run test:e2e

# 6. Parar Supabase
supabase stop
```

### Script de conveniência

Crie um script `scripts/ci-local.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando CI local..."

# Type check
echo "📝 Running type-check..."
npm run type-check

# Lint
echo "🔍 Running lint..."
npm run lint

# E2E (se Supabase estiver rodando)
if supabase status > /dev/null 2>&1; then
  echo "🎭 Running E2E tests..."
  npm run test:e2e
else
  echo "⚠️  Supabase não está rodando. Pulando E2E."
  echo "   Execute: supabase start"
fi

echo "✅ CI local concluído!"
```

## Secrets (Opcional)

O CI atual **não requer secrets** pois usa Supabase local.

Se precisar usar Supabase remoto para E2E, configure:

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase E2E |
| `SUPABASE_ANON_KEY` | Chave anônima do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (para seed) |
| `DATABASE_URL` | Connection string do Postgres |

### Configurando secrets no GitHub

1. Vá para **Settings** > **Secrets and variables** > **Actions**
2. Clique em **New repository secret**
3. Adicione cada secret

## Artefatos

Em caso de **falha** nos testes E2E, o CI salva:

| Artefato | Descrição | Retenção |
|----------|-----------|----------|
| `playwright-report` | Relatório HTML do Playwright | 7 dias |
| `playwright-screenshots` | Screenshots de falhas | 7 dias |
| `playwright-traces` | Traces para debug | 7 dias |

### Baixando artefatos

1. Vá para a aba **Actions** no GitHub
2. Clique no workflow que falhou
3. Role até **Artifacts**
4. Baixe os arquivos necessários

### Visualizando trace

```bash
# Após baixar o arquivo .zip do trace
npx playwright show-trace trace.zip
```

## Troubleshooting

### Build falha no CI mas funciona local

1. Verifique se todas as dependências estão no `package.json`
2. Limpe cache: `npm ci` ao invés de `npm install`
3. Verifique variáveis de ambiente

### E2E timeout

1. Aumente timeout no `playwright.config.ts`
2. Verifique se Supabase local está healthy
3. Verifique se o seed foi aplicado

### Supabase local não inicia

1. Verifique se Docker está instalado
2. Verifique espaço em disco
3. Tente `supabase stop --no-backup && supabase start`

### Lint falha

```bash
# Ver detalhes
npm run lint -- --debug

# Auto-fix
npm run lint -- --fix
```

## Métricas do CI

O CI está configurado para:

- ✅ Rodar em ~5-10 minutos (builds paralelos)
- ✅ Cache de dependências npm
- ✅ Falhar rápido em erros óbvios
- ✅ Relatórios detalhados de E2E

## Próximos Passos

Melhorias futuras sugeridas:

1. **Deploy Preview**: Deploy automático em PRs
2. **Coverage**: Relatório de cobertura de código
3. **Performance**: Lighthouse CI
4. **Security**: Dependabot + CodeQL
