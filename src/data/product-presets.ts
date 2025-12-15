// Kits pré-definidos para importação rápida (Módulo Preguiçoso)
// Facilita o onboarding de novos clientes

export interface PresetItem {
  name: string
  description?: string
  price: number
  cost?: number
  image_url?: string
  unit: string
  barcode?: string
  brand?: string
  tags?: string[]
}

export interface StarterPack {
  id: string
  name: string
  description: string
  icon: string
  category_suggestion: string
  items: PresetItem[]
}

// URLs de imagens placeholder (em produção, usar CDN próprio)
const IMG_BASE = 'https://images.unsplash.com/photo-'

export const STARTER_PACKS: StarterPack[] = [
  // ============================================
  // BEBIDAS
  // ============================================
  {
    id: 'beverages_sodas',
    name: '🥤 Refrigerantes',
    description: 'Coca-Cola, Guaraná, Fanta e mais',
    icon: 'GlassWater',
    category_suggestion: 'Bebidas',
    items: [
      { name: 'Coca-Cola Lata 350ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'Coca-Cola', barcode: '7894900010015' },
      { name: 'Coca-Cola 600ml', price: 8.00, cost: 4.50, unit: 'un', brand: 'Coca-Cola', barcode: '7894900011029' },
      { name: 'Coca-Cola 2L', price: 12.00, cost: 7.00, unit: 'un', brand: 'Coca-Cola', barcode: '7894900011036' },
      { name: 'Coca-Cola Zero Lata 350ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'Coca-Cola', barcode: '7894900530018' },
      { name: 'Guaraná Antarctica Lata 350ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Antarctica', barcode: '7891991010856' },
      { name: 'Guaraná Antarctica 600ml', price: 7.00, cost: 4.00, unit: 'un', brand: 'Antarctica', barcode: '7891991010863' },
      { name: 'Guaraná Antarctica 2L', price: 10.00, cost: 6.00, unit: 'un', brand: 'Antarctica', barcode: '7891991010870' },
      { name: 'Fanta Laranja Lata 350ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Coca-Cola', barcode: '7894900020014' },
      { name: 'Fanta Uva Lata 350ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Coca-Cola', barcode: '7894900020021' },
      { name: 'Sprite Lata 350ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Coca-Cola', barcode: '7894900030013' },
      { name: 'Pepsi Lata 350ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Pepsi', barcode: '7892840800017' },
      { name: 'Pepsi 2L', price: 9.00, cost: 5.50, unit: 'un', brand: 'Pepsi', barcode: '7892840800024' },
      { name: 'Schweppes Citrus Lata 350ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'Schweppes', barcode: '7894900050011' },
      { name: 'Kuat Guaraná Lata 350ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Coca-Cola', barcode: '7894900060010' },
    ]
  },
  {
    id: 'beverages_water_juice',
    name: '💧 Águas e Sucos',
    description: 'Água mineral, sucos e chás',
    icon: 'Droplets',
    category_suggestion: 'Bebidas',
    items: [
      { name: 'Água Mineral 500ml', price: 3.50, cost: 1.50, unit: 'un', brand: 'Crystal' },
      { name: 'Água Mineral sem Gás 1,5L', price: 5.00, cost: 2.50, unit: 'un', brand: 'Crystal' },
      { name: 'Água com Gás 500ml', price: 4.00, cost: 2.00, unit: 'un', brand: 'Crystal' },
      { name: 'Água de Coco 330ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'Kero Coco' },
      { name: 'Suco Del Valle Laranja 290ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Del Valle' },
      { name: 'Suco Del Valle Uva 290ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Del Valle' },
      { name: 'Suco Del Valle Pêssego 290ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Del Valle' },
      { name: 'Suco Del Valle Manga 290ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Del Valle' },
      { name: 'Chá Leão Pêssego 340ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Leão' },
      { name: 'Chá Leão Limão 340ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Leão' },
      { name: 'Chá Matte Leão Natural 340ml', price: 4.50, cost: 2.50, unit: 'un', brand: 'Leão' },
    ]
  },
  {
    id: 'beverages_energy',
    name: '⚡ Energéticos',
    description: 'Red Bull, Monster e similares',
    icon: 'Zap',
    category_suggestion: 'Bebidas',
    items: [
      { name: 'Red Bull Energy Drink 250ml', price: 12.00, cost: 7.00, unit: 'un', brand: 'Red Bull', barcode: '90162800' },
      { name: 'Red Bull Sugar Free 250ml', price: 12.00, cost: 7.00, unit: 'un', brand: 'Red Bull', barcode: '90162817' },
      { name: 'Red Bull Tropical 250ml', price: 13.00, cost: 7.50, unit: 'un', brand: 'Red Bull' },
      { name: 'Monster Energy 473ml', price: 10.00, cost: 6.00, unit: 'un', brand: 'Monster', barcode: '70847811084' },
      { name: 'Monster Ultra 473ml', price: 10.00, cost: 6.00, unit: 'un', brand: 'Monster' },
      { name: 'Monster Mango Loco 473ml', price: 10.00, cost: 6.00, unit: 'un', brand: 'Monster' },
      { name: 'TNT Energy Drink 269ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'TNT' },
      { name: 'Fusion Energy Drink 250ml', price: 7.00, cost: 4.00, unit: 'un', brand: 'Fusion' },
    ]
  },
  {
    id: 'beverages_beer',
    name: '🍺 Cervejas',
    description: 'Cervejas populares e artesanais',
    icon: 'Beer',
    category_suggestion: 'Bebidas Alcoólicas',
    items: [
      { name: 'Brahma Lata 350ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Brahma', barcode: '7891149100101' },
      { name: 'Skol Lata 350ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Skol', barcode: '7891149200108' },
      { name: 'Antarctica Original Lata 350ml', price: 5.00, cost: 2.80, unit: 'un', brand: 'Antarctica' },
      { name: 'Heineken Lata 350ml', price: 7.00, cost: 4.50, unit: 'un', brand: 'Heineken', barcode: '87100900' },
      { name: 'Heineken Long Neck 330ml', price: 8.00, cost: 5.00, unit: 'un', brand: 'Heineken' },
      { name: 'Budweiser Lata 350ml', price: 6.00, cost: 3.50, unit: 'un', brand: 'Budweiser' },
      { name: 'Stella Artois Lata 350ml', price: 7.00, cost: 4.50, unit: 'un', brand: 'Stella Artois' },
      { name: 'Corona Extra Long Neck 330ml', price: 9.00, cost: 5.50, unit: 'un', brand: 'Corona' },
      { name: 'Eisenbahn Pilsen Long Neck 355ml', price: 8.00, cost: 5.00, unit: 'un', brand: 'Eisenbahn' },
      { name: 'Original Lata 350ml', price: 5.50, cost: 3.00, unit: 'un', brand: 'Antarctica' },
    ]
  },

  // ============================================
  // AÇAÍ E SORVETE
  // ============================================
  {
    id: 'acai_toppings',
    name: '🍓 Adicionais de Açaí',
    description: 'Leite Ninho, granola, frutas e caldas',
    icon: 'Cherry',
    category_suggestion: 'Adicionais',
    items: [
      { name: 'Leite Ninho', price: 3.00, cost: 1.50, unit: 'porção', tags: ['popular', 'doce'] },
      { name: 'Granola', price: 2.00, cost: 0.80, unit: 'porção', tags: ['crocante', 'saudável'] },
      { name: 'Paçoca', price: 2.50, cost: 1.00, unit: 'porção', tags: ['popular', 'doce'] },
      { name: 'Amendoim', price: 2.00, cost: 0.80, unit: 'porção', tags: ['crocante'] },
      { name: 'Castanha de Caju', price: 4.00, cost: 2.50, unit: 'porção', tags: ['premium', 'crocante'] },
      { name: 'Banana', price: 2.00, cost: 0.70, unit: 'porção', tags: ['fruta', 'saudável'] },
      { name: 'Morango', price: 3.00, cost: 1.50, unit: 'porção', tags: ['fruta', 'popular'] },
      { name: 'Kiwi', price: 3.50, cost: 2.00, unit: 'porção', tags: ['fruta', 'premium'] },
      { name: 'Manga', price: 3.00, cost: 1.50, unit: 'porção', tags: ['fruta'] },
      { name: 'Uva', price: 3.50, cost: 2.00, unit: 'porção', tags: ['fruta'] },
      { name: 'Mel', price: 2.50, cost: 1.20, unit: 'porção', tags: ['calda', 'saudável'] },
      { name: 'Leite Condensado', price: 2.50, cost: 1.00, unit: 'porção', tags: ['calda', 'doce'] },
      { name: 'Nutella', price: 5.00, cost: 3.00, unit: 'porção', tags: ['calda', 'premium', 'popular'] },
      { name: 'Doce de Leite', price: 3.00, cost: 1.50, unit: 'porção', tags: ['calda', 'doce'] },
      { name: 'Calda de Chocolate', price: 2.50, cost: 1.00, unit: 'porção', tags: ['calda'] },
      { name: 'Calda de Morango', price: 2.50, cost: 1.00, unit: 'porção', tags: ['calda'] },
      { name: 'Calda de Caramelo', price: 2.50, cost: 1.00, unit: 'porção', tags: ['calda'] },
      { name: 'Coco Ralado', price: 2.00, cost: 0.80, unit: 'porção', tags: ['crocante'] },
      { name: 'Confete', price: 2.50, cost: 1.00, unit: 'porção', tags: ['doce', 'colorido'] },
      { name: 'Granulado', price: 2.00, cost: 0.70, unit: 'porção', tags: ['chocolate'] },
      { name: 'Ovomaltine', price: 3.50, cost: 2.00, unit: 'porção', tags: ['crocante', 'popular'] },
      { name: 'Sucrilhos', price: 2.50, cost: 1.00, unit: 'porção', tags: ['crocante'] },
      { name: 'Chantilly', price: 3.00, cost: 1.50, unit: 'porção', tags: ['cremoso'] },
      { name: 'Mousse de Maracujá', price: 4.00, cost: 2.00, unit: 'porção', tags: ['cremoso', 'premium'] },
      { name: 'Mousse de Chocolate', price: 4.00, cost: 2.00, unit: 'porção', tags: ['cremoso', 'chocolate'] },
    ]
  },
  {
    id: 'icecream_flavors',
    name: '🍦 Sabores de Sorvete',
    description: 'Sabores clássicos de sorvete de massa',
    icon: 'IceCream',
    category_suggestion: 'Sorvetes',
    items: [
      { name: 'Chocolate', price: 8.00, cost: 3.50, unit: 'bola', tags: ['clássico', 'popular'] },
      { name: 'Chocolate Belga', price: 10.00, cost: 5.00, unit: 'bola', tags: ['premium', 'chocolate'] },
      { name: 'Chocolate Branco', price: 9.00, cost: 4.00, unit: 'bola', tags: ['chocolate'] },
      { name: 'Creme', price: 7.00, cost: 3.00, unit: 'bola', tags: ['clássico'] },
      { name: 'Baunilha', price: 7.00, cost: 3.00, unit: 'bola', tags: ['clássico'] },
      { name: 'Morango', price: 8.00, cost: 3.50, unit: 'bola', tags: ['fruta', 'popular'] },
      { name: 'Flocos', price: 8.00, cost: 3.50, unit: 'bola', tags: ['clássico', 'popular'] },
      { name: 'Napolitano', price: 8.00, cost: 3.50, unit: 'bola', tags: ['clássico'] },
      { name: 'Coco', price: 8.00, cost: 3.50, unit: 'bola', tags: ['tropical'] },
      { name: 'Pistache', price: 12.00, cost: 6.00, unit: 'bola', tags: ['premium'] },
      { name: 'Doce de Leite', price: 9.00, cost: 4.00, unit: 'bola', tags: ['brasileiro', 'popular'] },
      { name: 'Maracujá', price: 8.00, cost: 3.50, unit: 'bola', tags: ['fruta', 'tropical'] },
      { name: 'Limão', price: 7.00, cost: 3.00, unit: 'bola', tags: ['fruta', 'refrescante'] },
      { name: 'Açaí', price: 10.00, cost: 5.00, unit: 'bola', tags: ['brasileiro', 'popular'] },
      { name: 'Ninho com Nutella', price: 12.00, cost: 6.00, unit: 'bola', tags: ['premium', 'popular'] },
      { name: 'Cookies and Cream', price: 10.00, cost: 4.50, unit: 'bola', tags: ['premium'] },
      { name: 'Brigadeiro', price: 9.00, cost: 4.00, unit: 'bola', tags: ['brasileiro', 'chocolate'] },
      { name: 'Leite Ninho', price: 10.00, cost: 4.50, unit: 'bola', tags: ['popular'] },
    ]
  },
  {
    id: 'popsicles',
    name: '🧊 Picolés',
    description: 'Picolés industrializados populares',
    icon: 'Popsicle',
    category_suggestion: 'Picolés',
    items: [
      { name: 'Picolé Kibon Fruttare Morango', price: 5.00, cost: 2.80, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Fruttare Limão', price: 5.00, cost: 2.80, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Fruttare Abacaxi', price: 5.00, cost: 2.80, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Magnum Clássico', price: 9.00, cost: 5.00, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Magnum White', price: 9.00, cost: 5.00, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Cornetto', price: 7.00, cost: 4.00, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Kibon Tablito', price: 4.00, cost: 2.00, unit: 'un', brand: 'Kibon' },
      { name: 'Picolé Nestlé Mega', price: 8.00, cost: 4.50, unit: 'un', brand: 'Nestlé' },
      { name: 'Picolé Nestlé Eskibon', price: 4.50, cost: 2.30, unit: 'un', brand: 'Nestlé' },
      { name: 'Picolé La Fruta Açaí', price: 6.00, cost: 3.50, unit: 'un', brand: 'La Fruta' },
      { name: 'Picolé de Coco Queimado', price: 4.00, cost: 2.00, unit: 'un' },
      { name: 'Picolé de Chocolate', price: 4.00, cost: 2.00, unit: 'un' },
    ]
  },

  // ============================================
  // BOMBONIÈRE
  // ============================================
  {
    id: 'candy_chocolates',
    name: '🍫 Chocolates',
    description: 'Barras, bombons e trufas',
    icon: 'Candy',
    category_suggestion: 'Bombonière',
    items: [
      { name: 'KitKat', price: 6.00, cost: 3.50, unit: 'un', brand: 'Nestlé', barcode: '7891000100103' },
      { name: 'Bis Xtra', price: 5.00, cost: 2.80, unit: 'un', brand: 'Lacta' },
      { name: 'Bis Oreo', price: 6.00, cost: 3.50, unit: 'un', brand: 'Lacta' },
      { name: 'Trident Menta', price: 3.00, cost: 1.50, unit: 'un', brand: 'Trident' },
      { name: 'Halls Menta', price: 2.50, cost: 1.20, unit: 'un', brand: 'Halls' },
      { name: 'Baton ao Leite', price: 2.50, cost: 1.20, unit: 'un', brand: 'Garoto' },
      { name: 'Baton Branco', price: 2.50, cost: 1.20, unit: 'un', brand: 'Garoto' },
      { name: 'Sonho de Valsa', price: 2.00, cost: 1.00, unit: 'un', brand: 'Lacta' },
      { name: 'Ouro Branco', price: 2.00, cost: 1.00, unit: 'un', brand: 'Lacta' },
      { name: 'Diamante Negro', price: 5.00, cost: 2.80, unit: 'un', brand: 'Lacta' },
      { name: 'Laka', price: 5.00, cost: 2.80, unit: 'un', brand: 'Lacta' },
      { name: 'Shot', price: 5.00, cost: 2.80, unit: 'un', brand: 'Lacta' },
      { name: 'Twix', price: 5.50, cost: 3.00, unit: 'un', brand: 'Mars' },
      { name: 'Snickers', price: 5.50, cost: 3.00, unit: 'un', brand: 'Mars' },
      { name: 'M&Ms Chocolate', price: 6.00, cost: 3.50, unit: 'un', brand: 'Mars' },
      { name: 'M&Ms Amendoim', price: 6.00, cost: 3.50, unit: 'un', brand: 'Mars' },
      { name: 'Paçoca Amor', price: 1.50, cost: 0.70, unit: 'un', brand: 'Amor' },
      { name: 'Paçoquita', price: 1.50, cost: 0.70, unit: 'un', brand: 'Santa Helena' },
      { name: 'Serenata de Amor', price: 2.00, cost: 1.00, unit: 'un', brand: 'Garoto' },
    ]
  },
  {
    id: 'candy_snacks',
    name: '🍿 Salgadinhos',
    description: 'Batatas, doritos e amendoins',
    icon: 'Cookie',
    category_suggestion: 'Bombonière',
    items: [
      { name: 'Ruffles Original 96g', price: 8.00, cost: 5.00, unit: 'un', brand: 'Ruffles' },
      { name: 'Ruffles Cheddar 96g', price: 8.00, cost: 5.00, unit: 'un', brand: 'Ruffles' },
      { name: 'Doritos Nacho 96g', price: 8.00, cost: 5.00, unit: 'un', brand: 'Doritos' },
      { name: 'Cheetos Requeijão 45g', price: 5.00, cost: 2.80, unit: 'un', brand: 'Cheetos' },
      { name: 'Fandangos Presunto 45g', price: 5.00, cost: 2.80, unit: 'un', brand: 'Elma Chips' },
      { name: 'Amendoim Japonês 100g', price: 4.00, cost: 2.00, unit: 'un' },
      { name: 'Amendoim Cri Cri 100g', price: 5.00, cost: 2.80, unit: 'un', brand: 'Dori' },
      { name: 'Pipoca Doce 50g', price: 3.00, cost: 1.50, unit: 'un' },
      { name: 'Pipoca Salgada 50g', price: 3.00, cost: 1.50, unit: 'un' },
    ]
  },

  // ============================================
  // HAMBURGUERIA
  // ============================================
  {
    id: 'burger_proteins',
    name: '🍔 Proteínas Burger',
    description: 'Carnes, frangos e vegetais',
    icon: 'Beef',
    category_suggestion: 'Adicionais',
    items: [
      { name: 'Blend 150g', price: 12.00, cost: 6.00, unit: 'un', tags: ['carne', 'principal'] },
      { name: 'Blend 200g', price: 15.00, cost: 8.00, unit: 'un', tags: ['carne', 'principal'] },
      { name: 'Smash Burger 90g', price: 8.00, cost: 4.00, unit: 'un', tags: ['carne', 'smash'] },
      { name: 'Frango Grelhado', price: 10.00, cost: 5.00, unit: 'un', tags: ['frango'] },
      { name: 'Frango Crispy', price: 12.00, cost: 6.00, unit: 'un', tags: ['frango', 'empanado'] },
      { name: 'Hambúrguer de Costela', price: 14.00, cost: 7.00, unit: 'un', tags: ['carne', 'premium'] },
      { name: 'Hambúrguer Vegano', price: 14.00, cost: 7.00, unit: 'un', tags: ['vegano'] },
      { name: 'Bacon Extra (3 fatias)', price: 5.00, cost: 2.50, unit: 'porção', tags: ['bacon'] },
      { name: 'Ovo', price: 3.00, cost: 1.00, unit: 'un', tags: ['ovo'] },
    ]
  },
  {
    id: 'burger_toppings',
    name: '🧀 Adicionais Burger',
    description: 'Queijos, molhos e vegetais',
    icon: 'Salad',
    category_suggestion: 'Adicionais',
    items: [
      { name: 'Queijo Cheddar', price: 4.00, cost: 2.00, unit: 'fatia', tags: ['queijo'] },
      { name: 'Queijo Prato', price: 3.00, cost: 1.50, unit: 'fatia', tags: ['queijo'] },
      { name: 'Queijo Gorgonzola', price: 6.00, cost: 3.50, unit: 'porção', tags: ['queijo', 'premium'] },
      { name: 'Cheddar Cremoso', price: 5.00, cost: 2.50, unit: 'porção', tags: ['queijo', 'cremoso'] },
      { name: 'Catupiry', price: 5.00, cost: 2.50, unit: 'porção', tags: ['queijo', 'cremoso'] },
      { name: 'Alface', price: 1.00, cost: 0.30, unit: 'porção', tags: ['vegetal'] },
      { name: 'Tomate', price: 1.00, cost: 0.30, unit: 'porção', tags: ['vegetal'] },
      { name: 'Cebola Roxa', price: 1.50, cost: 0.50, unit: 'porção', tags: ['vegetal'] },
      { name: 'Cebola Caramelizada', price: 4.00, cost: 2.00, unit: 'porção', tags: ['vegetal', 'premium'] },
      { name: 'Picles', price: 2.00, cost: 0.80, unit: 'porção', tags: ['vegetal'] },
      { name: 'Jalapeño', price: 3.00, cost: 1.50, unit: 'porção', tags: ['pimenta'] },
      { name: 'Molho Especial', price: 2.00, cost: 0.80, unit: 'porção', tags: ['molho'] },
      { name: 'Maionese da Casa', price: 2.00, cost: 0.80, unit: 'porção', tags: ['molho'] },
      { name: 'Barbecue', price: 2.00, cost: 0.80, unit: 'porção', tags: ['molho'] },
      { name: 'Mostarda e Mel', price: 3.00, cost: 1.50, unit: 'porção', tags: ['molho'] },
    ]
  },

  // ============================================
  // PIZZARIA
  // ============================================
  {
    id: 'pizza_flavors',
    name: '🍕 Sabores de Pizza',
    description: 'Sabores tradicionais e especiais',
    icon: 'Pizza',
    category_suggestion: 'Pizzas',
    items: [
      { name: 'Mussarela', price: 45.00, cost: 18.00, unit: 'un', tags: ['tradicional'] },
      { name: 'Calabresa', price: 48.00, cost: 20.00, unit: 'un', tags: ['tradicional', 'popular'] },
      { name: 'Margherita', price: 50.00, cost: 22.00, unit: 'un', tags: ['tradicional'] },
      { name: 'Portuguesa', price: 52.00, cost: 24.00, unit: 'un', tags: ['tradicional', 'popular'] },
      { name: 'Frango com Catupiry', price: 52.00, cost: 24.00, unit: 'un', tags: ['popular'] },
      { name: 'Pepperoni', price: 55.00, cost: 26.00, unit: 'un', tags: ['premium'] },
      { name: 'Quatro Queijos', price: 55.00, cost: 26.00, unit: 'un', tags: ['premium'] },
      { name: 'Bacon', price: 52.00, cost: 24.00, unit: 'un', tags: ['popular'] },
      { name: 'Napolitana', price: 48.00, cost: 20.00, unit: 'un', tags: ['tradicional'] },
      { name: 'Atum', price: 50.00, cost: 22.00, unit: 'un', tags: ['peixe'] },
      { name: 'Vegetariana', price: 48.00, cost: 20.00, unit: 'un', tags: ['vegetariano'] },
      { name: 'Chocolate', price: 45.00, cost: 18.00, unit: 'un', tags: ['doce'] },
      { name: 'Romeu e Julieta', price: 48.00, cost: 20.00, unit: 'un', tags: ['doce'] },
      { name: 'Banana com Canela', price: 45.00, cost: 18.00, unit: 'un', tags: ['doce'] },
    ]
  },

  // ============================================
  // JAPONÊS / SUSHI
  // ============================================
  {
    id: 'sushi_pieces',
    name: '🍣 Peças de Sushi',
    description: 'Sushis, sashimis e hots',
    icon: 'Fish',
    category_suggestion: 'Sushi',
    items: [
      { name: 'Sushi de Salmão', price: 8.00, cost: 4.00, unit: 'dupla', tags: ['salmão', 'popular'] },
      { name: 'Sushi de Atum', price: 9.00, cost: 5.00, unit: 'dupla', tags: ['atum'] },
      { name: 'Sushi de Camarão', price: 10.00, cost: 6.00, unit: 'dupla', tags: ['camarão'] },
      { name: 'Sashimi de Salmão', price: 12.00, cost: 6.00, unit: '5 fatias', tags: ['salmão', 'popular'] },
      { name: 'Sashimi de Atum', price: 14.00, cost: 8.00, unit: '5 fatias', tags: ['atum'] },
      { name: 'Hot Roll', price: 18.00, cost: 8.00, unit: '8 peças', tags: ['empanado', 'popular'] },
      { name: 'Hot Philadelphia', price: 22.00, cost: 10.00, unit: '8 peças', tags: ['empanado', 'cream cheese'] },
      { name: 'Uramaki Salmão', price: 20.00, cost: 9.00, unit: '8 peças', tags: ['salmão'] },
      { name: 'Uramaki Skin', price: 18.00, cost: 8.00, unit: '8 peças', tags: ['skin'] },
      { name: 'Temaki Salmão', price: 22.00, cost: 10.00, unit: 'un', tags: ['salmão', 'popular'] },
      { name: 'Temaki Atum', price: 24.00, cost: 12.00, unit: 'un', tags: ['atum'] },
      { name: 'Gunkan de Salmão', price: 10.00, cost: 5.00, unit: 'dupla', tags: ['salmão'] },
      { name: 'Joe de Salmão', price: 14.00, cost: 7.00, unit: '4 peças', tags: ['salmão', 'maçaricado'] },
    ]
  },

  // ============================================
  // CAFETERIA
  // ============================================
  {
    id: 'coffee_drinks',
    name: '☕ Cafés',
    description: 'Espresso, cappuccino e mais',
    icon: 'Coffee',
    category_suggestion: 'Cafés',
    items: [
      { name: 'Espresso', price: 6.00, cost: 2.00, unit: 'un', tags: ['quente', 'clássico'] },
      { name: 'Espresso Duplo', price: 8.00, cost: 3.00, unit: 'un', tags: ['quente', 'forte'] },
      { name: 'Americano', price: 7.00, cost: 2.50, unit: 'un', tags: ['quente'] },
      { name: 'Cappuccino', price: 10.00, cost: 4.00, unit: 'un', tags: ['quente', 'popular'] },
      { name: 'Latte', price: 12.00, cost: 5.00, unit: 'un', tags: ['quente', 'leite'] },
      { name: 'Mocha', price: 14.00, cost: 6.00, unit: 'un', tags: ['quente', 'chocolate'] },
      { name: 'Macchiato', price: 8.00, cost: 3.00, unit: 'un', tags: ['quente'] },
      { name: 'Café com Leite', price: 8.00, cost: 3.00, unit: 'un', tags: ['quente', 'clássico'] },
      { name: 'Iced Coffee', price: 12.00, cost: 5.00, unit: 'un', tags: ['gelado'] },
      { name: 'Iced Latte', price: 14.00, cost: 6.00, unit: 'un', tags: ['gelado', 'popular'] },
      { name: 'Frappuccino Chocolate', price: 16.00, cost: 7.00, unit: 'un', tags: ['gelado', 'doce'] },
      { name: 'Frappuccino Caramelo', price: 16.00, cost: 7.00, unit: 'un', tags: ['gelado', 'doce'] },
      { name: 'Chá Verde', price: 8.00, cost: 3.00, unit: 'un', tags: ['quente', 'chá'] },
      { name: 'Chocolate Quente', price: 12.00, cost: 5.00, unit: 'un', tags: ['quente', 'doce'] },
    ]
  },

  // ============================================
  // FIT / HEALTHY
  // ============================================
  {
    id: 'fit_meals',
    name: '🥗 Refeições Fit',
    description: 'Pratos saudáveis e low carb',
    icon: 'Leaf',
    category_suggestion: 'Fit',
    items: [
      { name: 'Frango Grelhado + Legumes', price: 28.00, cost: 12.00, unit: 'un', description: '200g frango + mix de legumes. 350kcal, 40g proteína', tags: ['low-carb', 'proteína'] },
      { name: 'Salmão Grelhado + Quinoa', price: 38.00, cost: 18.00, unit: 'un', description: '180g salmão + quinoa. 450kcal, 35g proteína', tags: ['omega-3', 'premium'] },
      { name: 'Bowl de Atum', price: 32.00, cost: 15.00, unit: 'un', description: 'Arroz integral, atum, edamame, pepino. 380kcal', tags: ['peixe', 'proteína'] },
      { name: 'Salada Caesar Fit', price: 26.00, cost: 11.00, unit: 'un', description: 'Frango, alface, parmesão, molho light. 280kcal', tags: ['salada', 'low-carb'] },
      { name: 'Wrap Integral de Frango', price: 22.00, cost: 9.00, unit: 'un', description: 'Tortilha integral, frango desfiado, vegetais. 320kcal', tags: ['integral'] },
      { name: 'Omelete de Claras', price: 18.00, cost: 7.00, unit: 'un', description: '4 claras, espinafre, tomate. 180kcal, 25g proteína', tags: ['low-carb', 'proteína'] },
      { name: 'Açaí Fit (sem açúcar)', price: 20.00, cost: 8.00, unit: '300ml', description: 'Açaí puro + banana + granola s/ açúcar. 250kcal', tags: ['sem açúcar'] },
      { name: 'Smoothie Verde Detox', price: 16.00, cost: 6.00, unit: 'un', description: 'Couve, abacaxi, gengibre, limão. 120kcal', tags: ['detox', 'vegano'] },
      { name: 'Smoothie Proteico', price: 22.00, cost: 10.00, unit: 'un', description: 'Whey, banana, pasta de amendoim. 350kcal, 30g proteína', tags: ['proteína', 'pós-treino'] },
    ]
  },

  // ============================================
  // CONFEITARIA
  // ============================================
  {
    id: 'bakery_cakes',
    name: '🎂 Bolos e Tortas',
    description: 'Fatias e bolos inteiros',
    icon: 'Cake',
    category_suggestion: 'Confeitaria',
    items: [
      { name: 'Fatia de Bolo de Chocolate', price: 12.00, cost: 5.00, unit: 'fatia', tags: ['chocolate', 'popular'] },
      { name: 'Fatia de Bolo de Cenoura', price: 10.00, cost: 4.00, unit: 'fatia', tags: ['tradicional'] },
      { name: 'Fatia de Cheesecake', price: 15.00, cost: 7.00, unit: 'fatia', tags: ['premium'] },
      { name: 'Fatia de Torta de Limão', price: 12.00, cost: 5.00, unit: 'fatia', tags: ['cítrico'] },
      { name: 'Fatia de Red Velvet', price: 14.00, cost: 6.00, unit: 'fatia', tags: ['premium', 'popular'] },
      { name: 'Brownie', price: 10.00, cost: 4.00, unit: 'un', tags: ['chocolate'] },
      { name: 'Brownie com Sorvete', price: 18.00, cost: 8.00, unit: 'un', tags: ['chocolate', 'gelado'] },
      { name: 'Petit Gâteau', price: 22.00, cost: 10.00, unit: 'un', tags: ['chocolate', 'premium'] },
      { name: 'Torta Holandesa (fatia)', price: 14.00, cost: 6.00, unit: 'fatia', tags: ['tradicional'] },
      { name: 'Pudim', price: 10.00, cost: 4.00, unit: 'fatia', tags: ['tradicional', 'brasileiro'] },
    ]
  },
]

// Função helper para obter pack por ID
export function getStarterPackById(id: string): StarterPack | undefined {
  return STARTER_PACKS.find(pack => pack.id === id)
}

// Função helper para obter todos os packs de uma categoria
export function getStarterPacksByCategory(category: string): StarterPack[] {
  return STARTER_PACKS.filter(pack => 
    pack.category_suggestion.toLowerCase().includes(category.toLowerCase())
  )
}

// Função para obter estatísticas dos packs
export function getPacksStats() {
  return {
    totalPacks: STARTER_PACKS.length,
    totalItems: STARTER_PACKS.reduce((acc, pack) => acc + pack.items.length, 0),
    categories: [...new Set(STARTER_PACKS.map(p => p.category_suggestion))]
  }
}
