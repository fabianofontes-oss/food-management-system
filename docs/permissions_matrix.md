# Matriz de Permissões - Food Management System

## Roles Disponíveis

| Role | Descrição | Escopo |
|------|-----------|--------|
| `SUPER_ADMIN` | Administrador do sistema | Global (todos os tenants) |
| `OWNER` | Dono da loja | Tenant + Lojas próprias |
| `MANAGER` | Gerente | Loja específica |
| `CASHIER` | Caixa/Atendente | Loja específica |
| `KITCHEN` | Cozinha | Loja específica |
| `DELIVERY` | Entregador | Loja específica |

---

## Matriz de Permissões por Recurso

### Dashboard

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver métricas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Exportar dados | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Pedidos

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver pedidos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| Criar pedido (balcão) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Atualizar status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| Cancelar pedido | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar pedido | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reimprimir | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

> *DELIVERY: apenas pedidos atribuídos a ele

### Cardápio

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver cardápio | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Criar categoria | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar categoria | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar produto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar produto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ativar/Desativar | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gerenciar estoque | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Configurações da Loja

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver configurações | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar dados básicos | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar horários | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar delivery | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editar pagamentos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar tema | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Equipe

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver equipe | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Adicionar membro | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remover membro | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Alterar role | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Financeiro

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver caixa | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Abrir/Fechar caixa | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sangria/Suprimento | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver relatório fin. | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Super Admin (Área Restrita)

| Recurso | SUPER_ADMIN | OWNER | MANAGER | CASHIER | KITCHEN | DELIVERY |
|---------|:-----------:|:-----:|:-------:|:-------:|:-------:|:--------:|
| Ver todos tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Desativar tenant | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver todas lojas | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Acessar qualquer loja | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Rotas Protegidas

### Dashboard (`/[slug]/dashboard/*`)

```typescript
// Acesso: OWNER, MANAGER, CASHIER
const DASHBOARD_ROLES = ['OWNER', 'MANAGER', 'CASHIER']
```

### KDS (`/[slug]/kds`)

```typescript
// Acesso: OWNER, MANAGER, KITCHEN
const KDS_ROLES = ['OWNER', 'MANAGER', 'KITCHEN']
```

### Configurações (`/[slug]/dashboard/settings/*`)

```typescript
// Acesso: OWNER, MANAGER
const SETTINGS_ROLES = ['OWNER', 'MANAGER']
```

### Equipe (`/[slug]/dashboard/team`)

```typescript
// Acesso: OWNER apenas
const TEAM_ROLES = ['OWNER']
```

### Super Admin (`/admin/*`)

```typescript
// Acesso: SUPER_ADMIN apenas
const ADMIN_ROLES = ['SUPER_ADMIN']
```

---

## Implementação no Middleware

```typescript
// middleware.ts
const rolePermissions: Record<string, string[]> = {
  '/dashboard': ['OWNER', 'MANAGER', 'CASHIER'],
  '/dashboard/settings': ['OWNER', 'MANAGER'],
  '/dashboard/team': ['OWNER'],
  '/dashboard/reports': ['OWNER', 'MANAGER'],
  '/kds': ['OWNER', 'MANAGER', 'KITCHEN'],
  '/garcom': ['OWNER', 'MANAGER', 'CASHIER'],
  '/motorista': ['OWNER', 'MANAGER', 'DELIVERY'],
  '/admin': ['SUPER_ADMIN'],
}
```

---

## Verificação em Server Actions

```typescript
// Exemplo de verificação
async function updateProduct(productId: string, data: ProductData) {
  const user = await getUser()
  const role = await getUserRole(user.id, storeId)
  
  if (!['OWNER', 'MANAGER'].includes(role)) {
    return { error: 'Permissão negada', code: 403 }
  }
  
  // ... continuar com a atualização
}
```

---

## Códigos de Erro

| Código | Mensagem | Quando |
|--------|----------|--------|
| 401 | Não autenticado | Usuário não logado |
| 403 | Permissão negada | Role insuficiente |
| 404 | Não encontrado | Recurso não existe ou não pertence à loja |

---

## Auditoria de Rotas

| Rota | Roles Permitidas | Verificação |
|------|------------------|-------------|
| `/[slug]/dashboard` | OWNER, MANAGER, CASHIER | ✅ middleware |
| `/[slug]/dashboard/settings` | OWNER, MANAGER | ✅ middleware |
| `/[slug]/dashboard/team` | OWNER | ✅ middleware |
| `/[slug]/kds` | OWNER, MANAGER, KITCHEN | ✅ middleware |
| `/[slug]/garcom` | OWNER, MANAGER, CASHIER | ✅ middleware |
| `/[slug]/motorista` | OWNER, MANAGER, DELIVERY | ✅ middleware |
| `/admin/*` | SUPER_ADMIN | ✅ middleware |
