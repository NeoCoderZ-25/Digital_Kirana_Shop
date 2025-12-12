-- Enable realtime for orders table for push notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;