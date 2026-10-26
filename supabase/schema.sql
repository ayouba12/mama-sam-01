-- ====================================================================
-- MAMA SAM AFRICAN & CARIBBEAN SUPERMARKET - SUPABASE POSTGRESQL SCHEMA
-- ====================================================================
-- Version: 1.0.0
-- Compatible with: Supabase PostgreSQL (with PostgREST & Auth)
-- Features: Row Level Security (RLS), RBAC, In-Store Pickup, Storage Policies
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 2. User Roles Table (Admin Role-Based Access Control)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper security definer function to check if the current requester is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'
  );
$$;

-- RLS for user_roles: only admins can view or modify roles; self-promotion is blocked
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "user_roles_modify_admin" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 3. Categories Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  summary TEXT,
  image TEXT,
  item_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can read categories; only admins can insert/update/delete
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 4. Products Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'Importato',
  sub_category TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price > 0),
  package_size TEXT NOT NULL DEFAULT '1 pz',
  image TEXT NOT NULL,
  image_status TEXT NOT NULL DEFAULT 'verified' CHECK (image_status IN ('verified', 'needs_review', 'missing')),
  gallery TEXT[] DEFAULT '{}',
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sales_rank INTEGER DEFAULT 0,
  ingredients TEXT,
  allergen_info TEXT,
  dietary_info JSONB DEFAULT '{}'::jsonb,
  sku TEXT,
  is_new_arrival BOOLEAN DEFAULT false,
  is_discounted BOOLEAN DEFAULT false,
  discount_active BOOLEAN DEFAULT true,
  discount_start_date TIMESTAMPTZ,
  discount_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can read all active products; admins have full CRUD
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 5. Orders Table (In-Store Pickup Only)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'collected', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  pickup_time_preference TEXT NOT NULL,
  customer_note TEXT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Pay at Store (Cash / Card / Satispay)',
  staff_notes TEXT,
  status_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated customers can create their own order
CREATE POLICY "orders_insert_checkout" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authorized administrators can view all orders (prevents customers from viewing other customers' personal info)
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only administrators can update order status or delete orders
CREATE POLICY "orders_modify_admin" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "orders_delete_admin" ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- 6. Order Items Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  package_size TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers can insert items during checkout
CREATE POLICY "order_items_insert_checkout" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can inspect order items
CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- 7. Store Settings Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  announcement TEXT NOT NULL,
  announcement_active BOOLEAN NOT NULL DEFAULT true,
  store_name TEXT NOT NULL,
  address TEXT NOT NULL,
  google_maps_url TEXT NOT NULL,
  phone1 TEXT NOT NULL,
  phone2 TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  hours_mon_sat TEXT NOT NULL,
  hours_sun TEXT NOT NULL,
  pickup_estimated_minutes INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_public_read" ON public.store_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "settings_admin_update" ON public.store_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 8. Storage Bucket Policies: 'product-images'
-- --------------------------------------------------------------------
-- Create storage bucket if storage schema is available
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  8388608, -- 8MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

-- Storage RLS: Public can view images; only admins can upload/update/delete
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- --------------------------------------------------------------------
-- 9. Function to decrement product stock during order placement
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      is_available = CASE WHEN stock - p_quantity <= 0 THEN false ELSE is_available END,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;
END;
$$;
