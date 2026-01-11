-- Promote NexusEmperor to admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a0bcc03e-81ff-4419-8c37-db399904c646', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;