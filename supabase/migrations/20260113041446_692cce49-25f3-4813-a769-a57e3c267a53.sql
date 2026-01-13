-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review images table
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty settings (single row config)
CREATE TABLE public.loyalty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_per_rupee NUMERIC DEFAULT 10,
  point_value NUMERIC DEFAULT 0.25,
  min_redeem_points INTEGER DEFAULT 100,
  max_redeem_percentage NUMERIC DEFAULT 50,
  signup_bonus INTEGER DEFAULT 50,
  referral_bonus INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User loyalty balance
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty transactions
CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'referral', 'expired', 'adjustment')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add discount columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Reviews RLS policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own reviews" ON public.reviews
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create reviews" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Review images RLS policies
CREATE POLICY "Anyone can view review images" ON public.review_images
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add review images" ON public.review_images
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete own review images" ON public.review_images
FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can manage review images" ON public.review_images
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupons RLS policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Coupon usage RLS policies
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coupon usage" ON public.coupon_usage
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Loyalty settings RLS policies
CREATE POLICY "Anyone can view loyalty settings" ON public.loyalty_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage loyalty settings" ON public.loyalty_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Loyalty points RLS policies
CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all loyalty points" ON public.loyalty_points
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Loyalty transactions RLS policies
CREATE POLICY "Users can view own loyalty transactions" ON public.loyalty_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all loyalty transactions" ON public.loyalty_transactions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for review images
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review images
CREATE POLICY "Anyone can view review images" ON storage.objects
FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own review images" ON storage.objects
FOR DELETE USING (bucket_id = 'review-images' AND auth.role() = 'authenticated');

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (points_per_rupee, point_value, min_redeem_points, max_redeem_percentage, signup_bonus, referral_bonus, is_active)
VALUES (10, 0.25, 100, 50, 50, 100, true)
ON CONFLICT DO NOTHING;