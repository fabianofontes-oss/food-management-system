-- Migration: Add payment_status to orders table
-- Description: Add payment status tracking for manual payment confirmation

-- Add payment_status column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';

-- Add index for filtering by payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(store_id, payment_status);

-- Add comment
COMMENT ON COLUMN orders.payment_status IS 'Status do pagamento: pending, paid, cancelled';

-- Update existing orders to have payment_status based on payment_method
-- PIX orders start as pending, others can be marked as paid by default if needed
UPDATE orders 
SET payment_status = 'pending'
WHERE payment_status IS NULL;
