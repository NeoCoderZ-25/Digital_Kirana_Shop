-- Create order_status_history table for tracking status changes
CREATE TABLE public.order_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage order status history
CREATE POLICY "Admins can manage order status history"
ON public.order_status_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own order status history
CREATE POLICY "Users can view own order status history"
ON public.order_status_history
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id
    AND orders.user_id = auth.uid()
));

-- Enable realtime for order_status_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;

-- Create a policy for admins to select from profiles (for customer management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));