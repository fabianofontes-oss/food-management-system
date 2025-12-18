# Release Notes - v1.0.0-rc1

**Data:** 2025-12-17  
**Status:** Release Candidate 1

---

## Visão Geral

Primeira release candidate do Food Management System - sistema multi-loja e multi-nicho para gestão completa de pedidos de negócios de alimentação.

---

## Features Principais

### 🏪 Multi-tenant / Multi-loja
- Suporte a múltiplas lojas por tenant
- Isolamento de dados via RLS (Row Level Security)
- Cada loja com configurações independentes

### 📋 Cardápio Digital
- Cardápio público acessível sem login
- Categorias e produtos com imagens
- Modificadores e adicionais configuráveis
- Suporte a variações de produto

### 🛒 Checkout Completo
- Canais: Balcão, Delivery, Retirada
- Validação server-side anti-fraude
- Recálculo de totais no servidor
- Suporte a agendamento quando loja fechada

### 📦 Gestão de Pedidos
- KDS (Kitchen Display System)
- Status em tempo real via Realtime
- Histórico de pedidos
- Impressão de pedidos (MVP)

### 👥 Multi-roles
- OWNER, MANAGER, CASHIER, KITCHEN, DELIVERY
- Permissões por role
- Super Admin para gestão de tenants

### 🎨 Temas e Personalização
- Temas por loja (cores, logo)
- Layouts configuráveis
- Responsivo (mobile-first)

---

## Nichos Suportados

- 🍨 Açaí / Sorvetes
- 🍔 Hamburguerias
- 🌭 Hot Dogs
- 🍱 Marmitas
- 🥩 Açougues
- 🍦 Gelaterias
- 🍕 Pizzarias
- 📦 Outros

---

## Infraestrutura

### Stack
- **Frontend:** Next.js 14 (App Router)
- **Backend:** Supabase (Auth, DB, Realtime, Storage)
- **Styling:** TailwindCSS + shadcn/ui
- **Deploy:** Vercel (recomendado)

### Segurança
- RLS habilitado em todas as tabelas
- Validação server-side no checkout
- Isolamento multi-tenant garantido
- Políticas de acesso público auditadas

### CI/CD
- GitHub Actions configurado
- Jobs: type-check, lint, e2e
- Playwright para testes E2E
- Artifacts de falha (screenshots, traces)

---

## Checklist de Validação

- [x] `npm run lint` - OK
- [x] `npm run type-check` - OK
- [x] CI pipeline configurado
- [x] Migrations com versões únicas
- [x] RLS policies para acesso público
- [x] Validação de checkout robusta
- [x] Logger centralizado
- [x] Incident playbook documentado

---

## Limitações Conhecidas (MVP)

1. **Pagamentos:** Ainda não integrado (Stripe/MercadoPago)
2. **Notificações WhatsApp:** Apenas click-to-chat
3. **Impressão:** Browser print básico
4. **Relatórios:** Em desenvolvimento
5. **Integrações:** iFood/Rappi/Google Reviews no roadmap

---

## Próximos Passos (v1.0.0)

- [ ] Estabilizar CI E2E (3 execuções verdes seguidas)
- [ ] Aplicar migrations em staging/prod
- [ ] Configurar Sentry para monitoramento
- [ ] Testes de carga básicos
- [ ] Documentação de deploy

---

## Como Testar

```bash
# Instalar dependências
npm ci

# Rodar localmente
npm run dev

# Rodar testes
npm run lint
npm run type-check
npm run test:e2e
```

---

## Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `docs/db_apply.md` | Procedimento de aplicação de migrations |
| `docs/incident_playbook.md` | Guia de troubleshooting |
| `supabase/smoke_tests.sql` | Testes de segurança RLS |
| `src/lib/logger.ts` | Logger centralizado |

---

## Changelog desde início

- feat: sistema multi-tenant completo
- feat: cardápio digital público
- feat: checkout com validação server-side
- feat: KDS e gestão de pedidos
- feat: temas e personalização por loja
- feat: suporte a múltiplos nichos
- feat: agendamento de pedidos
- feat: logger e observabilidade básica
- fix: RLS policies para acesso anon
- fix: migrations com versões únicas
- ci: GitHub Actions com type-check, lint, e2e
