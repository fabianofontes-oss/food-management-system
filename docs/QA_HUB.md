# 🔍 QA Hub - Central de Verificação

**Rota:** `/qa`  
**Status:** ✅ Disponível apenas em desenvolvimento  
**Objetivo:** Página única para verificar e acessar rapidamente todas as rotas do sistema

---

## 📋 OVERVIEW

O QA Hub é uma ferramenta de desenvolvimento que centraliza:
- ✅ Acesso rápido a todas as rotas (público, lojista, super-admin, auth)
- ✅ Checagens automáticas de configuração e estado
- ✅ Verificação de store, tenant, pagamentos, checkout mode
- ✅ Validação de sessão e permissões do usuário

**Benefícios:**
- Não precisa ficar navegando manualmente entre rotas
- Detecta problemas de configuração rapidamente
- Copia todas as URLs de uma vez
- Abre múltiplas abas simultaneamente

---

## 🚀 COMO USAR

### **1. Acessar o QA Hub**

```
http://localhost:3000/qa
```

**Nota:** Apenas funciona em `NODE_ENV !== 'production'`

### **2. Configurar Store Slug**

1. Digite o slug da loja no campo "Store Slug"
2. Clique em "Verificar"
3. O slug é salvo automaticamente no localStorage

**Exemplo:** `minha-loja`

### **3. Visualizar Checagens**

Após clicar em "Verificar", você verá:

**✅ OK (Verde):** Tudo funcionando  
**⚠️ WARNING (Amarelo):** Atenção necessária  
**❌ FAIL (Vermelho):** Problema crítico

**Checagens disponíveis:**
- Store existe?
- Tenant i18n configurado?
- Checkout mode ativo
- Métodos de pagamento habilitados
- Usuário autenticado?
- Usuário tem acesso à store?

### **4. Abrir Rotas**

**Opção 1: Individual**
- Clique no botão de qualquer rota para abrir em nova aba

**Opção 2: Copiar todas**
- Clique em "Copiar todas as URLs"
- Cole em arquivo de texto ou planilha

**Opção 3: Abrir principais**
- Clique em "Abrir principais (4 abas)"
- Abre: Menu, Dashboard, Produtos, Pedidos

---

## 🗂️ ROTAS DISPONÍVEIS

### **🛒 Público (Cliente)**

| Rota | Descrição |
|------|-----------|
| `/{slug}` | Menu público |
| `/{slug}/cart` | Carrinho de compras |
| `/{slug}/checkout` | Página de checkout |
| `/{slug}/order/{orderId}` | Status do pedido (último pedido) |

### **🏪 Lojista (Dashboard)**

| Rota | Descrição |
|------|-----------|
| `/{slug}/dashboard` | Dashboard principal |
| `/{slug}/dashboard/products` | Gestão de produtos |
| `/{slug}/dashboard/orders` | Gestão de pedidos |
| `/{slug}/dashboard/kitchen` | Tela de cozinha |
| `/{slug}/dashboard/delivery` | Gestão de entregas |
| `/{slug}/dashboard/crm` | CRM de clientes |
| `/{slug}/dashboard/pos` | PDV (Point of Sale) |
| `/{slug}/dashboard/reports` | Relatórios |
| `/{slug}/dashboard/coupons` | Gestão de cupons |
| `/{slug}/dashboard/team` | Gestão de equipe |
| `/{slug}/dashboard/settings` | Configurações |

### **👑 Super Admin**

| Rota | Descrição |
|------|-----------|
| `/admin` | Admin home |
| `/admin/analytics` | Analytics global |

### **🔐 Autenticação**

| Rota | Descrição |
|------|-----------|
| `/login` | Login |
| `/signup` | Cadastro |
| `/select-store` | Seleção de loja |

---

## 🔒 SEGURANÇA

### **Proteção em Produção**

O QA Hub **NÃO está disponível em produção**:

```typescript
if (process.env.NODE_ENV === 'production') {
  notFound() // Retorna 404
}
```

### **Proteção Adicional (Opcional)**

Você pode restringir acesso por email:

**1. Adicionar variável de ambiente:**

```env
QA_EMAILS=dev1@example.com,dev2@example.com
```

**2. Descomentar código em `/qa/page.tsx`:**

```typescript
const qaEmails = process.env.QA_EMAILS?.split(',') || []
if (qaEmails.length > 0) {
  const session = await getUserSession()
  if (!session || !qaEmails.includes(session.user.email || '')) {
    notFound()
  }
}
```

---

## 🔧 IMPLEMENTAÇÃO

### **Arquivos Criados**

**1. `src/lib/qa/queries.ts`**
- Funções server-side para checagens
- `getStoreBySlug()` - Busca store por slug
- `getTenantById()` - Busca tenant
- `getLastOrderIdForStore()` - Último pedido da store
- `getUserSession()` - Sessão do usuário
- `userHasStoreAccess()` - Verifica permissão
- `checkStore()`, `checkTenant()`, etc - Checagens formatadas

**2. `src/app/qa/page.tsx`**
- Server Component
- Proteção de ambiente
- Renderiza QAHubClient

**3. `src/app/qa/QAHubClient.tsx`**
- Client Component
- UI completa com seções
- Gerenciamento de estado
- Funcionalidades de copiar/abrir

---

## 📊 CHECAGENS DETALHADAS

### **1. Store existe?**

**OK:** Store encontrada no banco  
**FAIL:** Store não existe ou slug incorreto

**Query:**
```sql
SELECT * FROM stores WHERE slug = 'slug-aqui'
```

### **2. Tenant i18n**

**OK:** Tenant configurado com country/language/currency/timezone  
**FAIL:** Tenant não encontrado

**Exibe:**
```
i18n: BR/pt-BR | BRL | America/Sao_Paulo
```

### **3. Checkout Mode**

**OK:** Mode configurado (ex: `delivery`, `pickup`, `both`)  
**WARNING:** Mode não definido

**Path:** `stores.settings.checkout.mode`

### **4. Pagamentos**

**OK:** Pelo menos 1 método habilitado  
**WARNING:** Nenhum método habilitado

**Métodos verificados:**
- PIX
- Cash (dinheiro)
- Card on delivery (cartão na entrega)

### **5. Usuário autenticado?**

**OK:** Sessão ativa com email  
**WARNING:** Não autenticado

**Supabase:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### **6. Acesso à store?**

**OK:** Usuário tem registro em `store_users`  
**FAIL:** Usuário não tem acesso  
**WARNING:** Não autenticado

**Query:**
```sql
SELECT * FROM store_users 
WHERE store_id = 'store-id' AND user_id = 'user-id'
```

---

## 💡 CASOS DE USO

### **Caso 1: Testar nova store**

1. Criar store no banco
2. Abrir `/qa`
3. Digitar slug da nova store
4. Verificar se todas as checagens passam
5. Abrir rotas principais para testar

### **Caso 2: Debug de checkout**

1. Abrir `/qa`
2. Verificar "Checkout Mode" e "Pagamentos"
3. Se WARNING, ir em Settings corrigir
4. Clicar em "Checkout" para testar

### **Caso 3: Verificar permissões**

1. Fazer login com usuário de teste
2. Abrir `/qa`
3. Verificar "Usuário autenticado?" e "Acesso à store?"
4. Se FAIL, adicionar usuário em `store_users`

### **Caso 4: Apresentação/Demo**

1. Abrir `/qa`
2. Clicar em "Copiar todas as URLs"
3. Enviar lista para cliente/time
4. Ou usar "Abrir principais" para demo rápida

---

## 🚧 LIMITAÇÕES

### **Não implementado:**

- ❌ Histórico de checagens
- ❌ Logs de erros detalhados
- ❌ Testes automatizados
- ❌ Comparação entre stores
- ❌ Export de relatório PDF

### **Futuras melhorias:**

- [ ] Adicionar mais checagens (produtos, categorias, etc)
- [ ] Salvar múltiplos slugs favoritos
- [ ] Modo "watch" para auto-refresh
- [ ] Integração com Playwright para testes E2E
- [ ] Dashboard de métricas de QA

---

## 🔍 TROUBLESHOOTING

### **Problema: Página não carrega**

**Causa:** Rodando em produção  
**Solução:** Usar apenas em desenvolvimento

### **Problema: Checagens sempre FAIL**

**Causa:** Store não existe ou slug incorreto  
**Solução:** Verificar slug no banco de dados

### **Problema: "Acesso à store?" sempre FAIL**

**Causa:** Usuário não tem registro em `store_users`  
**Solução:** Adicionar usuário via SQL ou dashboard de Team

### **Problema: Último pedido não aparece**

**Causa:** Store não tem pedidos ainda  
**Solução:** Criar pedido de teste via checkout

---

## 📝 EXEMPLOS

### **Exemplo 1: Store OK**

```
✅ Store existe? Store "Pizzaria do João" encontrada (ID: abc-123)
✅ Tenant i18n: i18n: BR/pt-BR | BRL | America/Sao_Paulo
✅ Checkout Mode: Checkout mode: delivery
✅ Pagamentos: Pagamentos: pix, cash
✅ Usuário autenticado? Autenticado: joao@example.com
✅ Acesso à store? Usuário tem acesso à store
```

### **Exemplo 2: Store com problemas**

```
✅ Store existe? Store "Loja Teste" encontrada (ID: xyz-789)
✅ Tenant i18n: i18n: BR/pt-BR | BRL | America/Sao_Paulo
⚠️ Checkout Mode: Settings não disponíveis
⚠️ Pagamentos: Nenhum método de pagamento habilitado
✅ Usuário autenticado? Autenticado: dev@example.com
❌ Acesso à store? Usuário não tem acesso a esta store
```

---

## 🎯 BOAS PRÁTICAS

### **Para Desenvolvedores:**

1. ✅ Sempre verificar QA Hub antes de commit
2. ✅ Usar para testar novas features
3. ✅ Compartilhar URLs com time via "Copiar todas"
4. ✅ Documentar novos checks necessários

### **Para QA/Testers:**

1. ✅ Usar como checklist inicial
2. ✅ Reportar bugs com screenshot das checagens
3. ✅ Testar em múltiplas stores
4. ✅ Validar permissões de diferentes roles

### **Para Product Managers:**

1. ✅ Usar para demos rápidas
2. ✅ Validar configurações de stores
3. ✅ Verificar features habilitadas

---

## 🔗 LINKS RELACIONADOS

- [Documentação de Stores](./STORES.md)
- [Documentação de Auth](./AUTH.md)
- [Documentação de Coupons](./COUPONS.md)
- [Documentação de Modifiers](./MODIFIERS.md)

---

**QA Hub está pronto para uso!** 🚀

Para sugestões de melhorias ou novos checks, abrir issue no repositório.
