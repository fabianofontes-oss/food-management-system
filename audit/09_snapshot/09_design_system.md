# DESIGN SYSTEM - SNAPSHOT
**Gerado em:** 2024-12-19 23:50

---

## 1. FRAMEWORK UI

| Item | Valor |
|------|-------|
| **Framework CSS** | TailwindCSS v3.x |
| **Componentes** | shadcn/ui (Radix primitives) |
| **Ícones** | Lucide React |
| **Dark Mode** | Suportado via class strategy |
| **Animações** | tailwindcss-animate |

---

## 2. COMPONENTES UI (shadcn/ui)

### Instalados em `src/components/ui/`
| Componente | Arquivo | Uso Principal |
|------------|---------|---------------|
| Badge | badge.tsx | Status tags |
| Button | button.tsx | CTAs, ações |
| Card | card.tsx | Containers de conteúdo |
| Checkbox | checkbox.tsx | Forms |
| Collapsible | collapsible.tsx | Sidebar sections |
| Dialog | dialog.tsx | Modals |
| Form | form.tsx | React Hook Form wrapper |
| Input | input.tsx | Text inputs |
| Label | label.tsx | Form labels |
| Loading | loading.tsx | Spinners |
| ScrollArea | scroll-area.tsx | Custom scrollbars |
| Select | select.tsx | Dropdowns |
| Sheet | sheet.tsx | Mobile sidebars |
| Skeleton | skeleton.tsx | Loading states |
| Switch | switch.tsx | Toggles |
| Tabs | tabs.tsx | Tab navigation |
| Textarea | textarea.tsx | Multi-line inputs |

### Faltando (comuns)
- Toast/Sonner
- Dropdown Menu
- Popover
- Avatar
- Table
- Pagination
- Breadcrumb
- Alert

---

## 3. TOKENS DE DESIGN

### Cores (CSS Variables em globals.css)
```css
--background: /* hsl value */
--foreground: /* hsl value */
--primary: /* hsl value */
--primary-foreground: /* hsl value */
--secondary: /* hsl value */
--secondary-foreground: /* hsl value */
--muted: /* hsl value */
--muted-foreground: /* hsl value */
--accent: /* hsl value */
--accent-foreground: /* hsl value */
--destructive: /* hsl value */
--destructive-foreground: /* hsl value */
--border: /* hsl value */
--input: /* hsl value */
--ring: /* hsl value */
--card: /* hsl value */
--card-foreground: /* hsl value */
--popover: /* hsl value */
--popover-foreground: /* hsl value */
```

### Border Radius
```css
--radius: /* base radius value */
lg: var(--radius)
md: calc(var(--radius) - 2px)
sm: calc(var(--radius) - 4px)
```

### Container
```css
max-width: 1400px (2xl)
padding: 2rem
center: true
```

---

## 4. PADRÕES DE LAYOUT

### SuperAdmin
- **Fundo:** gray-900 (dark)
- **Sidebar:** gray-800, 64px collapsed / 256px expanded
- **Active Item:** blue-600
- **Text:** gray-300 → white on hover
- **Mobile:** Sheet overlay

### Merchant Dashboard
- **Fundo:** slate-50 (light)
- **Sidebar:** white com sombra
- **Active Item:** gradient com cor do módulo
- **Sections:** collapsible com Chevron
- **Mobile:** Sheet com overlay

### Driver Dashboard
- **Header:** gradient violet-600 → indigo-600
- **Body:** slate-50
- **Tabs:** sticky, border-b
- **Cards:** white, rounded-lg, shadow-sm

### Menu Público
- **Fundo:** white ou theme-based
- **Header:** store branding
- **Cards:** produto com imagem, preço, add button
- **Mobile-first:** sempre

---

## 5. COMPONENTES CUSTOMIZADOS

### Layout
| Componente | Path | Descrição |
|------------|------|-----------|
| AppShell | src/components/layout/AppShell.tsx | Shell padrão merchant |
| Sidebar | src/components/layout/Sidebar.tsx | Sidebar genérica |
| PageContainer | (inline) | Wrapper de conteúdo |

### System
| Componente | Path | Descrição |
|------------|------|-----------|
| NetworkStatus | src/components/system/network-status.tsx | Banner de conexão |

### Dashboard
- Stats Cards (inline em cada página)
- Data Tables (inline, não padronizado)
- Empty States (inline, não padronizado)

---

## 6. PADRÕES DE PÁGINA

### Header de Página (Merchant)
```tsx
<div className="mb-6">
  <h1 className="text-2xl font-bold text-gray-900">Título</h1>
  <p className="text-gray-500">Descrição</p>
</div>
```

### Grid de Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>...</Card>
</div>
```

### Table (não padronizado)
```tsx
<div className="bg-white rounded-lg shadow">
  <table className="w-full">...</table>
</div>
```

### Empty State (não padronizado)
```tsx
<div className="text-center py-12">
  <Icon className="mx-auto w-12 h-12 text-gray-400" />
  <h3>Nenhum item</h3>
  <Button>Criar primeiro</Button>
</div>
```

---

## 7. GRADIENTES PADRÃO (Merchant)

| Módulo | Gradient |
|--------|----------|
| Dashboard | from-violet-500 to-purple-600 |
| Pedidos | from-blue-500 to-cyan-600 |
| PDV | from-emerald-500 to-teal-600 |
| Cozinha | from-red-500 to-rose-600 |
| Produtos | from-orange-500 to-amber-600 |
| Financeiro | from-green-500 to-emerald-600 |
| Clientes | from-purple-500 to-violet-600 |
| Entregadores | from-indigo-500 to-blue-600 |

---

## 8. RESPONSIVIDADE

| Breakpoint | Valor | Uso |
|------------|-------|-----|
| sm | 640px | Mobile landscape |
| md | 768px | Tablets |
| lg | 1024px | Desktop small |
| xl | 1280px | Desktop |
| 2xl | 1400px | Wide screens |

### Mobile First
- Todas as páginas merchant: ✅
- Driver dashboard: ✅
- Menu público: ✅
- SuperAdmin: ⚠️ (desktop-focused, mas funcional)
