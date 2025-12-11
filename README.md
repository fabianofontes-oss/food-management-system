# 🍔 Food Management System

Sistema completo de gestão de pedidos multi-loja e multi-nicho para negócios de alimentação.

## 📋 Sobre o Projeto

Sistema desenvolvido com **Next.js 14 (App Router)** e **Supabase** para gestão completa de pedidos em negócios de alimentação. Suporta múltiplos nichos (açaí, burger, hotdog, marmita, açougue, sorvete, etc.) com arquitetura multi-tenant.

### ✨ Funcionalidades Principais

- **🍽️ Cardápio Digital**: QR code por mesa, categorias personalizadas, modificadores flexíveis
- **💰 PDV (Point of Sale)**: Interface rápida, múltiplos métodos de pagamento, controle de caixa
- **👨‍🍳 Cozinha/KDS**: Display de pedidos em tempo real, workflow de preparação
- **🚚 Delivery**: Gestão de entregas, atribuição de entregadores, rastreamento
- **📊 Dashboard Admin**: Relatórios, analytics, gestão de estoque
- **🏪 Multi-Tenant**: Suporte para múltiplas lojas e redes com isolamento de dados
- **💬 Comunicação Interna**: Sistema de mensagens entre equipe
- **🎫 Cupons e Promoções**: Sistema de descontos e campanhas
- **📦 Controle de Estoque**: Gestão de inventário e ingredientes
- **🖨️ Impressoras**: Integração com impressoras térmicas

### 🎯 Nichos Suportados

- Açaíteria
- Hamburgueria
- Hotdog
- Marmitaria
- Açougue
- Sorveteria
- Outros nichos personalizados

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management**: Zustand, React Query
- **Icons**: Lucide React

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone e Instale Dependências

```bash
cd C:\Users\User\CascadeProjects\food-management-system
npm install
```

### 2. Configure o Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Copie a URL do projeto e a chave anônima (anon key)
3. Crie o arquivo `.env.local`:

```bash
cp .env.example .env.local
```

4. Edite `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Execute as Migrations do Banco de Dados

No painel do Supabase, vá em **SQL Editor** e execute os seguintes scripts na ordem:

1. **Schema Principal**: `supabase/schema.sql`
2. **Dados de Exemplo** (opcional): `supabase/seed.sql`

### 4. Configure Row Level Security (RLS)

No Supabase, habilite RLS para todas as tabelas e crie policies básicas:

```sql
-- Exemplo de policy para a tabela orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders from their stores"
ON orders FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert orders in their stores"
ON orders FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

-- Repita para todas as tabelas conforme necessário
```

### 5. Execute o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
food-management-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Página inicial
│   │   ├── layout.tsx         # Layout principal
│   │   └── globals.css        # Estilos globais
│   ├── components/
│   │   └── ui/                # Componentes UI (shadcn/ui)
│   ├── lib/
│   │   ├── supabase/          # Configuração Supabase
│   │   │   ├── client.ts      # Cliente browser
│   │   │   ├── server.ts      # Cliente server
│   │   │   └── middleware.ts  # Middleware
│   │   └── utils.ts           # Utilitários
│   ├── types/
│   │   └── database.ts        # Tipos TypeScript do banco
│   └── middleware.ts          # Middleware Next.js
├── supabase/
│   ├── schema.sql             # Schema completo do banco
│   └── seed.sql               # Dados de exemplo
├── public/                    # Arquivos estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🗄️ Arquitetura do Banco de Dados

### Hierarquia Multi-Tenant

```
Tenants (Redes/Franquias)
  └── Stores (Lojas)
      ├── Users (Equipe)
      ├── Categories (Categorias)
      ├── Products (Produtos)
      ├── Orders (Pedidos)
      ├── Customers (Clientes)
      ├── Tables (Mesas)
      └── ...
```

### Principais Tabelas

- **tenants**: Redes ou franquias
- **stores**: Lojas individuais
- **users**: Usuários do sistema (equipe)
- **store_users**: Associação usuário-loja com papéis
- **categories**: Categorias de produtos
- **products**: Produtos do cardápio
- **modifier_groups**: Grupos de modificadores (ex: Frutas, Proteína)
- **modifier_options**: Opções de modificadores (ex: Banana, Morango)
- **orders**: Pedidos
- **order_items**: Itens do pedido
- **order_events**: Timeline de eventos do pedido
- **customers**: Clientes finais
- **customer_addresses**: Endereços de entrega
- **tables**: Mesas para dine-in
- **deliveries**: Informações de entrega
- **coupons**: Cupons de desconto
- **inventory_items**: Itens de estoque
- **cash_registers**: Controle de caixa
- **notifications**: Sistema de notificações
- **internal_messages**: Comunicação interna

## 🚀 Próximos Passos

### Módulos a Implementar

1. **Cardápio Digital**
   - [ ] Página pública do cardápio por slug
   - [ ] QR code por mesa
   - [ ] Carrinho de compras
   - [ ] Checkout

2. **PDV (Point of Sale)**
   - [ ] Interface de pedidos rápida
   - [ ] Seleção de produtos e modificadores
   - [ ] Cálculo de totais
   - [ ] Processamento de pagamento
   - [ ] Impressão de recibos

3. **Cozinha/KDS**
   - [ ] Display de pedidos em tempo real
   - [ ] Workflow de status (Pendente → Preparando → Pronto)
   - [ ] Filtros por estação
   - [ ] Timer de preparação

4. **Delivery**
   - [ ] Painel de entregas
   - [ ] Atribuição de entregadores
   - [ ] Rastreamento de status
   - [ ] Cálculo de rotas

5. **Dashboard Admin**
   - [ ] Visão geral de vendas
   - [ ] Relatórios e gráficos
   - [ ] Gestão de produtos
   - [ ] Gestão de estoque
   - [ ] Configurações da loja
   - [ ] Gestão de usuários

6. **Autenticação**
   - [ ] Login/Logout
   - [ ] Registro de usuários
   - [ ] Recuperação de senha
   - [ ] Proteção de rotas

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth
- Isolamento de dados por tenant/store
- Validação de permissões por papel (role)

## 📝 Configurações por Nicho

Cada loja pode ter configurações específicas no campo `settings` (JSONB):

```json
{
  "opening_hours": {
    "mon": "10:00-22:00",
    "tue": "10:00-22:00"
  },
  "delivery": {
    "enabled": true,
    "min_order": 15.00,
    "radius_km": 5,
    "fee": 5.00
  },
  "takeaway_discount": 0.10,
  "auto_accept_orders": false
}
```

## 🤝 Contribuindo

Este é um projeto em desenvolvimento. Sugestões e melhorias são bem-vindas!

## 📄 Licença

Projeto proprietário - Todos os direitos reservados

## 📞 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ usando Next.js 14 e Supabase**
