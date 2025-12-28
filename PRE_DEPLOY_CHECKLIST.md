# ✅ CHECKLIST PRÉ-DEPLOY

Use este checklist antes de fazer deploy para produção.

---

## 🔧 Build e Código

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem warnings
- [ ] `npx tsc --noEmit` passa sem erros TypeScript
- [ ] Não há `console.log` em código de produção
- [ ] Não há `TODO` ou `FIXME` críticos
- [ ] Não há credenciais hardcoded no código

---

## 🔑 Variáveis de Ambiente

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `INTERNAL_API_TOKEN` configurada (token seguro)
- [ ] `CRON_SECRET` configurada (token seguro)
- [ ] `SUPER_ADMIN_EMAILS` configurada
- [ ] `NEXT_PUBLIC_BASE_DOMAIN` configurada
- [ ] `NEXT_PUBLIC_APP_URL` configurada
- [ ] Variáveis opcionais configuradas (Stripe, Resend, Sentry)

---

## 🗄️ Banco de Dados (Supabase)

- [ ] Projeto Supabase criado
- [ ] Migrations executadas
- [ ] RLS (Row Level Security) ativo em TODAS as tabelas
- [ ] Policies de segurança configuradas
- [ ] Tabelas principais existem:
  - [ ] `tenants`
  - [ ] `stores`
  - [ ] `users`
  - [ ] `store_users`
  - [ ] `products`
  - [ ] `categories`
  - [ ] `orders`
  - [ ] `order_items`
  - [ ] `customers`
- [ ] Backup do banco feito

---

## 🌐 Domínios e DNS

- [ ] Domínios registrados (GoDaddy ou similar)
- [ ] DNS configurado para `pediufood.com`
- [ ] DNS configurado para `pediufood.com.br`
- [ ] DNS configurado para `pediu.food`
- [ ] DNS configurado para `entregou.food`
- [ ] Wildcard CNAME configurado (`*.pediu.food`)
- [ ] Wildcard CNAME configurado (`*.entregou.food`)
- [ ] SSL ativo em todos domínios

---

## 🚀 Vercel

- [ ] Projeto importado do GitHub
- [ ] Todas variáveis de ambiente configuradas
- [ ] Domínios adicionados no Vercel
- [ ] Build de teste passou
- [ ] Cron jobs configurados

---

## 💳 Pagamentos (Opcional)

- [ ] Stripe/Mercado Pago configurado
- [ ] Webhook configurado
- [ ] Testado em sandbox
- [ ] Produtos criados no Stripe
- [ ] Price IDs configurados

---

## 📧 Emails (Opcional)

- [ ] Resend configurado
- [ ] `RESEND_API_KEY` configurada
- [ ] Email de teste enviado
- [ ] Templates testados

---

## 📊 Monitoramento (Opcional)

- [ ] Sentry configurado
- [ ] `SENTRY_DSN` configurada
- [ ] Evento de teste enviado
- [ ] UptimeRobot ou similar configurado

---

## 🧪 Testes

- [ ] Testes E2E passam (`npm run test:e2e`)
- [ ] Fluxo de pedido testado manualmente
- [ ] Criação de loja testada
- [ ] Multi-tenant testado
- [ ] PIX testado (modo simulado)

---

## 🔒 Segurança

- [ ] RLS ativo no Supabase
- [ ] Middleware de autenticação funcionando
- [ ] Super Admin protegido
- [ ] API routes protegidas
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado (se aplicável)

---

## 📱 Funcionalidades Críticas

- [ ] Login funciona
- [ ] Signup funciona
- [ ] Criar loja funciona
- [ ] Adicionar produto funciona
- [ ] Fazer pedido funciona
- [ ] PIX gera QR Code
- [ ] Minisite acessível
- [ ] Dashboard acessível
- [ ] Super Admin acessível

---

## 📄 Documentação

- [ ] README.md atualizado
- [ ] DEPLOY.md criado
- [ ] AI-HANDOVER.md atualizado
- [ ] Variáveis de ambiente documentadas

---

## 🎯 Performance

- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Imagens otimizadas
- [ ] Fonts otimizadas

---

## ✅ APROVAÇÃO FINAL

- [ ] Revisei TODOS os itens acima
- [ ] Testei em ambiente de staging
- [ ] Backup completo feito
- [ ] Equipe notificada sobre deploy
- [ ] Plano de rollback definido

---

**Data:** ___/___/______  
**Responsável:** _________________  
**Aprovado por:** _________________

---

## 🚨 EM CASO DE PROBLEMA

1. **Não entre em pânico**
2. Verifique logs no Vercel
3. Verifique logs no Supabase
4. Faça rollback se necessário
5. Documente o problema
6. Corrija e teste novamente

---

**Última atualização:** 28/12/2025
