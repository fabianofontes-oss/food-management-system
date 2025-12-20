# UI GAPS & BACKLOG - SNAPSHOT
**Gerado em:** 2024-12-19 23:50

---

## 🔴 P0 - CRÍTICO (Bloqueia uso)

| # | Gap | Área | Descrição | Ação |
|---|-----|------|-----------|------|
| 1 | SuperAdmin não carrega dados | Admin | "Usuário não autenticado" em várias páginas | Debugar is_super_admin + sessão |
| 2 | 403 em stores de teste | Billing | Vínculo existe mas retorna 403 | Debugar middleware/RLS |

---

## 🟡 P1 - IMPORTANTE (Pré-release)

| # | Gap | Área | Descrição | Ação |
|---|-----|------|-----------|------|
| 3 | Driver stats simulados | Driver | totalDeliveries, pendingDeliveries são mock | Integrar com tabela real |
| 4 | Driver mapa não existe | Driver | Tab "mapa" não implementada | Criar página ou marcar P2 |
| 5 | Driver pagamentos não existe | Driver | Sem histórico de pagamentos | Criar página |
| 6 | Checkout incompleto | Menu Público | Checkout está dentro do cart, sem fluxo de pagamento | Separar e integrar gateway |
| 7 | Tables não padronizadas | Global | Cada página tem table inline diferente | Criar componente DataTable |
| 8 | Empty states não padronizados | Global | Cada página implementa diferente | Criar componente EmptyState |
| 9 | Toast/Notifications | Global | Não tem sistema de toast instalado | Instalar Sonner |

---

## 🟢 P2 - MELHORIAS (Nice to have)

| # | Gap | Área | Descrição | Ação |
|---|-----|------|-----------|------|
| 10 | Breadcrumbs inconsistentes | Global | Algumas páginas têm, outras não | Padronizar com componente |
| 11 | Loading states inconsistentes | Global | Alguns Skeleton, outros Loader2 | Padronizar |
| 12 | Avatar component | Global | Não instalado no shadcn | Instalar |
| 13 | Dropdown Menu | Global | Não instalado no shadcn | Instalar |
| 14 | Pagination | Global | Não instalado no shadcn | Instalar |
| 15 | SuperAdmin dark mas mobile funciona | Admin | Desktop-focused mas sidebar collapsa | OK por agora |
| 16 | Driver avaliações | Driver | Tab não existe | Criar se necessário |

---

## 📊 COMPONENTES FALTANDO (shadcn/ui)

| Componente | Prioridade | Uso |
|------------|------------|-----|
| Toast/Sonner | P1 | Feedback de ações |
| DataTable | P1 | Listagens padronizadas |
| Dropdown Menu | P2 | Ações contextuais |
| Popover | P2 | Tooltips ricos |
| Avatar | P2 | User/store avatars |
| Pagination | P2 | Navegação de listas |
| Breadcrumb | P2 | Navegação hierárquica |
| Alert | P2 | Mensagens de status |
| Command | P2 | Search palette |
| Calendar | P2 | Date pickers |

---

## 🎨 INCONSISTÊNCIAS DE DESIGN

### 1. Headers de Página
**Problema:** Cada página implementa header diferente  
**Solução:** Criar `<PageHeader title="" description="" actions={} />`

### 2. Cards de Stats
**Problema:** Estrutura varia entre páginas  
**Solução:** Criar `<StatCard icon={} value={} label={} trend={} />`

### 3. Modais de Confirmação
**Problema:** Alguns usam Dialog, outros confirm()  
**Solução:** Criar `<ConfirmDialog onConfirm={} />`

### 4. Forms
**Problema:** Alguns usam react-hook-form, outros controlled  
**Solução:** Padronizar com react-hook-form + zod

### 5. Cores de Status
**Problema:** badge colors inconsistentes (some green-500, others emerald-600)  
**Solução:** Criar palette de status colors

---

## 📱 MOBILE RESPONSIVENESS

| Área | Status | Notas |
|------|--------|-------|
| Menu Público | ✅ Excelente | Mobile-first |
| Merchant Dashboard | ✅ Bom | Sidebar vira Sheet |
| Driver Dashboard | ✅ Excelente | Mobile-first |
| SuperAdmin | ⚠️ Funcional | Desktop-focused, mas collapsa |
| Auth pages | ✅ Excelente | Mobile-first |

---

## 🔧 BACKLOG TÉCNICO

| # | Item | Prioridade | Esforço |
|---|------|------------|---------|
| 1 | Instalar Sonner (toast) | P1 | S |
| 2 | Criar DataTable component | P1 | M |
| 3 | Criar EmptyState component | P1 | S |
| 4 | Criar PageHeader component | P2 | S |
| 5 | Criar StatCard component | P2 | S |
| 6 | Criar ConfirmDialog component | P2 | S |
| 7 | Instalar componentes shadcn faltantes | P2 | S |
| 8 | Documentar design tokens | P2 | M |
| 9 | Criar Storybook (opcional) | P3 | L |

---

## 📋 RESUMO

| Categoria | P0 | P1 | P2 | Total |
|-----------|----|----|----|----|
| Bugs/Bloqueadores | 2 | 0 | 0 | 2 |
| Funcionalidades | 0 | 4 | 2 | 6 |
| Componentes | 0 | 3 | 6 | 9 |
| Design | 0 | 2 | 5 | 7 |
| **Total** | **2** | **9** | **13** | **24** |
