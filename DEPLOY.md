# 🚀 Guia de Deploy - Food Management System

## 📋 Pré-requisitos

- [ ] Conta no Vercel
- [ ] Conta no Supabase (projeto criado)
- [ ] Domínios registrados (GoDaddy ou similar)
- [ ] Conta no Stripe ou Mercado Pago (opcional)
- [ ] Conta no Resend (opcional, para emails)
- [ ] Conta no Sentry (opcional, para monitoramento)

---

## 🔑 Variáveis de Ambiente

### Obrigatórias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Domínios
NEXT_PUBLIC_BASE_DOMAIN=pediu.food
NEXT_PUBLIC_APP_URL=https://pediufood.com

# Segurança
INTERNAL_API_TOKEN=gere-um-token-aleatorio-seguro
CRON_SECRET=gere-outro-token-aleatorio-seguro

# Super Admin
SUPER_ADMIN_EMAILS=seu-email@example.com
```

### Opcionais (mas recomendadas)

```env
# Pagamentos
MP_ACCESS_TOKEN=seu-token-mercadopago
# OU
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Emails
RESEND_API_KEY=re_...

# Monitoramento
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Google OAuth (opcional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 📝 Passo a Passo

### 1. Preparar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e as chaves (Settings → API)
4. Execute as migrations do banco:
   - Vá em SQL Editor
   - Execute os scripts da pasta `supabase/`
5. Habilite RLS em todas as tabelas
6. Configure as policies de segurança

### 2. Configurar Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure as variáveis de ambiente:
   - Settings → Environment Variables
   - Adicione TODAS as variáveis listadas acima
4. Configure o domínio:
   - Settings → Domains
   - Adicione `pediufood.com`, `pediufood.com.br`, `pediu.food`, `entregou.food`

### 3. Configurar DNS (GoDaddy)

#### Para `pediufood.com`:
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 600

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 600
```

#### Para `pediu.food` (WILDCARD):
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 600

Tipo: CNAME
Nome: *
Valor: cname.vercel-dns.com
TTL: 600
```

#### Para `entregou.food` (WILDCARD):
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 600

Tipo: CNAME
Nome: *
Valor: cname.vercel-dns.com
TTL: 600
```

### 4. Configurar Cron Jobs

No `vercel.json`, os cron jobs já estão configurados:
- `/api/cron/check-pix-payments` - A cada 2 minutos

Certifique-se de que `CRON_SECRET` está configurada nas variáveis de ambiente.

### 5. Testar Deploy

1. Acesse `https://pediufood.com`
2. Teste o health check: `https://pediufood.com/api/health`
3. Crie uma loja de teste
4. Faça um pedido de teste
5. Verifique emails (se configurado)

---

## ✅ Checklist Pós-Deploy

- [ ] Health check retorna 200
- [ ] Login funciona
- [ ] Signup funciona
- [ ] Criar loja funciona
- [ ] Adicionar produto funciona
- [ ] Minisite acessível (slug.pediu.food)
- [ ] Fazer pedido funciona
- [ ] PIX gera QR Code
- [ ] Cron job rodando (verificar logs)
- [ ] SSL ativo em todos domínios
- [ ] Wildcard DNS funcionando

---

## 🔧 Troubleshooting

### Build falha

```bash
# Rodar localmente
npm run build

# Verificar erros TypeScript
npx tsc --noEmit

# Verificar lint
npm run lint
```

### DNS não resolve

- Aguarde 24-48h para propagação
- Verifique configuração no GoDaddy
- Use `nslookup pediu.food` para testar

### Erro 500 no Supabase

- Verifique se RLS está configurado
- Verifique se as migrations foram executadas
- Verifique logs no Supabase Dashboard

### Cron job não roda

- Verifique `CRON_SECRET` nas variáveis de ambiente
- Verifique logs no Vercel Dashboard
- Teste manualmente: `curl -H "Authorization: Bearer SEU_CRON_SECRET" https://pediufood.com/api/cron/check-pix-payments`

---

## 🔄 Rollback

Se algo der errado:

1. Vá em Vercel Dashboard → Deployments
2. Encontre o deploy anterior que funcionava
3. Clique nos 3 pontos → "Promote to Production"

---

## 📊 Monitoramento

### Logs

- **Vercel:** Dashboard → Logs
- **Supabase:** Dashboard → Logs
- **Sentry:** Dashboard (se configurado)

### Métricas

- **Uptime:** Use UptimeRobot ou similar
- **Performance:** Vercel Analytics
- **Erros:** Sentry

---

## 🆘 Suporte

- **Documentação:** `AI-HANDOVER.md`
- **Arquitetura:** `ARQUITETURA_ATUAL.md`
- **Domínios:** `DOMINIOS.md`

---

**Última atualização:** 28/12/2025  
**Versão:** 1.0.0
