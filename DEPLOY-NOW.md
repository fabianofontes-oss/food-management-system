# 🚀 DEPLOY AGORA - PASSO A PASSO INTERATIVO

## ⚡ DEPLOY NO VERCEL EM 15 MINUTOS

Siga exatamente estas etapas na ordem.

---

## 📋 PRÉ-REQUISITOS

Você vai precisar de:
- [ ] Conta no Supabase (ou criar agora)
- [ ] Conta no Vercel (ou criar agora)
- [ ] 15 minutos de tempo

---

## ETAPA 1: CRIAR PROJETO NO SUPABASE (5 min)

### 1.1 Acessar Supabase
1. Abra: https://supabase.com
2. Clique em **"Start your project"** ou **"Sign in"**
3. Login com GitHub (recomendado)

### 1.2 Criar Novo Projeto
1. Clique em **"New Project"**
2. Preencha:
   - **Name:** `pediu-food-prod` (ou qualquer nome)
   - **Database Password:** Clique em "Generate a password" e COPIE
   - **Region:** Selecione `South America (São Paulo)`
   - **Pricing Plan:** Free (gratuito)
3. Clique em **"Create new project"**
4. ⏳ Aguarde 2-3 minutos (vai criar o banco)

### 1.3 Copiar Credenciais
Quando o projeto estiver pronto:

1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você verá 3 informações importantes:

**COPIE E SALVE EM UM BLOCO DE NOTAS:**

```
Project URL: https://xxxxxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

⚠️ **IMPORTANTE:** O `service_role key` é SECRETO! Nunca compartilhe.

### 1.4 Aplicar Schema do Banco
1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo: `C:\Users\User\CascadeProjects\food-management-system\supabase\20251215_all_in_one.sql`
4. Copie TODO o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter)
7. ⏳ Aguarde ~30 segundos
8. Você deve ver: ✅ **"Success. No rows returned"**

### 1.5 Criar Storage Buckets
1. No menu lateral, clique em **Storage**
2. Clique em **"Create a new bucket"**
3. Crie 4 buckets (um de cada vez):

**Bucket 1:**
- Name: `logos`
- Public bucket: ✅ **Marcar**
- Clique em **"Create bucket"**

**Bucket 2:**
- Name: `banners`
- Public bucket: ✅ **Marcar**
- Clique em **"Create bucket"**

**Bucket 3:**
- Name: `products`
- Public bucket: ✅ **Marcar**
- Clique em **"Create bucket"**

**Bucket 4:**
- Name: `proofs`
- Public bucket: ❌ **NÃO marcar** (privado)
- Clique em **"Create bucket"**

✅ **Supabase configurado!**

---

## ETAPA 2: GERAR TOKENS DE SEGURANÇA (2 min)

Você precisa gerar 2 tokens aleatórios de 32 caracteres.

### Opção A: Usar Gerador Online
1. Abra: https://generate-secret.vercel.app/32
2. Copie o primeiro token gerado
3. **SALVE COMO:** `INTERNAL_API_TOKEN`
4. Atualize a página (F5)
5. Copie o segundo token gerado
6. **SALVE COMO:** `CRON_SECRET`

### Opção B: Usar PowerShell (Windows)
```powershell
# Abra PowerShell e execute:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```
Execute 2 vezes para gerar 2 tokens diferentes.

**SALVE NO BLOCO DE NOTAS:**
```
INTERNAL_API_TOKEN=seu-token-1-aqui
CRON_SECRET=seu-token-2-aqui
```

---

## ETAPA 3: DEPLOY NO VERCEL (8 min)

### 3.1 Acessar Vercel
1. Abra: https://vercel.com
2. Clique em **"Sign Up"** ou **"Login"**
3. Login com GitHub (recomendado)
4. Autorize o Vercel a acessar seus repositórios

### 3.2 Importar Projeto
1. No dashboard, clique em **"Add New..."**
2. Selecione **"Project"**
3. Na lista de repositórios, encontre: **`food-management-system`**
4. Clique em **"Import"**

### 3.3 Configurar Projeto
Na tela de configuração:

**Framework Preset:** Next.js (já selecionado automaticamente)
**Root Directory:** `./` (deixe como está)
**Build Command:** `npm run build` (já preenchido)
**Output Directory:** `.next` (já preenchido)
**Install Command:** `npm install` (já preenchido)

⚠️ **NÃO CLIQUE EM DEPLOY AINDA!**

### 3.4 Adicionar Environment Variables

Role a página até a seção **"Environment Variables"**

Clique em **"Add"** e adicione CADA variável abaixo:

**Variável 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: (cole o Project URL do Supabase)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: (cole o anon public key do Supabase)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 3:**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: (cole o service_role key do Supabase)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 4:**
- Key: `INTERNAL_API_TOKEN`
- Value: (cole o token 1 que você gerou)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 5:**
- Key: `CRON_SECRET`
- Value: (cole o token 2 que você gerou)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 6:**
- Key: `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`
- Value: `seu-email@dominio.com` (use o email que você usa no GitHub)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variável 7 (Opcional - MercadoPago):**
- Key: `MP_ACCESS_TOKEN`
- Value: (deixe vazio por enquanto ou adicione seu token)
- Environments: ✅ Production, ✅ Preview, ✅ Development

### 3.5 Deploy!
1. Verifique se adicionou TODAS as 6 variáveis obrigatórias
2. Clique no botão azul **"Deploy"**
3. ⏳ Aguarde 3-5 minutos (o Vercel vai fazer o build)
4. Você verá uma animação de progresso

### 3.6 Sucesso!
Quando terminar, você verá:
- 🎉 **Congratulations!**
- Um link para seu site: `https://seu-projeto.vercel.app`

---

## ETAPA 4: TESTAR O SITE (2 min)

### 4.1 Acessar o Site
1. Clique no link do seu site (ou copie e cole no navegador)
2. O site deve carregar a landing page do Pediu.food

### 4.2 Testar Login Admin
1. Adicione `/login` na URL: `https://seu-projeto.vercel.app/login`
2. Faça login com o email que você configurou em `SUPER_ADMIN_EMAILS`
3. Senha: (a senha que você criou no Supabase Auth)

**Se não tiver usuário ainda:**
1. Vá em: `https://seu-projeto.vercel.app/signup`
2. Crie uma conta com o email que você configurou
3. Verifique seu email e confirme
4. Faça login

### 4.3 Acessar Dashboard Admin
1. Após login, vá para: `https://seu-projeto.vercel.app/admin`
2. Você deve ver o painel de super admin

✅ **SITE NO AR!**

---

## 🎉 PARABÉNS! SEU SITE ESTÁ ONLINE!

**URL do seu site:** `https://seu-projeto.vercel.app`

### O que você pode fazer agora:

1. **Criar sua primeira loja:**
   - Acesse: `/criar-loja`
   - Preencha os dados
   - Sua loja estará em: `https://seu-projeto.vercel.app/sua-loja`

2. **Acessar painel admin:**
   - URL: `/admin`
   - Gerenciar planos, lojas, usuários

3. **Configurar domínio personalizado** (opcional):
   - Vercel Dashboard → Settings → Domains
   - Adicionar: `pediu.food`, `pediufood.com`, etc.

---

## 🆘 PROBLEMAS COMUNS

### Build falhou no Vercel
**Erro:** "Missing environment variables"
**Solução:** Verificar se adicionou TODAS as 6 variáveis obrigatórias

### Site carrega mas dá erro 500
**Erro:** "Database connection failed"
**Solução:** Verificar se aplicou o schema SQL no Supabase

### Não consigo fazer login
**Erro:** "Invalid credentials"
**Solução:** 
1. Criar usuário em `/signup`
2. Verificar email
3. Tentar login novamente

### Imagens não aparecem
**Erro:** "Storage bucket not found"
**Solução:** Verificar se criou os 4 buckets no Supabase Storage

---

## 📞 PRECISA DE AJUDA?

**Logs de erro:**
- Vercel: Dashboard → Deployments → (clique no deploy) → Logs
- Supabase: Dashboard → Logs

**Documentação:**
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

---

## ✅ CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Supabase projeto criado
- [ ] Schema SQL aplicado
- [ ] Storage buckets criados
- [ ] Tokens de segurança gerados
- [ ] Vercel projeto importado
- [ ] 6 variáveis de ambiente adicionadas
- [ ] Deploy realizado com sucesso
- [ ] Site acessível na URL
- [ ] Login funcionando
- [ ] Dashboard admin acessível

---

**Tempo total:** ~15 minutos
**Custo:** R$ 0,00 (tudo gratuito)
**Status:** 🚀 PRONTO PARA USAR!
