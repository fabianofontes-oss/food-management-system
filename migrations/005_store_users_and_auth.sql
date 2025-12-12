-- Migration 005: Store Users and Auth Model
-- Implements permission model for multi-tenant access control

-- Create role enum
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');

-- Create store_users table
CREATE TABLE IF NOT EXISTS store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
  -- Ensure user can only have one role per store
  UNIQUE(store_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_store_users_user_id ON store_users(user_id);
CREATE INDEX idx_store_users_store_id ON store_users(store_id);

-- Enable RLS on store_users
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own store memberships
CREATE POLICY "Users can read their own store memberships"
  ON store_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Store owners can manage store users
CREATE POLICY "Store owners can manage store users"
  ON store_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM store_users su
      WHERE su.store_id = store_users.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );

-- Function to check if user has access to store
CREATE OR REPLACE FUNCTION user_has_store_access(p_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM store_users
    WHERE store_id = p_store_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stores
CREATE OR REPLACE FUNCTION get_user_stores()
RETURNS TABLE (
  store_id UUID,
  store_slug TEXT,
  store_name TEXT,
  user_role user_role
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.slug,
    s.name,
    su.role
  FROM stores s
  INNER JOIN store_users su ON s.id = su.store_id
  WHERE su.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger for store_users
CREATE TRIGGER update_store_users_updated_at
  BEFORE UPDATE ON store_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
