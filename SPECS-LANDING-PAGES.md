# 📋 SPECS - Landing Pages para Stitch/V0

**Objetivo:** Criar landing pages específicas para cada público-alvo  
**Referência:** Layout já criado do motorista como base

---

## 🚗 1. LANDING PARA MOTORISTAS (`entregou.food`)

**Rota:** `src/app/para-motoristas/page.tsx`  
**URL Pública:** `entregou.food` ou `pediufood.com/para-motoristas`

### 🎨 Seções e Componentes

#### **HERO (Acima da dobra)**
```
- Background: Gradient azul/cyan com imagem de motoboy feliz
- Headline: "Ganhe Dinheiro Fazendo Entregas"
- Subheadline: "Seja seu próprio chefe. Escolha seus horários. Receba semanalmente."
- CTA Principal: Botão "Quero Ser Entregador" (verde, grande, destaque)
  → Link: /cadastro-motorista
- CTA Secundário: Link "Já sou cadastrado" (texto, discreto)
  → Link: /login
- Badge: "Ganhe até R$ 3.000/mês" (destaque amarelo)
```

#### **STATS (Logo abaixo do hero)**
```
3 cards lado a lado (mobile: stack):
1. "500+ Entregadores" - Ícone: Users
2. "R$ 2.5k média/mês" - Ícone: DollarSign
3. "4.8/5 Satisfação" - Ícone: Star
```

#### **COMO FUNCIONA (3 passos)**
```
Timeline horizontal (mobile: vertical):

PASSO 1: "Cadastre-se"
- Ícone: UserPlus
- Texto: "Preencha seus dados, envie documentos e foto"
- Tempo: "5 minutos"

PASSO 2: "Seja Aprovado"
- Ícone: CheckCircle
- Texto: "Análise em até 24h. Receba credenciais no WhatsApp"
- Tempo: "1 dia"

PASSO 3: "Comece a Entregar"
- Ícone: Truck
- Texto: "Aceite corridas, entregue e receba pagamentos"
- Tempo: "Imediato"
```

#### **BENEFÍCIOS (Grid 2x3)**
```
Card 1: "Flexibilidade Total"
- Ícone: Clock
- Texto: "Trabalhe quando quiser, onde quiser"

Card 2: "Pagamento Semanal"
- Ícone: Calendar
- Texto: "Receba toda sexta-feira via PIX"

Card 3: "Sem Taxa de Adesão"
- Ícone: Gift
- Texto: "Cadastro 100% gratuito, sem mensalidade"

Card 4: "Suporte 24/7"
- Ícone: Headphones
- Texto: "Equipe disponível via WhatsApp"

Card 5: "Bônus por Performance"
- Ícone: TrendingUp
- Texto: "Ganhe mais entregando com qualidade"

Card 6: "App Simples"
- Ícone: Smartphone
- Texto: "Interface intuitiva, sem complicação"
```

#### **REQUISITOS**
```
Seção com checklist:
Título: "Você Precisa de:"

✓ Moto ou bicicleta em bom estado
✓ CNH válida (categoria A para moto)
✓ Smartphone com GPS
✓ Bag térmica (fornecemos)
✓ Maior de 18 anos
✓ Disponibilidade mínima de 20h/semana
```

#### **GANHOS (Calculadora)**
```
Seção interativa:
Título: "Calcule Seus Ganhos"

Slider: "Quantas entregas por dia?"
- Min: 5, Max: 30, Default: 15

Resultado dinâmico:
- Por dia: R$ XXX
- Por semana: R$ XXX
- Por mês: R$ XXX

Nota: "Valores médios baseados em R$ 8-12 por entrega"
```

#### **FAQ MOTORISTAS**
```
Accordion com 6 perguntas:

1. "Como funciona o pagamento?"
   → "Pagamento semanal via PIX, toda sexta-feira..."

2. "Preciso ter moto própria?"
   → "Sim, você precisa de veículo próprio..."

3. "Posso trabalhar em outras plataformas?"
   → "Sim, você é autônomo..."

4. "Qual a comissão?"
   → "Você fica com 80% do valor da entrega..."

5. "Como recebo as corridas?"
   → "Pelo app, você aceita ou recusa..."

6. "Tem seguro?"
   → "Oferecemos parceria com seguro..."
```

#### **CTA FINAL**
```
Seção full-width com gradient:
- Headline: "Pronto para Começar?"
- Subheadline: "Cadastro rápido e aprovação em 24h"
- Botão: "Cadastrar Agora" (grande, verde)
  → Link: /cadastro-motorista
- Link: "Falar com recrutador no WhatsApp"
  → Link: https://wa.me/...
```

#### **FOOTER**
```
Simples:
- Logo Entregou
- Links: Termos | Privacidade | Suporte
- Redes sociais
- Copyright
```

---

## 🍽️ 2. LANDING PARA GARÇONS (`/para-garcons`)

**Rota:** `src/app/para-garcons/page.tsx`  
**URL Pública:** `pediufood.com/para-garcons`

### 🎨 Seções e Componentes

#### **HERO**
```
- Background: Gradient laranja/vermelho com imagem de garçom
- Headline: "Atenda Mais Mesas com Tecnologia"
- Subheadline: "App de comandas digital. Sem papel, sem erro, mais gorjetas."
- CTA Principal: "Experimentar Grátis" (laranja)
  → Link: /demo-garcom
- Badge: "Usado em 200+ restaurantes"
```

#### **STATS**
```
3 cards:
1. "3x Mais Rápido" - Ícone: Zap
2. "Zero Erros" - Ícone: CheckCircle
3. "+30% Gorjetas" - Ícone: TrendingUp
```

#### **COMO FUNCIONA**
```
PASSO 1: "Receba Login"
- Ícone: Key
- Texto: "Gerente cria sua conta no sistema"

PASSO 2: "Acesse pelo Celular"
- Ícone: Smartphone
- Texto: "Entre com seu usuário no app"

PASSO 3: "Comece a Atender"
- Ícone: Utensils
- Texto: "Anote pedidos, envie para cozinha, feche contas"
```

#### **FUNCIONALIDADES (Grid 2x2)**
```
Card 1: "Comanda Digital"
- Ícone: FileText
- Texto: "Anote pedidos direto no celular"
- Screenshot: Tela de comanda

Card 2: "Envio para Cozinha"
- Ícone: Send
- Texto: "Pedido vai direto para o KDS"
- Screenshot: Botão enviar

Card 3: "Split de Conta"
- Ícone: Users
- Texto: "Divida conta por pessoa ou item"
- Screenshot: Tela de split

Card 4: "Gorjeta Digital"
- Ícone: Heart
- Texto: "Cliente paga gorjeta via PIX"
- Screenshot: QR Code gorjeta
```

#### **BENEFÍCIOS**
```
Lista com ícones:
✓ Sem papel, sem caneta
✓ Pedidos nunca se perdem
✓ Cozinha recebe na hora
✓ Controle de mesas em tempo real
✓ Histórico de atendimentos
✓ Ranking de performance
```

#### **DEMO INTERATIVO**
```
Vídeo ou GIF mostrando:
1. Garçom abrindo comanda
2. Adicionando itens
3. Enviando para cozinha
4. Fechando conta

Botão: "Testar Agora" → /demo-garcom
```

#### **DEPOIMENTOS**
```
2 cards de garçons:

Depoimento 1:
- Foto: Avatar garçom
- Nome: "Carlos Silva"
- Local: "Restaurante Bella Vista"
- Quote: "Antes eu perdia 30min por noite só organizando comandas..."

Depoimento 2:
- Foto: Avatar garçonete
- Nome: "Ana Costa"
- Local: "Pizzaria Napoli"
- Quote: "Minhas gorjetas aumentaram 40% com o sistema..."
```

#### **CTA FINAL**
```
- Headline: "Seu Restaurante Usa o Pediu?"
- Subheadline: "Peça para o gerente cadastrar você no sistema"
- Botão 1: "Falar com Meu Gerente" (compartilhar via WhatsApp)
- Botão 2: "Testar Demo" → /demo-garcom
```

---

## 👤 3. LANDING PARA CLIENTES (`/para-clientes`)

**Rota:** `src/app/para-clientes/page.tsx`  
**URL Pública:** `pediufood.com/para-clientes`

### 🎨 Seções e Componentes

#### **HERO**
```
- Background: Gradient rosa/roxo com imagem de pessoa recebendo delivery
- Headline: "Peça Comida dos Melhores Restaurantes"
- Subheadline: "Cashback, fidelidade e rastreamento em tempo real"
- CTA Principal: "Explorar Restaurantes" (roxo)
  → Link: /marketplace
- CTA Secundário: "Criar Conta Grátis"
  → Link: /signup
```

#### **STATS**
```
3 cards:
1. "500+ Restaurantes" - Ícone: Store
2. "10k+ Pedidos/mês" - Ícone: ShoppingBag
3. "Entrega em 30min" - Ícone: Clock
```

#### **BENEFÍCIOS (Grid 2x3)**
```
Card 1: "Cashback em Pedidos"
- Ícone: Coins
- Texto: "Ganhe 5% de volta em créditos"

Card 2: "Programa de Fidelidade"
- Ícone: Gift
- Texto: "Acumule pontos e troque por prêmios"

Card 3: "Rastreamento ao Vivo"
- Ícone: MapPin
- Texto: "Veja onde está seu pedido em tempo real"

Card 4: "Cupons Exclusivos"
- Ícone: Ticket
- Texto: "Descontos especiais para membros"

Card 5: "Histórico de Pedidos"
- Ícone: History
- Texto: "Repita seus favoritos com 1 clique"

Card 6: "Suporte Rápido"
- Ícone: MessageCircle
- Texto: "Chat direto com o restaurante"
```

#### **COMO FUNCIONA**
```
PASSO 1: "Escolha o Restaurante"
- Ícone: Search
- Screenshot: Tela de busca/marketplace

PASSO 2: "Monte Seu Pedido"
- Ícone: ShoppingCart
- Screenshot: Carrinho

PASSO 3: "Acompanhe a Entrega"
- Ícone: Truck
- Screenshot: Rastreamento
```

#### **CATEGORIAS POPULARES**
```
Grid de botões (6 categorias):
- Pizza 🍕
- Burger 🍔
- Japonês 🍱
- Açaí 🍨
- Café ☕
- Fit 🥗

Cada botão leva para: /marketplace?categoria=X
```

#### **APP FEATURES**
```
Seção com 2 colunas:

Coluna 1: Mockup de celular com app
Coluna 2: Lista de features:
✓ Pedidos salvos (reordenar rápido)
✓ Endereços favoritos
✓ Formas de pagamento salvas
✓ Notificações de status
✓ Avaliações e reviews
✓ Suporte via chat
```

#### **RESTAURANTES EM DESTAQUE**
```
Carrossel horizontal com 6 cards:

Cada card:
- Foto do restaurante
- Nome
- Categoria
- Rating (estrelas)
- Tempo de entrega
- Badge: "Frete Grátis" ou "Novo"
- Botão: "Ver Cardápio"
```

#### **CTA FINAL**
```
- Headline: "Pronto para Pedir?"
- Subheadline: "Cadastro grátis, sem taxa de entrega na primeira compra"
- Botão: "Explorar Restaurantes" → /marketplace
- Texto pequeno: "Ou baixe o app" + badges iOS/Android
```

---

## 📱 4. PÁGINA DE CADASTRO MOTORISTA (`/cadastro-motorista`)

**Rota:** `src/app/cadastro-motorista/page.tsx`

### 🎨 Seções e Componentes

#### **HEADER**
```
- Logo Entregou
- Progress bar: "Passo 1 de 4"
- Link: "Voltar" (sair do cadastro)
```

#### **PASSO 1: DADOS PESSOAIS**
```
Form fields:
- Nome completo (input text, required)
- CPF (input mask, required)
- Data de nascimento (date picker, required)
- Telefone/WhatsApp (input mask, required)
- Email (input email, required)
- Foto (upload, required)
  → Preview da foto
  → Botão: "Tirar Foto" ou "Escolher da Galeria"

Botão: "Próximo" (disabled até preencher tudo)
```

#### **PASSO 2: ENDEREÇO**
```
Form fields:
- CEP (input mask, busca automática)
- Rua (auto-preenchido)
- Número (input)
- Complemento (input, opcional)
- Bairro (auto-preenchido)
- Cidade (auto-preenchido)
- Estado (auto-preenchido)

Botão: "Próximo"
```

#### **PASSO 3: VEÍCULO E DOCUMENTOS**
```
Form fields:
- Tipo de veículo (select: Moto, Bicicleta, Carro)
- Placa (input, condicional se moto/carro)
- CNH (upload foto frente/verso, condicional)
- Número CNH (input)
- Validade CNH (date picker)
- Categoria CNH (auto-validar se A para moto)

Checkbox:
☐ Tenho bag térmica
☐ Aceito os termos de uso

Botão: "Próximo"
```

#### **PASSO 4: DADOS BANCÁRIOS**
```
Form fields:
- Tipo de chave PIX (select: CPF, Email, Telefone, Aleatória)
- Chave PIX (input, validar conforme tipo)
- Banco (select opcional)
- Agência (input opcional)
- Conta (input opcional)

Info box:
"💡 Usamos PIX para pagamentos rápidos. Dados bancários são opcionais."

Botão: "Finalizar Cadastro" (verde, grande)
```

#### **PASSO 5: CONFIRMAÇÃO**
```
Tela de sucesso:
- Ícone: CheckCircle (grande, verde, animado)
- Headline: "Cadastro Enviado!"
- Texto: "Analisaremos seus dados em até 24h"
- Info: "Você receberá um WhatsApp com o resultado"

Card: "Enquanto isso..."
- Link: "Baixe o App" (badges iOS/Android)
- Link: "Entre no Grupo de Motoristas" (WhatsApp)
- Link: "Assista o Tutorial" (YouTube)

Botão: "Voltar para Home"
```

---

## 🍽️ 5. PÁGINA DEMO GARÇOM (`/demo-garcom`)

**Rota:** `src/app/demo-garcom/page.tsx`

### 🎨 Seções e Componentes

#### **HEADER**
```
- Logo
- Badge: "MODO DEMO"
- Botão: "Sair da Demo"
```

#### **TELA PRINCIPAL (Simulação do App)**
```
Layout mobile (centralizado):

HEADER DO APP:
- Avatar do garçom
- Nome: "Demo Garçom"
- Restaurante: "Restaurante Demo"
- Botão: Notificações (badge com 2)

TABS:
1. "Minhas Mesas" (ativa)
2. "Pedidos"
3. "Perfil"

GRID DE MESAS (2x3):
Mesa 1: "Mesa 1" - Status: Livre (verde)
Mesa 2: "Mesa 2" - Status: Ocupada (amarelo) - "R$ 85,00"
Mesa 3: "Mesa 3" - Status: Aguardando (laranja) - "R$ 120,00"
Mesa 4: "Mesa 4" - Status: Livre (verde)
Mesa 5: "Mesa 5" - Status: Ocupada (amarelo) - "R$ 45,00"
Mesa 6: "Mesa 6" - Status: Livre (verde)

Cada card clicável → Abre comanda
```

#### **MODAL: COMANDA (ao clicar mesa)**
```
Header:
- "Mesa 2"
- Status: Ocupada
- Tempo: "15min"
- Botão X (fechar)

Itens da comanda:
1. 2x Hambúrguer Artesanal - R$ 60,00
2. 1x Batata Frita - R$ 15,00
3. 2x Refrigerante - R$ 10,00

Subtotal: R$ 85,00
Taxa serviço (10%): R$ 8,50
Total: R$ 93,50

Botões:
- "Adicionar Item" (verde)
- "Enviar para Cozinha" (azul)
- "Fechar Conta" (roxo)
- "Cancelar Mesa" (vermelho, outline)
```

#### **MODAL: ADICIONAR ITEM**
```
Busca: Input "Buscar produto..."

Lista de produtos (scroll):
- Hambúrguer Artesanal - R$ 30,00 [+]
- Pizza Margherita - R$ 45,00 [+]
- Batata Frita - R$ 15,00 [+]
- Refrigerante - R$ 5,00 [+]

Ao clicar [+]:
- Abre modal de quantidade/observações
- Botão: "Adicionar à Comanda"
```

#### **MODAL: FECHAR CONTA**
```
Resumo:
- Subtotal: R$ 85,00
- Taxa serviço (10%): R$ 8,50
- Total: R$ 93,50

Opções de pagamento:
○ Dinheiro
○ Cartão de Crédito
○ Cartão de Débito
○ PIX

Opções de divisão:
○ Conta única
○ Dividir igualmente (input: quantas pessoas?)
○ Dividir por item

Gorjeta:
- Slider: 0%, 10%, 15%, 20%, Outro
- Valor calculado: R$ X,XX

Botão: "Finalizar Pagamento" (verde, grande)
```

#### **TUTORIAL OVERLAY**
```
Ao entrar na demo, mostrar tooltips:
1. "Clique em uma mesa para abrir"
2. "Adicione itens à comanda"
3. "Envie para a cozinha"
4. "Feche a conta quando terminar"

Botão: "Pular Tutorial"
```

#### **FOOTER DA DEMO**
```
Banner fixo no bottom:
"💡 Esta é uma demonstração. Peça para seu gerente ativar o sistema."
Botão: "Falar com Vendas"
```

---

## 🎯 RESUMO DO QUE CRIAR

### Prioridade ALTA (Criar primeiro):
1. ✅ **Landing Motoristas** (`/para-motoristas`) - COMPLETA
2. ✅ **Cadastro Motorista** (`/cadastro-motorista`) - COMPLETA  
3. ✅ **Landing Garçons** (`/para-garcons`) - COMPLETA
4. ✅ **Demo Garçom** (`/demo-garcom`) - COMPLETA

### Prioridade MÉDIA:
5. **Landing Clientes** (`/para-clientes`) - Especificada acima

### Opcional:
6. **Página Marketplace** - Já existe, pode melhorar

---

## 📐 DESIGN SYSTEM (Usar em todas)

### Cores
```
Motoristas: Cyan/Blue (#06B6D4, #3B82F6)
Garçons: Orange/Red (#F97316, #EF4444)
Clientes: Purple/Pink (#A855F7, #EC4899)
Restaurantes: Violet/Indigo (#8B5CF6, #6366F1)
```

### Tipografia
```
Headlines: font-bold text-4xl md:text-5xl
Subheadlines: text-lg md:text-xl text-gray-600
Body: text-base text-gray-700
```

### Botões
```
Primary: bg-gradient-to-r shadow-lg hover:shadow-xl transition-all
Secondary: border-2 hover:bg-gray-50
Ghost: text-only hover:underline
```

### Espaçamento
```
Sections: py-16 md:py-24
Containers: max-w-6xl mx-auto px-4
Cards: p-6 rounded-2xl shadow-lg
```

---

## 🚀 PRÓXIMOS PASSOS

1. Você cria os layouts no Stitch/V0
2. Eu implemento no código
3. Testamos e ajustamos
4. Deploy

**Comece pela Landing de Motoristas** (é a mais importante e já tem referência do layout que você fez).

Precisa de mais detalhes em alguma seção específica?
