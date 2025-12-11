-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
  ('Dal & Pulses', 'Lentils, beans, and pulses'),
  ('Rice & Grains', 'Rice, wheat, and other grains'),
  ('Spices & Masala', 'Ground spices and masala blends'),
  ('Cooking Oil', 'Edible oils for cooking'),
  ('Atta & Flour', 'Wheat flour and other flours'),
  ('Sugar & Salt', 'Sugar, salt, and sweeteners'),
  ('Dry Fruits', 'Nuts and dried fruits'),
  ('Snacks', 'Namkeen, chips, and snacks')
ON CONFLICT DO NOTHING;

-- Insert sample products (using subqueries for category_id)
INSERT INTO public.products (name, description, price, category_id, image_url, is_featured, in_stock, order_count) VALUES
  ('Toor Dal', 'Premium quality toor dal, 1kg pack', 145, (SELECT id FROM categories WHERE name = 'Dal & Pulses'), 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400', true, true, 120),
  ('Moong Dal', 'Yellow moong dal, split and washed, 1kg', 135, (SELECT id FROM categories WHERE name = 'Dal & Pulses'), 'https://images.unsplash.com/photo-1612257416648-ee7a6c533b4f?w=400', false, true, 85),
  ('Chana Dal', 'Bengal gram dal, premium quality, 1kg', 125, (SELECT id FROM categories WHERE name = 'Dal & Pulses'), 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400', false, true, 65),
  ('Basmati Rice', 'Long grain aged basmati rice, 5kg', 425, (SELECT id FROM categories WHERE name = 'Rice & Grains'), 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', true, true, 200),
  ('Sona Masoori Rice', 'Premium sona masoori rice, 5kg', 320, (SELECT id FROM categories WHERE name = 'Rice & Grains'), 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400', false, true, 150),
  ('Haldi Powder', 'Pure turmeric powder, 200g', 45, (SELECT id FROM categories WHERE name = 'Spices & Masala'), 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400', true, true, 180),
  ('Red Chilli Powder', 'Hot red chilli powder, 200g', 55, (SELECT id FROM categories WHERE name = 'Spices & Masala'), 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', false, true, 160),
  ('Garam Masala', 'Aromatic blend of spices, 100g', 85, (SELECT id FROM categories WHERE name = 'Spices & Masala'), 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400', true, true, 140),
  ('Mustard Oil', 'Pure kachi ghani mustard oil, 1L', 185, (SELECT id FROM categories WHERE name = 'Cooking Oil'), 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', false, true, 95),
  ('Sunflower Oil', 'Refined sunflower oil, 1L', 145, (SELECT id FROM categories WHERE name = 'Cooking Oil'), 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400', true, true, 110),
  ('Whole Wheat Atta', 'Fresh chakki atta, 5kg', 245, (SELECT id FROM categories WHERE name = 'Atta & Flour'), 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', true, true, 175),
  ('Besan', 'Gram flour for pakoras, 500g', 65, (SELECT id FROM categories WHERE name = 'Atta & Flour'), 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400', false, true, 70),
  ('White Sugar', 'Refined white sugar, 1kg', 48, (SELECT id FROM categories WHERE name = 'Sugar & Salt'), 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400', false, true, 220),
  ('Rock Salt', 'Sendha namak, 500g', 35, (SELECT id FROM categories WHERE name = 'Sugar & Salt'), 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400', false, true, 55),
  ('Almonds', 'California almonds, 250g', 285, (SELECT id FROM categories WHERE name = 'Dry Fruits'), 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400', true, true, 90),
  ('Cashews', 'Premium whole cashews, 250g', 325, (SELECT id FROM categories WHERE name = 'Dry Fruits'), 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400', true, true, 85),
  ('Bhujia', 'Crispy besan bhujia, 400g', 95, (SELECT id FROM categories WHERE name = 'Snacks'), 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', false, true, 130),
  ('Mixture', 'Classic Indian mixture, 400g', 85, (SELECT id FROM categories WHERE name = 'Snacks'), 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400', false, true, 115);