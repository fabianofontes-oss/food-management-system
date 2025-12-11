# 🚀 Setup do Módulo de Cardápio Digital

## ✅ Status da Implementação

O fluxo completo do **Cardápio Digital** está implementado e pronto para uso:

### Funcionalidades Implementadas

1. **Página de Cardápio (`/[slug]`)**
   - ✅ Carrega loja pelo slug do Supabase
   - ✅ Exibe categorias e produtos reais do banco
   - ✅ Filtro por categoria
   - ✅ Interface responsiva

2. **Modal de Produto**
   - ✅ Busca modificadores do Supabase
   - ✅ Respeita `min_quantity`, `max_quantity` e `required`
   - ✅ Validação de seleção obrigatória
   - ✅ Cálculo de preço com modificadores

3. **Carrinho (`/[slug]/cart`)**
   - ✅ Store Zustand com persistência
   - ✅ Cálculo de totais em tempo real
   - ✅ Gerenciamento de quantidade
   - ✅ Remoção de itens

4. **Checkout (`/[slug]/checkout`)**
   - ✅ Formulário completo de dados
   - ✅ Suporte para Delivery e Retirada
   - ✅ Criação de customer (ou busca por telefone)
   - ✅ Salvamento de pedido no Supabase:
     - `orders`
     - `order_items`
     - `order_item_modifiers`
     - `order_events`
     - `customer_addresses` (se delivery)

5. **Acompanhamento de Pedido (`/[slug]/order/[orderId]`)**
   - ✅ Exibição de status do pedido
   - ✅ Timeline de eventos
   - ✅ Realtime com Supabase (preparado)
   - ✅ Detalhes completos do pedido

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Conta no Supabase** criada
3. **Projeto Supabase** configurado

## 🔧 Configuração

### 1. Instalar Dependências

```bash
cd C:\Users\User\CascadeProjects\food-management-system
npm install
```

### 2. Configurar Supabase

#### 2.1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **URL** e **anon key**

#### 2.2. Executar Schema SQL
No painel do Supabase, vá em **SQL Editor** e execute:

```bash
supabase/schema.sql
```

Este arquivo cria todas as tabelas necessárias.

#### 2.3. Executar Seed (Dados de Exemplo)
Opcional - para testar com dados de exemplo:

```bash
supabase/seed.sql
```

#### 2.4. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Executar o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🧪 Testando o Fluxo Completo

### Passo 1: Criar Dados de Teste no Supabase

Execute o seed.sql ou crie manualmente:

1. **Tenant** (rede/franquia)
2. **Store** com um `slug` (ex: "acai-sabor-real")
3. **Categories** (ex: "Açaís", "Adicionais")
4. **Products** vinculados às categorias
5. **Modifier Groups** (ex: "Frutas", "Proteínas")
6. **Modifier Options** (ex: "Banana", "Morango", "Whey")
7. **Product Modifier Groups** (vincular produtos aos grupos)

### Passo 2: Acessar o Cardápio

```
http://localhost:3000/[seu-slug]
```

Exemplo: `http://localhost:3000/acai-sabor-real`

### Passo 3: Fazer um Pedido

1. Clique em um produto
2. Selecione modificadores (se houver)
3. Adicione ao carrinho
4. Vá para o carrinho
5. Finalize o pedido
6. Preencha os dados
7. Confirme

### Passo 4: Verificar no Supabase

Após o pedido, verifique as tabelas:
- `customers` - cliente criado
- `orders` - pedido criado
- `order_items` - itens do pedido
- `order_item_modifiers` - modificadores selecionados
- `order_events` - evento "CREATED"

### Passo 5: Acompanhar o Pedido

Após o checkout, você será redirecionado para:
```
http://localhost:3000/[slug]/order/[orderId]
```

Esta página mostra o status em tempo real.

## 🔍 Estrutura de Dados

### Fluxo de Dados

```
Store (slug) 
  → Categories 
    → Products 
      → Product Modifier Groups 
        → Modifier Groups 
          → Modifier Options
```

### Pedido

```
Customer (phone único por loja)
  → Order
    → Order Items
      → Order Item Modifiers
    → Order Events
    → Customer Address (se delivery)
```

## 🎯 Próximos Passos

Com o Cardápio Digital funcionando, você pode:

1. **Implementar Autenticação**
   - Login para equipe
   - Proteção de rotas administrativas

2. **Módulo PDV (Point of Sale)**
   - Interface para atendentes
   - Criação rápida de pedidos

3. **Módulo Cozinha/KDS**
   - Display de pedidos em tempo real
   - Workflow de preparação

4. **Dashboard Admin**
   - Relatórios de vendas
   - Gestão de produtos e estoque

## 🐛 Troubleshooting

### Erro: "Loja não encontrada"
- Verifique se o slug existe na tabela `stores`
- Verifique se `is_active = true`

### Erro ao criar pedido
- Verifique as permissões RLS no Supabase
- Por enquanto, desabilite RLS para testar (não recomendado em produção)

### Produtos não aparecem
- Verifique se `is_active = true` em products
- Verifique se os produtos têm `category_id` válido

### Modificadores não aparecem
- Verifique a tabela `product_modifier_groups`
- Verifique se `is_active = true` em modifier_options

## 📚 Documentação Adicional

- [README.md](./README.md) - Documentação completa do projeto
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)

## 🎉 Pronto!

O módulo de Cardápio Digital está completo e funcional. Todos os dados são carregados do Supabase, sem mocks, e o fluxo completo de pedido está implementado.
