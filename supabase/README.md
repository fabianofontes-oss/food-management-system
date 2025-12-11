# Supabase Database Setup

## Ordem de Execução

Execute os scripts SQL na seguinte ordem no **SQL Editor** do Supabase:

### 1. Schema Principal
Arquivo: `schema.sql`

Este arquivo contém:
- Todos os ENUMs
- Todas as tabelas
- Índices
- Foreign keys
- Triggers para updated_at
- Comentários de documentação

### 2. Dados de Exemplo (Opcional)
Arquivo: `seed.sql`

Contém dados de exemplo para:
- 1 Tenant (Rede FoodTech Brasil)
- 2 Lojas (Açaí da Praia e Burger House)
- Categorias e produtos
- Modificadores
- Mesas
- Cupons de exemplo

## Row Level Security (RLS)

Após executar o schema, você precisa configurar as políticas de segurança.

### Exemplo de Policies Básicas

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... repita para todas as tabelas

-- Policy para stores: usuários veem apenas lojas onde trabalham
CREATE POLICY "Users can view their stores"
ON stores FOR SELECT
USING (
  id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy para orders: usuários veem apenas pedidos de suas lojas
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

CREATE POLICY "Users can update orders in their stores"
ON orders FOR UPDATE
USING (
  store_id IN (
    SELECT store_id FROM store_users 
    WHERE user_id = auth.uid()
  )
);

-- Repita padrão similar para todas as tabelas
```

## Realtime

Habilite Realtime para as seguintes tabelas no painel do Supabase:

- `orders` - Para KDS em tempo real
- `order_events` - Para timeline ao vivo
- `internal_messages` - Para chat interno
- `deliveries` - Para rastreamento de entregas

## Storage

Crie os seguintes buckets no Supabase Storage:

1. **product-images**
   - Public: true
   - Allowed MIME types: image/*
   - Max file size: 5MB

2. **store-logos**
   - Public: true
   - Allowed MIME types: image/*
   - Max file size: 2MB

3. **store-banners**
   - Public: true
   - Allowed MIME types: image/*
   - Max file size: 5MB

## Funções Úteis

### Gerar Código de Pedido

```sql
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT AS $$
DECLARE
  letters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  letter CHAR(1);
  number INT;
BEGIN
  letter := substr(letters, floor(random() * 26 + 1)::int, 1);
  number := floor(random() * 999 + 1)::int;
  RETURN letter || '-' || lpad(number::text, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

### Calcular Total do Pedido

```sql
CREATE OR REPLACE FUNCTION calculate_order_total(order_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(oi.subtotal + COALESCE(mod_total, 0)), 0)
  INTO total
  FROM order_items oi
  LEFT JOIN (
    SELECT order_item_id, SUM(extra_price) as mod_total
    FROM order_item_modifiers
    GROUP BY order_item_id
  ) mods ON mods.order_item_id = oi.id
  WHERE oi.order_id = order_id_param;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;
```

## Verificação

Após executar tudo, verifique se:

1. ✅ Todas as tabelas foram criadas
2. ✅ Todos os índices estão presentes
3. ✅ RLS está habilitado
4. ✅ Policies estão criadas
5. ✅ Realtime está habilitado nas tabelas necessárias
6. ✅ Buckets de storage foram criados
7. ✅ Dados de exemplo foram inseridos (se executou seed.sql)

## Troubleshooting

### Erro: "relation already exists"
- Você já executou o schema antes. Delete as tabelas ou use um novo projeto.

### Erro: "permission denied"
- Verifique se está usando o SQL Editor com permissões de admin.

### RLS bloqueando queries
- Certifique-se de que as policies estão corretas e que o usuário está autenticado.

### Realtime não funciona
- Verifique se habilitou Realtime para a tabela no painel do Supabase.
- Verifique se as RLS policies permitem SELECT para o usuário.
