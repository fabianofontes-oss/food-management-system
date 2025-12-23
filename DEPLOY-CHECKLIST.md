# 🚀 CHECKLIST DE DEPLOY - PEDIU.FOOD

## ✅ STATUS ATUAL

- ✅ Build passa sem erros
- ✅ TypeScript sem erros
- ✅ ESLint sem warnings
- ✅ Código commitado e pushed
- ⏳ Configuração de produção pendente

---

## 📋 CHECKLIST COMPLETO PARA PRODUÇÃO

### 1️⃣ VARIÁVEIS DE AMBIENTE (OBRIGATÓRIO)

#### Supabase (Essencial)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Como obter:**
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Settings → API
4. Copie: Project URL, anon/public key, service_role key

#### Segurança (Essencial)
```bash
INTERNAL_API_TOKEN=gerar-token-seguro-aleatorio-32-chars
CRON_SECRET=gerar-secret-seguro-aleatorio-32-chars
```

**Como gerar tokens seguros:**
```bash
# No terminal (Linux/Mac)
openssl rand -hex 32

# Ou use: https://generate-secret.vercel.app/32
```

#### Super Admin (Essencial)
```bash
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=seu-email@dominio.com
```

**Importante:** Use seu email real para ter acesso ao painel `/admin`

#### Pagamentos (Opcional - mas recomendado)
```bash
# MercadoPago
MP_ACCESS_TOKEN=seu-access-token-mercadopago

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Como obter:**
- MercadoPago: [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/panel)
- Stripe: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

#### Google OAuth (Opcional)
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

**Como obter:**
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Criar projeto
3. APIs & Services → Credentials
4. Create OAuth 2.0 Client ID

#### Redis/Upstash (Opcional - Rate Limiting)
```bash
UPSTASH_REDIS_REST_URL=https://seu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-aqui
```

**Como obter:**
1. [console.upstash.com](https://console.upstash.com)
2. Create Database
3. Copie REST URL e Token

---

### 2️⃣ CONFIGURAÇÃO DO VERCEL

#### A. Criar Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Import Git Repository
3. Selecione: `fabianofontes-oss/food-management-system`
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### B. Adicionar Variáveis de Ambiente

1. No Vercel Dashboard → Settings → Environment Variables
2. Adicione TODAS as variáveis listadas acima
3. Selecione: **Production, Preview, Development**
4. Clique em **Save**

#### C. Configurar Domínios

**Domínios a configurar:**
- `pediu.food` (principal - lojas)
- `pediufood.com` (site institucional)
- `pediufood.com.br` (site PT-BR)

**Passos:**
1. Vercel Dashboard → Settings → Domains
2. Add Domain: `pediu.food`
3. Add Domain: `pediufood.com`
4. Add Domain: `pediufood.com.br`
5. Vercel fornecerá registros DNS

**Configuração DNS (no seu provedor):**
```
# Para cada domínio, adicione:
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wildcard para subdomínios (lojas):**
```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

Isso permite: `slug.pediu.food` funcionar automaticamente

---

### 3️⃣ CONFIGURAÇÃO DO SUPABASE

#### A. Aplicar Migrations

1. Acesse Supabase Dashboard → SQL Editor
2. Execute em ordem:

```bash
# Migrations principais (já aplicadas?)
supabase/migrations/00000000_init_schema.sql
supabase/migrations/20241213000000_00_fix_stores_rls.sql
# ... (todos os arquivos em ordem)
```

**Verificar se já aplicadas:**
```sql
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 10;
```

#### B. Habilitar Row Level Security (RLS)

Verificar se RLS está ativo em todas as tabelas:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Se alguma tabela tiver `rowsecurity = false`, habilitar:

```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

#### C. Configurar Storage Buckets

1. Supabase Dashboard → Storage
2. Criar buckets:
   - `logos` (público)
   - `banners` (público)
   - `products` (público)
   - `proofs` (privado)

3. Configurar policies de acesso

#### D. Configurar Auth

1. Supabase Dashboard → Authentication → Providers
2. Habilitar:
   - Email (já habilitado)
   - Google (se usar OAuth)

3. Configurar URLs:
   - Site URL: `https://pediu.food`
   - Redirect URLs:
     - `https://pediu.food/**`
     - `https://pediufood.com/**`
     - `https://pediufood.com.br/**`

---

### 4️⃣ TESTES PRÉ-DEPLOY

#### Checklist de Testes:

- [ ] **Build local passa:** `npm run build`
- [ ] **TypeScript OK:** `npx tsc --noEmit`
- [ ] **ESLint OK:** `npm run lint`
- [ ] **Env vars configuradas:** Todas as essenciais
- [ ] **Migrations aplicadas:** Banco configurado
- [ ] **RLS habilitado:** Segurança ativa

#### Testes Funcionais:

- [ ] Login admin funciona
- [ ] Criar loja funciona
- [ ] Cardápio público acessível
- [ ] Pedido pode ser criado
- [ ] Dashboard carrega
- [ ] Motorista pode fazer login

---

### 5️⃣ DEPLOY

#### Opção A: Deploy Automático (Recomendado)

```bash
# Já está configurado! Apenas push para main
git push origin main

# Vercel fará deploy automaticamente
```

#### Opção B: Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy para produção
vercel --prod
```

---

### 6️⃣ PÓS-DEPLOY

#### A. Verificações Imediatas

- [ ] Site carrega: `https://pediu.food`
- [ ] Site carrega: `https://pediufood.com`
- [ ] Login funciona
- [ ] Dashboard acessível
- [ ] Criar loja funciona
- [ ] Subdomínio funciona: `teste.pediu.food`

#### B. Monitoramento

1. **Vercel Analytics**
   - Dashboard → Analytics
   - Verificar erros
   - Verificar performance

2. **Supabase Logs**
   - Dashboard → Logs
   - Verificar queries
   - Verificar erros de auth

3. **Sentry (Opcional)**
   - Configurar para monitorar erros em produção

#### C. Google Search Console

1. Acesse [search.google.com/search-console](https://search.google.com/search-console)
2. Adicionar propriedade: `pediu.food`
3. Verificar propriedade (método HTML tag)
4. Copiar código de verificação
5. Adicionar em `src/app/page.tsx`:

```typescript
export const metadata: Metadata = {
  // ...
  verification: {
    google: 'seu-codigo-de-verificacao-aqui',
  },
}
```

6. Commit e push
7. Aguardar deploy
8. Verificar no Google Search Console

---

### 7️⃣ CONFIGURAÇÕES OPCIONAIS

#### A. Custom Domain Email

Configure emails profissionais:
- `contato@pediu.food`
- `suporte@pediu.food`
- `noreply@pediu.food`

#### B. CDN e Performance

Vercel já inclui:
- ✅ CDN global
- ✅ Edge caching
- ✅ Image optimization
- ✅ Compression

#### C. Backup Automático

Supabase já inclui:
- ✅ Daily backups (7 dias)
- ✅ Point-in-time recovery

Para backups adicionais:
- Configure backup semanal do banco
- Backup de storage buckets

---

## 🔒 SEGURANÇA

### Checklist de Segurança:

- [x] RLS habilitado em todas as tabelas
- [x] Service Role Key nunca exposta no client
- [x] CORS configurado corretamente
- [x] Headers de segurança (vercel.json)
- [x] Rate limiting implementado
- [ ] SSL/HTTPS (Vercel automático)
- [ ] Env vars nunca commitadas

### Boas Práticas:

1. **Nunca commitar:**
   - `.env.local`
   - Chaves privadas
   - Tokens de API

2. **Rotacionar regularmente:**
   - INTERNAL_API_TOKEN
   - CRON_SECRET
   - Service Role Key (se comprometida)

3. **Monitorar:**
   - Logs de acesso
   - Tentativas de login
   - Queries suspeitas

---

## 📊 MÉTRICAS DE SUCESSO

### Após Deploy, Verificar:

1. **Performance**
   - Lighthouse Score > 90
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3.5s

2. **Disponibilidade**
   - Uptime > 99.9%
   - Error rate < 0.1%

3. **Funcionalidade**
   - Todas as rotas acessíveis
   - Autenticação funcionando
   - Pedidos sendo criados

---

## 🆘 TROUBLESHOOTING

### Problemas Comuns:

#### 1. Build falha no Vercel
```
Solução: Verificar logs de build
- Env vars configuradas?
- Migrations aplicadas?
- TypeScript sem erros?
```

#### 2. 404 em subdomínios
```
Solução: Verificar DNS
- CNAME wildcard configurado?
- Aguardar propagação DNS (até 48h)
```

#### 3. Erro de autenticação
```
Solução: Verificar Supabase
- URLs de redirect configuradas?
- Anon key correta?
- RLS configurado?
```

#### 4. Imagens não carregam
```
Solução: Verificar Storage
- Buckets criados?
- Policies configuradas?
- URLs corretas?
```

---

## ✅ CHECKLIST FINAL

Antes de considerar PRONTO:

- [ ] Todas as env vars configuradas
- [ ] Domínios apontando corretamente
- [ ] SSL ativo (HTTPS)
- [ ] Migrations aplicadas
- [ ] RLS habilitado
- [ ] Storage configurado
- [ ] Testes funcionais passando
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Documentação atualizada

---

## 🎉 DEPLOY COMPLETO!

Após completar todos os itens acima, seu sistema estará:

✅ **100% funcional**
✅ **Seguro**
✅ **Escalável**
✅ **Monitorado**
✅ **Pronto para receber usuários**

---

## 📞 SUPORTE

**Documentação:**
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)

**Contato:**
- Email: fabianobraga@me.com
- GitHub: [github.com/fabianofontes-oss](https://github.com/fabianofontes-oss)

---

**Última atualização:** 23/12/2025
**Versão:** 1.0.0
**Status:** ✅ Pronto para Deploy
