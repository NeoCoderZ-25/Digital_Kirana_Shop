-- Add coordinates to addresses table
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add delivery_boy role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_boy';

-- Add delivery fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_delivery_boy UUID,
ADD COLUMN IF NOT EXISTS delivery_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- RLS for delivery boys to see assigned orders
CREATE POLICY "Delivery boys can view assigned orders"
ON public.orders FOR SELECT
USING (assigned_delivery_boy = auth.uid());

-- RLS for delivery boys to update assigned orders
CREATE POLICY "Delivery boys can update assigned orders"
ON public.orders FOR UPDATE
USING (assigned_delivery_boy = auth.uid());

-- RLS for delivery boys to view order items of assigned orders
CREATE POLICY "Delivery boys can view assigned order items"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.assigned_delivery_boy = auth.uid()
));

-- RLS for delivery boys to view addresses for their assigned orders
CREATE POLICY "Delivery boys can view order addresses"
ON public.addresses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.address_id = addresses.id 
  AND orders.assigned_delivery_boy = auth.uid()
));

-- RLS for delivery boys to view customer profiles for their orders
CREATE POLICY "Delivery boys can view customer profiles for orders"
ON public.profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.user_id = profiles.user_id 
  AND orders.assigned_delivery_boy = auth.uid()
));

-- Allow admins to manage user_roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles (for delete user functionality)
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));