-- Create product_images table for multiple images per product
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product images" 
ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Admins can insert product images" 
ON public.product_images FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images" 
ON public.product_images FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images" 
ON public.product_images FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Promote Umang keshei (6202521008) to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('f3129284-a913-471f-8342-24aa5cda64ca', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;