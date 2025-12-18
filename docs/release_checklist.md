# Release Checklist - Food Management System

## MVP Done Definition

O MVP está pronto quando:
- ✅ Produção segura (RLS, validações server-side)
- ✅ Fluxos core funcionando (cardápio, checkout, pedidos)
- ✅ Observabilidade mínima (logs, incident playbook)
- ✅ CI/CD configurado e verde

---

## P0 - Crítico (Bloqueadores de Release)

| # | Item | Status | Responsável |
|---|------|--------|-------------|
| 1 | RLS habilitado em todas as tabelas | ✅ | - |
| 2 | Validação server-side no checkout | ✅ | - |
| 3 | Isolamento multi-tenant funcionando | ✅ | - |
| 4 | Login/Auth funcionando | ✅ | - |
| 5 | Cardápio público carrega | ✅ | - |
| 6 | Pedido pode ser criado | ✅ | - |
| 7 | CI pipeline verde | 🔄 | - |
| 8 | Migrations aplicadas em prod | ⏳ | - |
| 9 | Variáveis de ambiente configuradas | ⏳ | - |
| 10 | Domínio configurado | ⏳ | - |

---

## P1 - Importante (Antes do Go-Live)

| # | Item | Status | Responsável |
|---|------|--------|-------------|
| 1 | Sentry configurado para erros | ⏳ | - |
| 2 | Relatórios básicos funcionando | ⏳ | - |
| 3 | Notificações de novo pedido | ⏳ | - |
| 4 | Impressão de pedido | ⏳ | - |
| 5 | Permissões por role validadas | ⏳ | - |
| 6 | Backup de banco configurado | ⏳ | - |
| 7 | SSL/HTTPS funcionando | ⏳ | - |
| 8 | Testes E2E passando | 🔄 | - |
| 9 | Documentação de deploy | ✅ | - |
| 10 | Smoke tests RLS executados | ⏳ | - |

---

## P2 - Desejável (Pós Go-Live)

| # | Item | Status | Responsável |
|---|------|--------|-------------|
| 1 | Integração pagamentos (Stripe/MP) | ⏳ | - |
| 2 | WhatsApp API oficial | ⏳ | - |
| 3 | Push notifications | ⏳ | - |
| 4 | Relatórios avançados | ⏳ | - |
| 5 | Multi-idioma | ⏳ | - |
| 6 | PWA/App mobile | ⏳ | - |
| 7 | Testes de carga | ⏳ | - |
| 8 | CDN para imagens | ⏳ | - |
| 9 | Cache otimizado | ⏳ | - |
| 10 | Analytics avançado | ⏳ | - |

---

## Roadmap (Fora do MVP)

> Features marcadas como "Roadmap" - NÃO bloqueiam release

### Integrações Externas
- 🗓️ **iFood** - Integração com marketplace
- 🗓️ **Rappi** - Integração com marketplace
- 🗓️ **Google Reviews** - Sincronização de avaliações
- 🗓️ **Google My Business** - Atualização automática

### Features Avançadas
- 🗓️ **IA para previsão de demanda**
- 🗓️ **Chatbot WhatsApp**
- 🗓️ **Programa de fidelidade avançado**
- 🗓️ **Multi-moeda**

---

## Checklist de Deploy

### Pré-Deploy
- [ ] `npm run lint` passa
- [ ] `npm run type-check` passa
- [ ] `npm run build` passa
- [ ] Migrations testadas em staging
- [ ] Smoke tests RLS passam
- [ ] Variáveis de ambiente configuradas

### Deploy
- [ ] Deploy via Vercel/Netlify
- [ ] Migrations aplicadas em prod
- [ ] DNS configurado
- [ ] SSL ativo

### Pós-Deploy
- [ ] Verificar login funciona
- [ ] Verificar cardápio público
- [ ] Criar pedido de teste
- [ ] Verificar logs/Sentry
- [ ] Monitorar por 24h

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído |
| 🔄 | Em progresso |
| ⏳ | Pendente |
| 🗓️ | Roadmap (fora do MVP) |
| ❌ | Bloqueado |

---

## Histórico de Releases

| Versão | Data | Notas |
|--------|------|-------|
| v1.0.0-rc1 | 2025-12-17 | Primeiro release candidate |
| v1.0.0 | _pendente_ | Release final MVP |
