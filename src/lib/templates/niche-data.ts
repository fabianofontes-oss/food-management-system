/**
 * 🧠 Kit Preguiçoso - Dados dos Templates de Nicho
 * 
 * Templates prontos para configurar uma loja em segundos.
 * Focado no "tio do WhatsApp que não sabe mexer no PC".
 */

export interface NicheTemplate {
  id: string
  name: string
  description: string
  icon: string
  colors: {
    primary: string
    secondary: string
    background: string
    accent: string
  }
  categories: {
    name: string
    description: string
    sortOrder: number
    products: {
      name: string
      description: string
      price: number
      sortOrder: number
    }[]
  }[]
}

export const NICHE_TEMPLATES: Record<string, NicheTemplate> = {
  acai: {
    id: 'acai',
    name: 'Açaí',
    description: 'Açaíteria completa com copos, adicionais e muito mais',
    icon: 'IceCream',
    colors: {
      primary: '#7C3AED',      // Roxo vibrante
      secondary: '#A78BFA',    // Roxo claro
      background: '#F5F3FF',   // Fundo lilás suave
      accent: '#C026D3'        // Rosa açaí
    },
    categories: [
      {
        name: '🥤 Copos de Açaí',
        description: 'Escolha o tamanho do seu açaí',
        sortOrder: 1,
        products: [
          { name: 'Açaí 300ml', description: 'Copo pequeno de açaí batido na hora', price: 12.00, sortOrder: 1 },
          { name: 'Açaí 500ml', description: 'Copo médio de açaí batido na hora', price: 18.00, sortOrder: 2 },
          { name: 'Açaí 700ml', description: 'Copo grande de açaí batido na hora', price: 24.00, sortOrder: 3 },
          { name: 'Açaí 1 Litro', description: 'Para dividir ou levar pra casa', price: 32.00, sortOrder: 4 }
        ]
      },
      {
        name: '🆓 Adicionais Grátis',
        description: 'Escolha até 3 adicionais grátis',
        sortOrder: 2,
        products: [
          { name: 'Granola', description: 'Granola crocante', price: 0, sortOrder: 1 },
          { name: 'Banana', description: 'Banana em rodelas', price: 0, sortOrder: 2 },
          { name: 'Mel', description: 'Mel puro', price: 0, sortOrder: 3 },
          { name: 'Leite Condensado', description: 'Leite condensado', price: 0, sortOrder: 4 }
        ]
      },
      {
        name: '💰 Adicionais Pagos',
        description: 'Turbine seu açaí!',
        sortOrder: 3,
        products: [
          { name: 'Leite Ninho', description: 'Leite ninho em pó', price: 3.00, sortOrder: 1 },
          { name: 'Morango', description: 'Morangos frescos', price: 4.00, sortOrder: 2 },
          { name: 'Nutella', description: 'Creme de avelã', price: 5.00, sortOrder: 3 },
          { name: 'Paçoca', description: 'Paçoca triturada', price: 2.50, sortOrder: 4 },
          { name: 'Bis', description: 'Biscoito Bis picado', price: 3.50, sortOrder: 5 },
          { name: 'Ovomaltine', description: 'Ovomaltine crocante', price: 4.00, sortOrder: 6 }
        ]
      },
      {
        name: '🍨 Cremes',
        description: 'Cremes especiais',
        sortOrder: 4,
        products: [
          { name: 'Creme de Cupuaçu 300ml', description: 'Creme de cupuaçu natural', price: 14.00, sortOrder: 1 },
          { name: 'Creme de Cupuaçu 500ml', description: 'Creme de cupuaçu natural', price: 20.00, sortOrder: 2 },
          { name: 'Pitaya 300ml', description: 'Creme de pitaya rosa', price: 16.00, sortOrder: 3 },
          { name: 'Pitaya 500ml', description: 'Creme de pitaya rosa', price: 22.00, sortOrder: 4 }
        ]
      }
    ]
  },

  burger: {
    id: 'burger',
    name: 'Hambúrguer',
    description: 'Hamburgueria artesanal com smash e tradicionais',
    icon: 'Beef',
    colors: {
      primary: '#EA580C',      // Laranja queimado
      secondary: '#FB923C',    // Laranja claro
      background: '#FFF7ED',   // Fundo creme
      accent: '#DC2626'        // Vermelho ketchup
    },
    categories: [
      {
        name: '🍔 Artesanais',
        description: 'Hambúrgueres artesanais com 180g de carne',
        sortOrder: 1,
        products: [
          { name: 'X-Bacon', description: 'Pão brioche, 180g de carne, queijo cheddar, bacon crocante, alface, tomate e molho especial', price: 28.00, sortOrder: 1 },
          { name: 'X-Salada', description: 'Pão brioche, 180g de carne, queijo prato, alface, tomate, cebola roxa e maionese', price: 24.00, sortOrder: 2 },
          { name: 'X-Tudo', description: 'Pão brioche, 180g de carne, queijo, bacon, ovo, presunto, alface, tomate e molho', price: 32.00, sortOrder: 3 },
          { name: 'X-Frango', description: 'Pão brioche, filé de frango grelhado, queijo, alface, tomate e maionese', price: 22.00, sortOrder: 4 }
        ]
      },
      {
        name: '🔥 Smash Burgers',
        description: 'Hambúrgueres smash com bordas crocantes',
        sortOrder: 2,
        products: [
          { name: 'Smash Simples', description: '1 carne smash 90g, queijo cheddar, cebola caramelizada, pão potato', price: 18.00, sortOrder: 1 },
          { name: 'Smash Duplo', description: '2 carnes smash 90g, queijo cheddar, cebola caramelizada, pão potato', price: 26.00, sortOrder: 2 },
          { name: 'Smash Triplo', description: '3 carnes smash 90g, queijo cheddar, cebola caramelizada, pão potato', price: 34.00, sortOrder: 3 },
          { name: 'Smash Bacon', description: '2 carnes smash, queijo, bacon crocante, molho barbecue', price: 30.00, sortOrder: 4 }
        ]
      },
      {
        name: '🍟 Acompanhamentos',
        description: 'Para completar seu pedido',
        sortOrder: 3,
        products: [
          { name: 'Batata Frita P', description: 'Porção pequena de batata frita', price: 10.00, sortOrder: 1 },
          { name: 'Batata Frita G', description: 'Porção grande de batata frita', price: 16.00, sortOrder: 2 },
          { name: 'Onion Rings', description: 'Anéis de cebola empanados', price: 14.00, sortOrder: 3 },
          { name: 'Nuggets (6un)', description: 'Nuggets de frango crocantes', price: 12.00, sortOrder: 4 }
        ]
      },
      {
        name: '🥤 Bebidas',
        description: 'Bebidas geladas',
        sortOrder: 4,
        products: [
          { name: 'Coca-Cola Lata', description: 'Coca-Cola 350ml', price: 6.00, sortOrder: 1 },
          { name: 'Coca-Cola 600ml', description: 'Coca-Cola 600ml', price: 9.00, sortOrder: 2 },
          { name: 'Guaraná Lata', description: 'Guaraná Antarctica 350ml', price: 5.00, sortOrder: 3 },
          { name: 'Água Mineral', description: 'Água mineral 500ml', price: 4.00, sortOrder: 4 },
          { name: 'Suco Natural', description: 'Suco natural 300ml (Laranja ou Limão)', price: 8.00, sortOrder: 5 }
        ]
      }
    ]
  },

  pizza: {
    id: 'pizza',
    name: 'Pizzaria',
    description: 'Pizzaria completa com sabores tradicionais e especiais',
    icon: 'Pizza',
    colors: {
      primary: '#DC2626',      // Vermelho tomate
      secondary: '#F87171',    // Vermelho claro
      background: '#FEF2F2',   // Fundo rosado
      accent: '#F59E0B'        // Amarelo queijo
    },
    categories: [
      {
        name: '🍕 Tradicionais',
        description: 'Pizzas clássicas que todo mundo ama',
        sortOrder: 1,
        products: [
          { name: 'Calabresa', description: 'Molho de tomate, mussarela, calabresa fatiada e cebola', price: 45.00, sortOrder: 1 },
          { name: 'Mussarela', description: 'Molho de tomate, mussarela e orégano', price: 40.00, sortOrder: 2 },
          { name: 'Portuguesa', description: 'Molho, mussarela, presunto, ovo, cebola, azeitona e ervilha', price: 48.00, sortOrder: 3 },
          { name: 'Frango com Catupiry', description: 'Molho, mussarela, frango desfiado e catupiry', price: 50.00, sortOrder: 4 },
          { name: 'Margherita', description: 'Molho de tomate, mussarela de búfala, tomate e manjericão', price: 52.00, sortOrder: 5 }
        ]
      },
      {
        name: '⭐ Especiais',
        description: 'Sabores premium da casa',
        sortOrder: 2,
        products: [
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 55.00, sortOrder: 1 },
          { name: 'Bacon com Cheddar', description: 'Molho, mussarela, bacon crocante e cheddar cremoso', price: 58.00, sortOrder: 2 },
          { name: 'Pepperoni', description: 'Molho, mussarela e pepperoni premium', price: 56.00, sortOrder: 3 },
          { name: 'Carne Seca', description: 'Molho, mussarela, carne seca desfiada, cebola e catupiry', price: 60.00, sortOrder: 4 }
        ]
      },
      {
        name: '🍫 Doces',
        description: 'Pizzas doces para sobremesa',
        sortOrder: 3,
        products: [
          { name: 'Chocolate', description: 'Chocolate ao leite e granulado', price: 42.00, sortOrder: 1 },
          { name: 'Romeu e Julieta', description: 'Mussarela e goiabada', price: 44.00, sortOrder: 2 },
          { name: 'Banana com Canela', description: 'Banana, açúcar, canela e leite condensado', price: 40.00, sortOrder: 3 },
          { name: 'Prestígio', description: 'Chocolate e coco ralado', price: 46.00, sortOrder: 4 }
        ]
      },
      {
        name: '🥤 Bebidas',
        description: 'Bebidas para acompanhar',
        sortOrder: 4,
        products: [
          { name: 'Coca-Cola 2L', description: 'Coca-Cola 2 litros', price: 14.00, sortOrder: 1 },
          { name: 'Guaraná 2L', description: 'Guaraná Antarctica 2 litros', price: 12.00, sortOrder: 2 },
          { name: 'Suco Del Valle 1L', description: 'Sabores: Uva, Laranja ou Pêssego', price: 10.00, sortOrder: 3 },
          { name: 'Água 1,5L', description: 'Água mineral sem gás', price: 6.00, sortOrder: 4 }
        ]
      },
      {
        name: '🧀 Bordas Recheadas',
        description: 'Adicione borda recheada',
        sortOrder: 5,
        products: [
          { name: 'Borda Catupiry', description: 'Borda recheada com catupiry', price: 8.00, sortOrder: 1 },
          { name: 'Borda Cheddar', description: 'Borda recheada com cheddar', price: 8.00, sortOrder: 2 },
          { name: 'Borda Chocolate', description: 'Borda recheada com chocolate (p/ doces)', price: 10.00, sortOrder: 3 }
        ]
      }
    ]
  },

  marmita: {
    id: 'marmita',
    name: 'Marmitaria',
    description: 'Marmitas caseiras com comida de verdade',
    icon: 'UtensilsCrossed',
    colors: {
      primary: '#16A34A',      // Verde folha
      secondary: '#4ADE80',    // Verde claro
      background: '#F0FDF4',   // Fundo verde suave
      accent: '#CA8A04'        // Dourado/mostarda
    },
    categories: [
      {
        name: '📦 Tamanhos',
        description: 'Escolha o tamanho da sua marmita',
        sortOrder: 1,
        products: [
          { name: 'Marmita P (300g)', description: 'Arroz, feijão, salada e 1 proteína', price: 15.00, sortOrder: 1 },
          { name: 'Marmita M (450g)', description: 'Arroz, feijão, salada, farofa e 1 proteína', price: 20.00, sortOrder: 2 },
          { name: 'Marmita G (600g)', description: 'Arroz, feijão, salada, farofa, vinagrete e 1 proteína', price: 25.00, sortOrder: 3 },
          { name: 'Marmita Fitness', description: 'Arroz integral, legumes, salada e proteína grelhada', price: 28.00, sortOrder: 4 }
        ]
      },
      {
        name: '🍖 Proteínas',
        description: 'Escolha sua proteína',
        sortOrder: 2,
        products: [
          { name: 'Bife Acebolado', description: 'Bife bovino com cebolas douradas', price: 0, sortOrder: 1 },
          { name: 'Frango Grelhado', description: 'Filé de frango grelhado temperado', price: 0, sortOrder: 2 },
          { name: 'Carne Moída', description: 'Carne moída refogada', price: 0, sortOrder: 3 },
          { name: 'Linguiça', description: 'Linguiça calabresa frita', price: 0, sortOrder: 4 },
          { name: 'Ovo Frito', description: 'Dois ovos fritos', price: 0, sortOrder: 5 },
          { name: 'Peixe Frito', description: 'Filé de tilápia empanado', price: 3.00, sortOrder: 6 },
          { name: 'Costela', description: 'Costela bovina desfiada', price: 5.00, sortOrder: 7 }
        ]
      },
      {
        name: '🥗 Guarnições Extras',
        description: 'Adicione mais sabor',
        sortOrder: 3,
        products: [
          { name: 'Purê de Batata', description: 'Purê cremoso', price: 4.00, sortOrder: 1 },
          { name: 'Batata Frita', description: 'Porção de batata frita', price: 5.00, sortOrder: 2 },
          { name: 'Macarrão', description: 'Macarrão ao alho e óleo', price: 4.00, sortOrder: 3 },
          { name: 'Farofa Especial', description: 'Farofa com bacon e ovos', price: 3.00, sortOrder: 4 },
          { name: 'Salada Extra', description: 'Porção extra de salada', price: 3.00, sortOrder: 5 }
        ]
      },
      {
        name: '🍲 Pratos Especiais',
        description: 'Pratos do dia',
        sortOrder: 4,
        products: [
          { name: 'Feijoada Completa', description: 'Feijoada com arroz, farofa, couve e laranja', price: 32.00, sortOrder: 1 },
          { name: 'Strogonoff de Frango', description: 'Strogonoff, arroz, batata palha e salada', price: 28.00, sortOrder: 2 },
          { name: 'Escondidinho de Carne', description: 'Escondidinho cremoso com carne seca', price: 30.00, sortOrder: 3 },
          { name: 'Parmegiana de Frango', description: 'Parmegiana com arroz e fritas', price: 35.00, sortOrder: 4 }
        ]
      },
      {
        name: '🥤 Bebidas',
        description: 'Bebidas para acompanhar',
        sortOrder: 5,
        products: [
          { name: 'Refrigerante Lata', description: 'Coca, Guaraná ou Fanta', price: 5.00, sortOrder: 1 },
          { name: 'Suco Natural 300ml', description: 'Laranja, limão ou maracujá', price: 7.00, sortOrder: 2 },
          { name: 'Água Mineral', description: 'Água 500ml', price: 3.00, sortOrder: 3 },
          { name: 'Chá Gelado', description: 'Chá mate ou limão 300ml', price: 5.00, sortOrder: 4 }
        ]
      }
    ]
  }
}

/**
 * Lista simplificada para exibição na UI
 */
export const NICHE_LIST = Object.values(NICHE_TEMPLATES).map(niche => ({
  id: niche.id,
  name: niche.name,
  description: niche.description,
  icon: niche.icon,
  color: niche.colors.primary,
  bgColor: niche.colors.background,
  categoriesCount: niche.categories.length,
  productsCount: niche.categories.reduce((acc, cat) => acc + cat.products.length, 0)
}))
