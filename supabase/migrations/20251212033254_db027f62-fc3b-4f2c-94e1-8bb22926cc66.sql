-- Create payment QR codes table for admin-managed UPI QR codes
CREATE TABLE public.payment_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  upi_id TEXT,
  qr_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_qr_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active QR codes
CREATE POLICY "Anyone can view active QR codes"
ON public.payment_qr_codes
FOR SELECT
USING (is_active = true);

-- Admins can manage QR codes
CREATE POLICY "Admins can manage QR codes"
ON public.payment_qr_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add enhanced address fields
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'home';