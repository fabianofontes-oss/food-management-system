CREATE SEQUENCE IF NOT EXISTS public.order_code_seq;

CREATE OR REPLACE FUNCTION public.generate_order_code(p_prefix text DEFAULT 'A')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next bigint;
BEGIN
  v_next := nextval('public.order_code_seq');
  RETURN upper(left(coalesce(nullif(trim(p_prefix), ''), 'A'), 1)) || lpad(v_next::text, 6, '0');
END;
$$;

 ALTER TABLE public.orders
 ALTER COLUMN code SET DEFAULT public.generate_order_code('A');

 GRANT USAGE, SELECT ON SEQUENCE public.order_code_seq TO anon, authenticated;
 GRANT EXECUTE ON FUNCTION public.generate_order_code(text) TO anon, authenticated;
