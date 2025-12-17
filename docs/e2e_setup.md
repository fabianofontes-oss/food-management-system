# Configuração dos Testes E2E

Este documento descreve como configurar e executar os testes E2E com Playwright.

## Pré-requisitos

- Node.js >= 18.0.0
- Supabase local ou de desenvolvimento configurado
- Variáveis de ambiente configuradas

## Instalação

O Playwright já está instalado como dependência de desenvolvimento. Para instalar os browsers:

```bash
npx playwright install chromium
```

Para instalar todos os browsers (Chromium, Firefox, WebKit):

```bash
npx playwright install
```

## Seed de Dados

Antes de rodar os testes, execute o seed E2E no Supabase:

```bash
# Via Supabase CLI (local)
supabase db reset && psql -f supabase/seed-e2e.sql

# Via Studio/Dashboard
# 1. Abra o SQL Editor no Supabase Dashboard
# 2. Cole o conteúdo de supabase/seed-e2e.sql
# 3. Execute
```

### Dados criados pelo seed

| Entidade | Slug/ID | Descrição |
|----------|---------|-----------|
| **Store A** | `e2e-loja-agendamento` | Loja com agendamento habilitado |
| **Store B** | `e2e-loja-secundaria` | Loja secundária para teste multi-store |
| **Produto A1** | X-Burguer E2E | Produto da Store A (R$ 25,90) |
| **Produto A2** | X-Salada E2E | Produto da Store A (R$ 28,90) |
| **Produto B1** | Açaí 500ml E2E | Produto da Store B (R$ 22,00) |

### IDs Fixos (UUID)

```
Tenant:   e2e00000-0000-0000-0000-000000000001
Store A:  e2e00000-0000-0000-0000-000000000010
Store B:  e2e00000-0000-0000-0000-000000000020
Cat A:    e2e00000-0000-0000-0000-000000000100
Cat B:    e2e00000-0000-0000-0000-000000000200
Prod A1:  e2e00000-0000-0000-0000-000000001001
Prod A2:  e2e00000-0000-0000-0000-000000001002
Prod B1:  e2e00000-0000-0000-0000-000000002001
```

## Executando os Testes

### Modo Headless (padrão)

```bash
npm run test:e2e
```

### Modo UI (interativo)

```bash
npm run test:e2e:ui
```

### Modo Headed (ver browser)

```bash
npm run test:e2e:headed
```

### Rodar teste específico

```bash
npx playwright test order-flow.spec.ts
npx playwright test -g "Pedido Imediato"
```

## Estrutura de Arquivos

```
├── playwright.config.ts          # Configuração do Playwright
├── tests/
│   └── e2e/
│       └── order-flow.spec.ts    # Testes do fluxo de pedido
└── supabase/
    └── seed-e2e.sql              # Seed determinístico
```

## Cenários Testados

### 1. Pedido Imediato
- Acessa cardápio
- Adiciona item ao carrinho
- Vai para checkout
- Valida estrutura do formulário

### 2. Loja Fechada + Agendamento
- Verifica presença do seletor de agendamento
- Seleciona slot de horário
- Valida mudança do botão para "Agendar Pedido"

### 3. Guard Multi-Store
- Adiciona item da loja A
- Navega para loja B
- Verifica que carrinho foi limpo
- Garante que não há itens misturados

## Configuração do CI

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Variáveis de Ambiente

Para rodar os testes localmente, configure:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# Opcional: URL base diferente
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

## Troubleshooting

### Testes falhando por timeout

1. Verifique se o servidor está rodando
2. Aumente o timeout no `playwright.config.ts`
3. Verifique a conexão com o Supabase

### Dados não encontrados

1. Execute o seed E2E
2. Verifique se os IDs estão corretos
3. Confira as políticas RLS

### Browser não abre

```bash
# Reinstalar browsers
npx playwright install --force
```

## Boas Práticas

1. **Determinismo**: Use IDs fixos do seed, nunca dados aleatórios
2. **Isolamento**: Cada teste deve funcionar independentemente
3. **Limpeza**: Resete o estado antes de cada teste quando necessário
4. **Seletores**: Prefira `data-testid` ou texto visível ao usuário
5. **Esperas**: Use `waitForLoadState` em vez de `waitForTimeout` fixo

## Relatórios

Após rodar os testes, o relatório HTML é gerado em:

```
playwright-report/index.html
```

Para abrir:

```bash
npx playwright show-report
```
