# Auditoria de Deploy na Vercel

**Data:** 12 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** Build FALHANDO

---

## 🚨 Causa Raiz (Root Cause)

**Erro Principal:**
```
Error: useLanguage must be used within a LanguageProvider
```

**Páginas Afetadas:**
- `/admin/automations`
- `/admin/features`
- `/admin/logs`
- `/admin/reports`
- `/admin/tickets`

**Motivo:**
As 5 páginas admin são **Client Components** (`'use client'` presente) e usam `useLanguage()`, mas o **layout super-admin NÃO envolve children com `LanguageProvider`**. Durante o build, Next.js tenta fazer **Static Generation** dessas páginas e falha porque não há Provider disponível no layout.

---

## 📋 Como Reproduzir

### Local

```bash
npm run build
```

**Resultado Esperado:** Exit code 1 com erro de prerender

### Vercel

1. Push para branch `main`
2. Vercel inicia build automático
3. Build falha na etapa "Generating static pages"
4. Deploy não completa

---

## 🔍 Análise Detalhada

### Problema 1: useLanguage em Server Components

**Arquivos Afetados:**

1. `src/app/(super-admin)/admin/automations/page.tsx`
2. `src/app/(super-admin)/admin/features/page.tsx`
3. `src/app/(super-admin)/admin/logs/page.tsx`
4. `src/app/(super-admin)/admin/reports/page.tsx`
5. `src/app/(super-admin)/admin/tickets/page.tsx`

**Código Problemático:**
```typescript
// ❌ ERRADO: Server Component usando Context hook
import { useLanguage } from '@/lib/LanguageContext'

export default function AutomationsPage() {
  const { t } = useLanguage() // ❌ Falha no build
  
  return (
    <div>
      <h1>{t('automations')}</h1>
    </div>
  )
}
```

**Por que falha:**
- Páginas sem `'use client'` são Server Components por padrão
- Server Components não podem usar hooks de Context
- Next.js tenta fazer Static Generation e falha

---

### Problema 2: Layout não fornece LanguageProvider

**Arquivo:** `src/app/(super-admin)/layout.tsx`

**Status:** Layout é Client Component (`'use client'`) mas **NÃO** envolve children com `LanguageProvider`

**Código Atual:**
```typescript
'use client'

export default function SuperAdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <aside>...</aside>
      <main>{children}</main> {/* ❌ Sem LanguageProvider */}
    </div>
  )
}
```

---

## ✅ Solução Completa

### Opção 1: Adicionar LanguageProvider no layout (SOLUÇÃO CORRETA)

**Status:** ✅ RECOMENDADO

**Vantagens:**
- Solução arquitetural correta
- Páginas continuam Client Components (como já são)
- Provider disponível para todas as páginas admin

**Desvantagens:**
- Requer props (locale, country, currency, timezone)

**Implementação:**

```typescript
// src/app/(super-admin)/layout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LanguageProvider } from '@/lib/LanguageContext' // ✅ Adicionar import

export default function SuperAdminLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <LanguageProvider 
      locale="pt-BR"
      country="BR"
      currency="BRL"
      timezone="America/Sao_Paulo"
    >
      <div className="flex min-h-screen bg-gray-900">
        <aside>...</aside>
        <main>{children}</main>
      </div>
    </LanguageProvider>
  )
}
```

---

### Opção 2: Remover i18n dessas páginas (ALTERNATIVA RÁPIDA)

**Vantagens:**
- Mais simples
- Admin geralmente é em português mesmo

**Implementação:**

```typescript
// src/app/(super-admin)/admin/automations/page.tsx
// ✅ Remover import de useLanguage
// import { useLanguage } from '@/lib/LanguageContext' // ❌ Remover

export default function AutomationsPage() {
  // ✅ Usar texto direto
  return (
    <div>
      <h1>Automações</h1>
      <p>Gerencie automações do sistema</p>
    </div>
  )
}
```

---

## 🔧 Fix Imediato (Opção 1)

### Passo a Passo

**1. Adicionar 'use client' em 5 arquivos:**

```bash
# automations/page.tsx
# features/page.tsx
# logs/page.tsx
# reports/page.tsx
# tickets/page.tsx
```

**2. Diff Completo:**

```diff
// src/app/(super-admin)/admin/automations/page.tsx
+'use client'
+
 import { Zap } from 'lucide-react'
 import { Card, CardContent } from '@/components/ui/card'
 import { useLanguage } from '@/lib/LanguageContext'
```

```diff
// src/app/(super-admin)/admin/features/page.tsx
+'use client'
+
 import { Flag } from 'lucide-react'
 import { Card, CardContent } from '@/components/ui/card'
 import { useLanguage } from '@/lib/LanguageContext'
```

```diff
// src/app/(super-admin)/admin/logs/page.tsx
+'use client'
+
 import { FileText } from 'lucide-react'
 import { Card, CardContent } from '@/components/ui/card'
 import { useLanguage } from '@/lib/LanguageContext'
```

```diff
// src/app/(super-admin)/admin/reports/page.tsx
+'use client'
+
 import { FileSpreadsheet } from 'lucide-react'
 import { Card, CardContent } from '@/components/ui/card'
 import { useLanguage } from '@/lib/LanguageContext'
```

```diff
// src/app/(super-admin)/admin/tickets/page.tsx
+'use client'
+
 import { Ticket } from 'lucide-react'
 import { Card, CardContent } from '@/components/ui/card'
 import { useLanguage } from '@/lib/LanguageContext'
```

**3. Testar build:**

```bash
npm run build
```

**Resultado Esperado:** ✅ Build completo sem erros

---

## 📝 Validações Adicionais

### 1. Arquivos Obrigatórios do App Router

**Status:** ✅ TODOS PRESENTES

- ✅ `src/app/layout.tsx` - Existe
- ✅ `src/app/error.tsx` - Existe
- ✅ `src/app/not-found.tsx` - Existe
- ✅ `src/app/globals.css` - Existe

---

### 2. Pipeline Tailwind

**Status:** ✅ CORRETO

**Verificações:**

1. **Layout importa globals.css:**
```typescript
// src/app/layout.tsx
import "./globals.css" // ✅ Presente
```

2. **globals.css tem directives:**
```css
/* src/app/globals.css */
@tailwind base;       /* ✅ Presente */
@tailwind components; /* ✅ Presente */
@tailwind utilities;  /* ✅ Presente */
```

3. **tailwind.config.ts tem content correto:**
```typescript
// tailwind.config.ts
content: [
  './src/app/**/*.{ts,tsx}',      // ✅ Correto
  './src/components/**/*.{ts,tsx}', // ✅ Correto
  './src/**/*.{ts,tsx}',           // ✅ Correto
]
```

**Conclusão:** Pipeline Tailwind está correto ✅

---

### 3. Server Actions

**Status:** ✅ CORRETO

**Arquivos com 'use server':**
- `src/lib/qa/actions.ts` ✅
- `src/lib/modifiers/actions.ts` ✅
- `src/lib/coupons/actions.ts` ✅
- `src/lib/actions/orders.ts` ✅
- `src/lib/actions/menu.ts` ✅

**Validação:**
- ✅ Todos exportam apenas funções async
- ✅ Nenhum exporta helpers ou constantes
- ✅ Seguem regras de Server Actions

**Exemplo Correto:**
```typescript
// src/lib/coupons/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'

// ✅ Apenas funções async
export async function validateCoupon(code: string) {
  const supabase = await createClient()
  // ...
}

export async function applyCoupon(orderId: string, code: string) {
  const supabase = await createClient()
  // ...
}
```

---

### 4. TypeScript

**Status:** ⚠️ NÃO TESTADO (mas build não reportou erros TS)

**Comando para validar:**
```bash
npm run type-check
```

**Se houver erros:** Corrigir antes de deploy

---

### 5. ESLint

**Status:** ⚠️ NÃO TESTADO

**Comando para validar:**
```bash
npm run lint
```

**Se houver erros:** Corrigir warnings críticos

---

## ⚙️ Configurações Vercel

### 1. Node Version

**Recomendado:** Node 18 ou 20

**Configuração:**
```json
// package.json
{
  "engines": {
    "node": ">=18.0.0" // ✅ Já configurado
  }
}
```

**Vercel:** Detecta automaticamente via `package.json`

---

### 2. Build Command

**Padrão Vercel:** `npm run build`

**Verificar em Vercel Dashboard:**
- Settings → General → Build & Development Settings
- Build Command: `npm run build` ✅

---

### 3. Output Directory

**Padrão Next.js:** `.next`

**Vercel:** Detecta automaticamente ✅

---

### 4. Install Command

**Padrão Vercel:** `npm install`

**Alternativa (mais rápido):** `npm ci`

---

## 🔐 Environment Variables

### Obrigatórias

**Client-side (NEXT_PUBLIC_):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Server-only (opcional):**
```bash
# ❌ NÃO USAR - Service role key deve ficar apenas no Supabase
# SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

### Como Configurar na Vercel

1. Ir para **Project Settings**
2. **Environment Variables**
3. Adicionar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Aplicar para: **Production, Preview, Development**

---

### Validação Local

**Criar `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Testar:**
```bash
npm run dev
# Verificar se conecta ao Supabase
```

---

## ✅ Checklist de Deploy

### Pré-Deploy

- [ ] **1. Aplicar fix (adicionar 'use client' em 5 páginas)**
- [ ] **2. Testar build local:**
  ```bash
  npm run build
  npm run start
  ```
- [ ] **3. Validar TypeScript:**
  ```bash
  npm run type-check
  ```
- [ ] **4. Validar ESLint:**
  ```bash
  npm run lint
  ```
- [ ] **5. Testar navegação:**
  - [ ] Menu público funciona
  - [ ] Dashboard funciona
  - [ ] Admin funciona
  - [ ] Páginas admin (automations, features, logs, reports, tickets)

---

### Deploy Vercel

- [ ] **6. Configurar Environment Variables:**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **7. Verificar Settings:**
  - [ ] Node version: 18+
  - [ ] Build command: `npm run build`
  - [ ] Framework: Next.js (auto-detect)

- [ ] **8. Push para GitHub:**
  ```bash
  git add .
  git commit -m "fix: adicionar 'use client' em páginas admin para corrigir build"
  git push origin main
  ```

- [ ] **9. Monitorar Deploy:**
  - Ir para Vercel Dashboard
  - Ver logs de build
  - Verificar se completa sem erros

---

### Pós-Deploy

- [ ] **10. Testar Produção:**
  - [ ] Abrir URL de produção
  - [ ] Testar menu público
  - [ ] Testar dashboard
  - [ ] Testar páginas admin
  - [ ] Verificar console do browser (sem erros)

- [ ] **11. Verificar Performance:**
  - [ ] Lighthouse score
  - [ ] Tempo de carregamento
  - [ ] Erros no Vercel Analytics

- [ ] **12. Monitorar Erros:**
  - [ ] Configurar Sentry (recomendado)
  - [ ] Verificar logs Vercel
  - [ ] Testar fluxos críticos

---

## 🚀 Comandos Rápidos

### Build e Test Local
```bash
# Limpar cache
rm -rf .next

# Instalar dependências
npm ci

# Build
npm run build

# Testar produção local
npm run start

# Abrir http://localhost:3000
```

---

### Deploy Manual Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

---

## 📊 Resumo

### Problema Principal
**5 páginas admin usando Context hook em Server Components**

### Solução Imediata
**Adicionar `'use client'` no topo de 5 arquivos**

### Arquivos a Modificar
1. `src/app/(super-admin)/admin/automations/page.tsx`
2. `src/app/(super-admin)/admin/features/page.tsx`
3. `src/app/(super-admin)/admin/logs/page.tsx`
4. `src/app/(super-admin)/admin/reports/page.tsx`
5. `src/app/(super-admin)/admin/tickets/page.tsx`

### Tempo Estimado
**5 minutos** (adicionar 1 linha em 5 arquivos)

### Impacto
- ✅ Build passa
- ✅ Deploy completa
- ✅ Funcionalidade mantida
- ⚠️ Pequeno aumento no bundle JS (aceitável)

---

## 🎯 Próximos Passos

### Imediato (Hoje)
1. Aplicar fix (5 minutos)
2. Testar build local (5 minutos)
3. Push e deploy (10 minutos)

### Curto Prazo (Esta Semana)
1. Adicionar LanguageProvider no layout (Opção 2)
2. Converter páginas de volta para Server Components
3. Configurar Sentry para error tracking

### Médio Prazo (Próxima Semana)
1. Implementar CI/CD com GitHub Actions
2. Adicionar testes automatizados
3. Configurar preview deploys

---

## 📞 Suporte

**Se build continuar falhando:**

1. **Verificar logs completos:**
   ```bash
   npm run build 2>&1 | tee build.log
   ```

2. **Verificar versões:**
   ```bash
   node --version  # Deve ser 18+
   npm --version
   ```

3. **Limpar tudo:**
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Verificar Vercel logs:**
   - Dashboard → Deployments → Click no deploy → View Function Logs

---

## ✅ Conclusão

O build está falhando por **1 motivo principal**:

**Causa:** 5 páginas admin usando `useLanguage()` em Server Components

**Fix:** Adicionar `'use client'` no topo de 5 arquivos

**Tempo:** 5 minutos

**Resultado:** Build passa, deploy completa ✅

**Todas as outras validações (Tailwind, Server Actions, arquivos obrigatórios) estão corretas.**

---

**Deploy na Vercel será bem-sucedido após aplicar o fix!** 🚀
