# 📱 Guia dos Módulos do Sistema

## 🌐 URLs de Acesso

### Produção (Vercel)
- **Página Inicial:** https://food-management-system-eight.vercel.app/
- **Cardápio Digital:** https://food-management-system-eight.vercel.app/acai-sabor-real
- **PDV:** https://food-management-system-eight.vercel.app/pos
- **Cozinha/KDS:** https://food-management-system-eight.vercel.app/kitchen
- **Delivery:** https://food-management-system-eight.vercel.app/delivery
- **Dashboard Admin:** https://food-management-system-eight.vercel.app/admin

---

## 📋 Descrição dos Módulos

### 1. 🏠 Página Inicial
**Cor:** Verde
**Funcionalidade:** Landing page com apresentação de todos os módulos do sistema

**Características:**
- Design moderno com gradiente verde
- Cards clicáveis para cada módulo
- Ícones representativos
- Layout responsivo
- Descrição de cada funcionalidade

---

### 2. 🍽️ Cardápio Digital (Menu)
**Cor:** Verde
**Funcionalidade:** Cardápio digital para clientes fazerem pedidos

**Características:**
- Navegação por categorias (Açaí, Adicionais, Bebidas)
- Cards de produtos com imagem, nome, descrição e preço
- Modal de produto com:
  - Seleção de modificadores
  - Controle de quantidade
  - Campo de observações
  - Cálculo automático do total
- Carrinho de compras:
  - Visualização de itens
  - Ajuste de quantidades
  - Remoção de itens
  - Cálculo de subtotal e total
- Checkout:
  - Dados do cliente
  - Tipo de pedido (Delivery/Retirada)
  - Endereço de entrega
  - Forma de pagamento
- Página de acompanhamento do pedido
- Integração completa com Supabase

**Dados no Banco:**
- 1 Loja: Açaí Sabor Real
- 3 Categorias
- 6+ Produtos

---

### 3. 💰 PDV (Point of Sale)
**Cor:** Azul
**Funcionalidade:** Sistema de vendas para atendimento presencial

**Características:**
- Busca rápida de produtos
- Grid de produtos clicáveis
- Carrinho lateral com:
  - Visualização de itens
  - Controle de quantidade
  - Remoção de itens
  - Cálculo de total
- Seleção de forma de pagamento:
  - 💵 Dinheiro
  - 💳 Cartão
  - 📱 PIX
- Botão de finalizar venda
- Interface otimizada para velocidade

**Produtos de Exemplo:**
- Açaí 300ml, 500ml, 700ml
- Sucos naturais
- Água mineral

---

### 4. 👨‍🍳 Cozinha / KDS (Kitchen Display System)
**Cor:** Laranja
**Funcionalidade:** Display de pedidos para a cozinha

**Características:**
- 3 colunas de status:
  - 🔴 **Pendentes:** Pedidos aguardando preparo
  - 🟡 **Em Preparo:** Pedidos sendo preparados
  - 🟢 **Prontos:** Pedidos finalizados
- Cards de pedidos com:
  - Código do pedido
  - Tempo decorrido
  - Canal (Delivery/Retirada/Mesa)
  - Lista de itens com quantidades
  - Observações dos itens
- Botões de ação para mudar status:
  - "Iniciar Preparo"
  - "Marcar como Pronto"
  - "Finalizar Pedido"
- Atualização em tempo real (preparado para Supabase Realtime)

**Pedidos de Exemplo:**
- A001, A002, A003 com diferentes status

---

### 5. 🚚 Delivery
**Cor:** Roxo
**Funcionalidade:** Gestão de entregas e entregadores

**Características:**
- 3 colunas de status:
  - 🟡 **Aguardando:** Pedidos sem entregador
  - 🔵 **Atribuídos:** Pedidos com entregador designado
  - 🟢 **Em Trânsito:** Pedidos saindo para entrega
- Cards de entrega com:
  - Código do pedido
  - Nome do cliente
  - Endereço completo
  - Telefone
  - Valor total
  - Tempo decorrido
  - Nome do entregador (quando atribuído)
- Funcionalidades:
  - Atribuir entregador (lista de entregadores disponíveis)
  - Marcar como "Saiu para Entrega"
  - Confirmar entrega
- Ícones de localização e telefone

**Entregadores de Exemplo:**
- Carlos Entregador
- Ana Delivery
- José Motoboy

---

### 6. 📊 Dashboard Admin
**Cor:** Vermelho
**Funcionalidade:** Painel administrativo com métricas e gestão

**Características:**
- **Cards de Estatísticas:**
  - 💰 Vendas Hoje
  - 🛍️ Pedidos Hoje
  - 👥 Clientes
  - 📦 Produtos
  - Cada card com ícone e indicador de tendência
  
- **Pedidos Recentes:**
  - Lista dos últimos pedidos
  - Status colorido (Entregue, Em preparo, Pendente, etc.)
  - Nome do cliente
  - Valor total
  - Tempo decorrido
  
- **Produtos Mais Vendidos:**
  - Top 5 produtos
  - Quantidade de vendas
  - Receita total
  - Barra de progresso visual
  
- **Ações Rápidas:**
  - 📦 Adicionar Produto
  - 👥 Gerenciar Usuários
  - 📊 Relatórios
  - 💰 Financeiro

---

## 🎨 Design System

### Cores por Módulo
- 🟢 **Menu:** Verde (#10b981)
- 🔵 **PDV:** Azul (#3b82f6)
- 🟠 **Cozinha:** Laranja (#f97316)
- 🟣 **Delivery:** Roxo (#a855f7)
- 🔴 **Admin:** Vermelho (#ef4444)

### Componentes Comuns
- Headers com gradientes
- Cards com `rounded-2xl` e sombras
- Botões com hover effects
- Ícones do Lucide React
- Animações suaves (`transition-all`)
- Layout responsivo (mobile-first)

### Tipografia
- Títulos: `font-bold` com tamanhos variados
- Textos: `font-semibold` ou `font-medium`
- Cores: `text-gray-900` para títulos, `text-gray-600` para textos

---

## 🔧 Tecnologias Utilizadas

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui**
- **Lucide React** (ícones)

### Backend
- **Supabase** (PostgreSQL)
- **Supabase Auth** (preparado)
- **Supabase Realtime** (preparado)
- **Supabase Storage** (preparado)

### State Management
- **Zustand** (carrinho de compras)
- **React Query** (preparado para cache)

### Deploy
- **Vercel** (frontend)
- **Supabase Cloud** (backend)

---

## 📝 Próximas Implementações

### Curto Prazo
- [ ] Adicionar mais produtos ao banco
- [ ] Implementar modificadores (complementos)
- [ ] Conectar PDV ao Supabase
- [ ] Conectar Cozinha ao Supabase com Realtime
- [ ] Conectar Delivery ao Supabase

### Médio Prazo
- [ ] Sistema de autenticação
- [ ] Permissões por módulo
- [ ] Relatórios reais no Admin
- [ ] Gestão de estoque
- [ ] Impressão de pedidos

### Longo Prazo
- [ ] App mobile (React Native)
- [ ] Notificações push
- [ ] Integração com WhatsApp
- [ ] Sistema de fidelidade
- [ ] Multi-loja completo

---

## 🚀 Como Usar

### Para Clientes (Cardápio Digital)
1. Acesse o link do cardápio
2. Navegue pelas categorias
3. Clique em um produto
4. Selecione modificadores (se houver)
5. Adicione ao carrinho
6. Finalize o pedido no checkout

### Para Atendentes (PDV)
1. Acesse `/pos`
2. Busque ou clique nos produtos
3. Ajuste quantidades no carrinho
4. Selecione forma de pagamento
5. Finalize a venda

### Para Cozinha (KDS)
1. Acesse `/kitchen`
2. Veja pedidos pendentes na coluna vermelha
3. Clique em "Iniciar Preparo"
4. Quando pronto, clique em "Marcar como Pronto"
5. Finalize o pedido após entrega

### Para Entregadores (Delivery)
1. Acesse `/delivery`
2. Veja pedidos aguardando na coluna amarela
3. Atribua um entregador
4. Marque como "Saiu para Entrega"
5. Confirme a entrega ao finalizar

### Para Gestores (Admin)
1. Acesse `/admin`
2. Visualize métricas em tempo real
3. Acompanhe pedidos recentes
4. Analise produtos mais vendidos
5. Use ações rápidas para gestão

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa no `README.md` principal.

**Sistema desenvolvido com ❤️ para negócios de alimentação**
