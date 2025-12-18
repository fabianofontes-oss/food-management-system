-- Migration: Add public_profile and menu_theme to stores
-- Purpose: Enable public menu theming and store public profile (hours, address, social media)

-- Add public_profile column (public info: hours, address, social media)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS public_profile jsonb DEFAULT '{}'::jsonb;

-- Add menu_theme column (theme settings: preset, card variant, colors)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS menu_theme jsonb DEFAULT '{}'::jsonb;

-- Comment columns
COMMENT ON COLUMN public.stores.public_profile IS 'Public store information: name, slogan, address, phone, social media, business hours';
COMMENT ON COLUMN public.stores.menu_theme IS 'Menu theme settings: preset (layout), cardVariant, colors, layout options';

-- RLS: SELECT on stores remains public for active stores (already exists)
-- RLS: UPDATE on menu_theme and public_profile only for authenticated users with store access

-- Drop existing UPDATE policy if it exists and recreate with new columns
DROP POLICY IF EXISTS "Users can update their own store" ON public.stores;

-- Allow authenticated users to update their store (including new theme fields)
CREATE POLICY "Users can update their own store"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT store_id 
    FROM public.user_stores 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT store_id 
    FROM public.user_stores 
    WHERE user_id = auth.uid()
  )
);
