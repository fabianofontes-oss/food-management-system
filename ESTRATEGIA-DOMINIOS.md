# 🌐 ESTRATÉGIA DE DOMÍNIOS - Food Management System

## 📋 VISÃO GERAL

O sistema utiliza **3 domínios** com propósitos diferentes:

### 1. **pediufood.com** - Site Principal (Inglês/Internacional)
- Landing page institucional
- Área de login/cadastro
- SuperAdmin
- Documentação
- Blog (futuro)

### 2. **pediufood.com.br** - Espelho em Português
- Mesma estrutura do .com
- Conteúdo traduzido para PT-BR
- Focado no mercado brasileiro
- SEO otimizado para Brasil

### 3. **pediu.food** - URLs Curtas para Lojas
- **Exclusivo para lojas dos clientes**
- URLs curtas e memoráveis
- Exemplo: `acai-do-joao.pediu.food`
- Fácil de compartilhar no WhatsApp

---

## 🎯 EXEMPLOS DE USO

### Site Principal (pediufood.com)

```
pediufood.com                    → Landing page (inglês)
pediufood.com/login              → Login
pediufood.com/signup             → Cadastro
pediufood.com/admin              → SuperAdmin
pediufood.com/pricing            → Preços
pediufood.com/docs               → Documentação
```

### Site em Português (pediufood.com.br)

```
pediufood.com.br                 → Landing page (português)
pediufood.com.br/login           → Login
pediufood.com.br/cadastro        → Cadastro (traduzido)
pediufood.com.br/admin           → SuperAdmin
pediufood.com.br/precos          → Preços (traduzido)
pediufood.com.br/docs            → Documentação (PT-BR)
```

### Lojas dos Clientes (pediu.food)

```
acai-do-joao.pediu.food          → Cardápio da loja
acai-do-joao.pediu.food/cart     → Carrinho
acai-do-joao.pediu.food/checkout → Checkout
acai-do-joao.pediu.food/dashboard → Dashboard do lojista
```

---

## 🔄 FLUXO DO LOJISTA

### Onboarding

1. Lojista acessa: `pediufood.com.br` (ou .com)
2. Clica em "Criar minha loja grátis"
3. Escolhe slug: `acai-do-joao`
4. Sistema mostra preview: `acai-do-joao.pediu.food`
5. Configura loja sem cadastro
6. Publica e cria conta
7. Trial de 10 dias ativado

### Compartilhamento

Lojista compartilha com clientes:
- ✅ `acai-do-joao.pediu.food` (URL curta e fácil)
- ❌ `acai-do-joao.pediufood.com.br` (muito longa)

### Gestão

Lojista acessa dashboard:
- `acai-do-joao.pediu.food/dashboard`
- Ou via: `pediufood.com.br/select-store` (se tiver múltiplas lojas)

---

## 🌍 INTERNACIONALIZAÇÃO

### Landing Page

**pediufood.com (Inglês):**
```
Headline: "Complete Food Management System"
CTA: "Start Free Trial"
Features: "Menu, Orders, POS, Delivery..."
```

**pediufood.com.br (Português):**
```
Headline: "Sistema Completo de Gestão para Alimentação"
CTA: "Começar Teste Grátis"
Features: "Cardápio, Pedidos, PDV, Delivery..."
```

### Detecção Automática

O sistema pode detectar idioma do navegador:

```typescript
// Exemplo de detecção
const userLang = navigator.language // 'pt-BR', 'en-US', etc
if (userLang.startsWith('pt')) {
  // Redirecionar para .com.br
  window.location.href = 'https://pediufood.com.br'
} else {
  // Manter em .com
}
```

---

## 🔧 CONFIGURAÇÃO TÉCNICA

### DNS - pediufood.com (Principal)

```
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com
*                  CNAME  cname.vercel-dns.com (opcional)
```

### DNS - pediufood.com.br (PT-BR)

```
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com
*                  CNAME  cname.vercel-dns.com (opcional)
```

### DNS - pediu.food (Lojas)

```
@ (root)           A      76.76.21.21 (Vercel)
www                CNAME  cname.vercel-dns.com
*                  CNAME  cname.vercel-dns.com (OBRIGATÓRIO - wildcard)
```

**⚠️ IMPORTANTE:** O wildcard (`*`) é **obrigatório** no `pediu.food` para que os subdomínios das lojas funcionem.

---

## 📊 VANTAGENS DESSA ESTRATÉGIA

### 1. URLs Curtas para Lojas
✅ `acai-do-joao.pediu.food` é fácil de lembrar  
✅ Fácil de digitar no celular  
✅ Compartilha bem no WhatsApp  
✅ Profissional e memorável  

### 2. Branding Separado
✅ `pediufood.com` = Marca institucional  
✅ `pediu.food` = Produto (lojas)  
✅ Não confunde o cliente final  

### 3. SEO Otimizado
✅ `.com` = Mercado internacional  
✅ `.com.br` = Mercado brasileiro  
✅ Conteúdo específico por região  

### 4. Escalabilidade
✅ Pode adicionar mais domínios no futuro  
✅ Pode criar subdomínios específicos (api.pediufood.com)  
✅ Pode ter versões em outros idiomas  

---

## 🎨 BRANDING

### Logo e Identidade

**pediufood.com / .com.br:**
- Logo completo: "PediuFood"
- Slogan: "Complete Food Management System"
- Cores: Roxo (#8b5cf6) + Gradiente

**pediu.food:**
- Logo simplificado: "Pediu"
- Sem slogan (foco na loja do cliente)
- Cores neutras (branco/cinza)

### Comunicação

**Para lojistas:**
- "Crie sua loja no PediuFood"
- "Sua URL será: seunome.pediu.food"

**Para clientes finais:**
- Veem apenas: "acai-do-joao.pediu.food"
- Não veem marca PediuFood (white-label)

---

## 🚀 IMPLEMENTAÇÃO

### Variáveis de Ambiente

```bash
# Domínio principal (institucional)
NEXT_PUBLIC_MAIN_DOMAIN=pediufood.com

# Domínio para lojas (subdomínios)
NEXT_PUBLIC_BASE_DOMAIN=pediu.food

# URL pública (para emails, webhooks)
NEXT_PUBLIC_PUBLIC_APP_URL=https://pediufood.com
```

### Middleware (já configurado)

O middleware detecta automaticamente:
- `pediufood.com` → Landing page
- `pediufood.com.br` → Landing page (PT-BR)
- `slug.pediu.food` → Loja do cliente

### Redirecionamentos

```typescript
// Se acessar pediu.food (sem subdomínio)
if (hostname === 'pediu.food') {
  // Redirecionar para site principal
  return NextResponse.redirect('https://pediufood.com.br')
}

// Se acessar www.pediu.food
if (hostname === 'www.pediu.food') {
  // Redirecionar para site principal
  return NextResponse.redirect('https://pediufood.com.br')
}
```

---

## 📈 ANALYTICS

### Separar por Domínio

**Google Analytics:**
- Property 1: `pediufood.com` (site institucional)
- Property 2: `pediu.food` (lojas dos clientes)

**Métricas importantes:**
- Conversão de visitantes → cadastros (pediufood.com)
- Conversão de visitantes → pedidos (pediu.food)
- Taxa de rejeição por domínio
- Tempo médio por sessão

---

## 🎯 MARKETING

### SEO

**pediufood.com:**
- Keywords: "food management system", "restaurant software", "POS system"
- Foco: B2B (donos de restaurantes)

**pediufood.com.br:**
- Keywords: "sistema para restaurante", "cardápio digital", "gestão de pedidos"
- Foco: B2B Brasil

**pediu.food:**
- Keywords: Nome das lojas (ex: "açaí do joão")
- Foco: B2C (clientes finais)

### Anúncios

**Google Ads:**
- Campanha 1: "Sistema para Restaurantes" → pediufood.com.br
- Campanha 2: "Cardápio Digital" → pediufood.com.br
- Campanha 3: Remarketing → Lojas específicas (pediu.food)

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### DNS
- [ ] Configurar A records para os 3 domínios
- [ ] Configurar CNAME www para os 3 domínios
- [ ] Configurar wildcard (*) para pediu.food
- [ ] Aguardar propagação (24-48h)

### Vercel
- [ ] Adicionar pediufood.com
- [ ] Adicionar pediufood.com.br
- [ ] Adicionar pediu.food
- [ ] Marcar "Include all subdomains" no pediu.food
- [ ] Verificar SSL para todos

### Código
- [x] Middleware configurado
- [x] Variáveis de ambiente definidas
- [ ] Redirecionamentos implementados
- [ ] Testes de subdomínio

### Conteúdo
- [ ] Landing page em inglês (pediufood.com)
- [ ] Landing page em português (pediufood.com.br)
- [ ] Emails em 2 idiomas
- [ ] Documentação em 2 idiomas

---

## 🎉 RESULTADO FINAL

**Lojista:**
1. Acessa `pediufood.com.br`
2. Cria loja: `acai-do-joao`
3. Recebe URL: `acai-do-joao.pediu.food`
4. Compartilha com clientes

**Cliente:**
1. Recebe link: `acai-do-joao.pediu.food`
2. Acessa cardápio
3. Faz pedido
4. Nunca vê marca "PediuFood"

**Você (Admin):**
1. Gerencia tudo em `pediufood.com/admin`
2. Monitora todas as lojas
3. Cobra via Stripe
4. Escala o negócio

---

## 💡 DICAS FINAIS

1. **Priorize pediu.food** - É o domínio que os clientes finais verão
2. **Invista em SEO** no .com.br - Mercado brasileiro é grande
3. **Use .com para expansão** - Quando crescer internacionalmente
4. **Mantenha URLs curtas** - Facilita compartilhamento
5. **Teste tudo** - Antes de divulgar para lojistas

---

**Boa sorte com o lançamento! 🚀**
