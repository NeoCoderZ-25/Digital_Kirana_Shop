-- Create wallets table
CREATE TABLE public.wallets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallet"
ON public.wallets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallets"
ON public.wallets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,
    reference_type TEXT CHECK (reference_type IN ('order', 'refund', 'topup', 'points_conversion', 'admin_adjustment')),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own wallet transactions"
ON public.wallet_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallet transactions"
ON public.wallet_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create loyalty_rules table
CREATE TABLE public.loyalty_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('earn', 'redeem')),
    points_per_currency NUMERIC DEFAULT 1,
    currency_per_point NUMERIC DEFAULT 0.01,
    min_points_to_convert INTEGER DEFAULT 100,
    return_window_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loyalty_rules
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_rules
CREATE POLICY "Anyone can view active loyalty rules"
ON public.loyalty_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage loyalty rules"
ON public.loyalty_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add loyalty_points column to products
ALTER TABLE public.products ADD COLUMN loyalty_points INTEGER DEFAULT 0;

-- Add wallet and return columns to orders
ALTER TABLE public.orders ADD COLUMN wallet_payment NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN can_return_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN return_status TEXT CHECK (return_status IN ('requested', 'completed', 'rejected'));

-- Insert default loyalty rules
INSERT INTO public.loyalty_rules (name, rule_type, points_per_currency, currency_per_point, min_points_to_convert, return_window_minutes, is_active)
VALUES 
    ('Default Earning Rule', 'earn', 1, 0, 100, 30, true),
    ('Default Redemption Rule', 'redeem', 0, 0.01, 100, 30, true);

-- Create trigger for wallet updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create trigger for loyalty_rules updated_at
CREATE TRIGGER update_loyalty_rules_updated_at
BEFORE UPDATE ON public.loyalty_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();