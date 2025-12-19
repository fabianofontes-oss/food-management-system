# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## 📋 DOMÍNIOS CONFIGURADOS

Seu sistema está preparado para funcionar com **3 domínios**:

1. **pediu.food** - Principal (para lojas dos clientes)
2. **pediufood.com.br** - Alternativo Brasil
3. **pediufood.com** - Alternativo Internacional

---

## 🌐 CONFIGURAÇÃO DE DNS

### 1. Domínio Principal: pediu.food

**Registros DNS necessários:**

```
# Landing page e admin
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com

# Wildcard para lojas (slug.pediu.food)
*                  CNAME  cname.vercel-dns.com
```

**Exemplos de URLs que funcionarão:**
- `pediu.food` → Landing page
- `www.pediu.food` → Landing page
- `acai-do-joao.pediu.food` → Loja do João
- `burger-mania.pediu.food` → Loja Burger Mania

---

### 2. Domínio Alternativo BR: pediufood.com.br

**Registros DNS necessários:**

```
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com
*                  CNAME  cname.vercel-dns.com
```

**Exemplos de URLs:**
- `pediufood.com.br` → Landing page
- `acai-do-joao.pediufood.com.br` → Loja do João

---

### 3. Domínio Alternativo Internacional: pediufood.com

**Registros DNS necessários:**

```
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com
*                  CNAME  cname.vercel-dns.com
```

**Exemplos de URLs:**
- `pediufood.com` → Landing page
- `acai-do-joao.pediufood.com` → Loja do João

---

## ⚙️ CONFIGURAÇÃO NO VERCEL

### 1. Adicionar Domínios no Projeto

No painel da Vercel:

1. Acesse seu projeto
2. Vá em **Settings** → **Domains**
3. Adicione os 3 domínios:
   - `pediu.food`
   - `pediufood.com.br`
   - `pediufood.com`
4. Para cada domínio, marque:
   - ✅ **Include www subdomain**
   - ✅ **Include all subdomains (wildcard)**

---

### 2. Variáveis de Ambiente

Configure estas variáveis em **Settings** → **Environment Variables**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (⚠️ NUNCA exponha publicamente)

# Domínio principal
NEXT_PUBLIC_BASE_DOMAIN=pediu.food

# URL pública (para emails, webhooks, etc)
NEXT_PUBLIC_PUBLIC_APP_URL=https://pediu.food

# Super Admin
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=seu-email@gmail.com

# Stripe (quando integrar)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# WhatsApp Business (quando integrar)
WHATSAPP_BUSINESS_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

---

## 🔒 CERTIFICADOS SSL

A Vercel gera certificados SSL automaticamente para:
- ✅ Domínio principal (`pediu.food`)
- ✅ Wildcard (`*.pediu.food`)
- ✅ Todos os 3 domínios configurados

**Tempo de propagação:** 24-48 horas

---

## 📊 CHECKLIST DE DEPLOY

### Antes do Deploy

- [ ] Migrations aplicadas no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Domínios adicionados na Vercel
- [ ] DNS configurado nos registradores
- [ ] Testes locais passando
- [ ] Build local funcionando (`npm run build`)

### Após o Deploy

- [ ] Acessar `pediu.food` e verificar landing page
- [ ] Testar onboarding completo
- [ ] Criar loja de teste
- [ ] Verificar se subdomínio funciona (`teste.pediu.food`)
- [ ] Testar cardápio público
- [ ] Testar checkout
- [ ] Verificar emails do Supabase
- [ ] Monitorar erros no Vercel

---

## 🎯 FLUXO DE LOJAS EM PRODUÇÃO

### Como funciona para o lojista:

1. **Escolhe URL:** `acai-do-joao`
2. **Configura loja** sem cadastro
3. **Publica** e cria conta
4. **Trial de 10 dias** ativado automaticamente
5. **Acessa dashboard:** `acai-do-joao.pediu.food/dashboard`
6. **Clientes acessam:** `acai-do-joao.pediu.food`

### Domínios alternativos:

O lojista pode compartilhar qualquer uma dessas URLs:
- `acai-do-joao.pediu.food` ✅
- `acai-do-joao.pediufood.com.br` ✅
- `acai-do-joao.pediufood.com` ✅

Todas funcionam e levam para a mesma loja!

---

## 🐛 TROUBLESHOOTING

### DNS não propaga

**Problema:** Domínio não resolve após 48h

**Solução:**
1. Verificar registros DNS no registrador
2. Usar `nslookup pediu.food` para testar
3. Limpar cache DNS: `ipconfig /flushdns` (Windows)
4. Verificar na Vercel se domínio está "Active"

### SSL não funciona

**Problema:** Certificado SSL não é gerado

**Solução:**
1. Aguardar 24-48h após configurar DNS
2. Verificar se wildcard (`*`) está configurado
3. Remover e adicionar domínio novamente na Vercel
4. Verificar se não há conflito com Cloudflare

### Subdomínio não funciona

**Problema:** `loja.pediu.food` retorna 404

**Solução:**
1. Verificar se loja existe no banco (`stores` table)
2. Verificar se wildcard DNS está configurado
3. Testar com path: `pediu.food/loja` (deve funcionar)
4. Verificar logs da Vercel

### Middleware não resolve slug

**Problema:** Subdomínio não redireciona para loja

**Solução:**
1. Verificar logs do middleware na Vercel
2. Testar localmente: `demo.localhost:3002`
3. Verificar se slug não é reservado (`www`, `admin`, `app`, `api`)
4. Verificar variável `NEXT_PUBLIC_BASE_DOMAIN`

---

## 📈 MONITORAMENTO

### Vercel Analytics

Ative no painel da Vercel:
- **Analytics** → Performance, Core Web Vitals
- **Logs** → Runtime logs, Build logs
- **Speed Insights** → Métricas de velocidade

### Supabase Monitoring

Monitore no painel do Supabase:
- **Database** → Query performance
- **Auth** → Signups, logins
- **Storage** → Usage
- **Logs** → Errors

### Sentry (Recomendado)

Integre Sentry para monitorar erros em produção:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 🚦 STATUS DO SISTEMA

### ✅ Pronto para Produção

- ✅ Onboarding anônimo
- ✅ Multi-tenant (RLS)
- ✅ Cardápio público
- ✅ Checkout completo
- ✅ Dashboard do lojista
- ✅ SuperAdmin
- ✅ Multi-domínio

### ⚠️ Pendente (Não-bloqueador)

- ⏳ Integração Stripe (billing real)
- ⏳ Integração WhatsApp (notificações)
- ⏳ Integração Google My Business
- ⏳ Testes E2E completos

### 🔴 Bloqueador (CRÍTICO)

- ❌ **Billing sem gateway** - Sistema não cobra automaticamente
  - **Impacto:** Sem receita
  - **Solução:** Integrar Stripe (3-5 dias)

---

## 💰 PRÓXIMOS PASSOS PARA MONETIZAR

### 1. Integrar Stripe (Prioridade 1)

**Tempo:** 3-5 dias

**O que fazer:**
1. Criar conta no Stripe
2. Configurar produtos e preços
3. Implementar checkout de assinatura
4. Webhook para atualizar status
5. Suspensão automática de inadimplentes

### 2. Pegar Beta Testers (Prioridade 2)

**Tempo:** 1 semana

**O que fazer:**
1. Pegar 5-10 lojistas conhecidos
2. Oferecer trial de 30 dias (ao invés de 10)
3. Coletar feedback
4. Corrigir bugs críticos
5. Validar se alguém paga após trial

### 3. Marketing (Prioridade 3)

**Tempo:** Contínuo

**O que fazer:**
1. Criar perfis nas redes sociais
2. Fazer anúncios no Google/Facebook
3. Parcerias com associações de restaurantes
4. Conteúdo educativo (blog, vídeos)
5. SEO (otimizar landing page)

---

## 📞 SUPORTE

**Em caso de problemas:**

1. Verificar logs da Vercel
2. Verificar logs do Supabase
3. Testar localmente primeiro
4. Consultar documentação:
   - Vercel: https://vercel.com/docs
   - Supabase: https://supabase.com/docs
   - Next.js: https://nextjs.org/docs

---

## 🎉 CONCLUSÃO

Seu sistema está **80% pronto** para produção!

**Bloqueador único:** Integração com Stripe para billing real.

**Recomendação:** Deploy agora, pegue beta testers, valide o produto, depois integre Stripe.

**Boa sorte! 🚀**
