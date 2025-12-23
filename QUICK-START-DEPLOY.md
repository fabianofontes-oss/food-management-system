# ⚡ GUIA RÁPIDO - DEPLOY EM 30 MINUTOS

## 🎯 OBJETIVO

Colocar o Pediu.food em produção o mais rápido possível.

---

## ⏱️ PASSO A PASSO (30 minutos)

### 1️⃣ SUPABASE (10 minutos)

#### A. Criar Projeto
1. Acesse: https://supabase.com/dashboard
2. **New Project**
3. Preencha:
   - Name: `pediu-food-production`
   - Database Password: (gere uma senha forte)
   - Region: `South America (São Paulo)`
4. Aguarde criação (~2 minutos)

#### B. Copiar Credenciais
1. Settings → API
2. Copie e salve:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ SECRETO!)
   ```

#### C. Aplicar Schema
1. SQL Editor → New Query
2. Abra: `supabase/20251215_all_in_one.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. **Run** (aguarde ~30 segundos)
6. Verificar: `✓ Success. No rows returned`

#### D. Configurar Storage
1. Storage → Create Bucket
2. Criar 4 buckets:
   - `logos` (Public)
   - `banners` (Public)
   - `products` (Public)
   - `proofs` (Private)

---

### 2️⃣ VERCEL (10 minutos)

#### A. Importar Projeto
1. Acesse: https://vercel.com
2. **Add New... → Project**
3. Import Git Repository
4. Selecione: `fabianofontes-oss/food-management-system`
5. **Import**

#### B. Configurar Build
- Framework Preset: **Next.js** (auto-detectado)
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**NÃO CLIQUE EM DEPLOY AINDA!**

#### C. Adicionar Environment Variables

Clique em **Environment Variables** e adicione:

```bash
# OBRIGATÓRIAS (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OBRIGATÓRIAS (Segurança)
INTERNAL_API_TOKEN=gerar-token-32-chars-aqui
CRON_SECRET=gerar-secret-32-chars-aqui

# OBRIGATÓRIA (Super Admin)
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=seu-email@dominio.com
```

**Como gerar tokens:**
- Acesse: https://generate-secret.vercel.app/32
- Copie e cole

**Importante:** Selecione **Production, Preview, Development** para cada variável

#### D. Deploy!
1. Clique em **Deploy**
2. Aguarde build (~3 minutos)
3. ✅ Deploy completo!

---

### 3️⃣ DOMÍNIOS (10 minutos)

#### A. Adicionar Domínios no Vercel

1. Vercel Dashboard → Settings → Domains
2. Add Domain: `pediu.food`
3. Add Domain: `pediufood.com`
4. Add Domain: `pediufood.com.br`

Vercel mostrará os registros DNS necessários.

#### B. Configurar DNS (no seu provedor)

**Para cada domínio, adicione:**

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Wildcard (para subdomínios das lojas):**

```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

**Aguardar propagação:** 5-30 minutos (pode levar até 48h)

---

## ✅ VERIFICAÇÃO RÁPIDA

Após deploy, teste:

1. **Site principal:** https://seu-projeto.vercel.app
   - [ ] Página carrega
   - [ ] Sem erros no console

2. **Login admin:** https://seu-projeto.vercel.app/login
   - [ ] Página carrega
   - [ ] Login funciona com seu email

3. **Dashboard:** https://seu-projeto.vercel.app/admin
   - [ ] Acesso liberado
   - [ ] Dados carregam

4. **Criar loja teste:**
   - [ ] Onboarding funciona
   - [ ] Loja é criada
   - [ ] Slug funciona

---

## 🎉 PRONTO!

Seu sistema está no ar em: `https://seu-projeto.vercel.app`

### Próximos Passos:

1. **Aguardar DNS** (se configurou domínios)
2. **Configurar pagamentos** (opcional)
3. **Adicionar Google OAuth** (opcional)
4. **Convidar usuários**

---

## 🆘 PROBLEMAS COMUNS

### Build falha no Vercel
```
❌ Erro: "Missing environment variables"
✅ Solução: Adicionar todas as env vars obrigatórias
```

### Login não funciona
```
❌ Erro: "Invalid API key"
✅ Solução: Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 500 Internal Server Error
```
❌ Erro: "Database error"
✅ Solução: Verificar se schema foi aplicado no Supabase
```

### Imagens não carregam
```
❌ Erro: "Storage bucket not found"
✅ Solução: Criar buckets no Supabase Storage
```

---

## 📞 SUPORTE

**Logs de erro:**
- Vercel: Dashboard → Deployments → Logs
- Supabase: Dashboard → Logs

**Documentação completa:**
- Ver: `DEPLOY-CHECKLIST.md`

---

**Tempo total:** ~30 minutos
**Dificuldade:** Fácil
**Status:** ✅ Pronto para usar
