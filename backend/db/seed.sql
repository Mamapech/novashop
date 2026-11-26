-- Sample data so the shop is not empty on first run.

INSERT INTO brands (name) VALUES
  ('Aurora'), ('Kinetic'), ('Lumen'), ('Northwind'), ('Pixelcraft');

INSERT INTO categories (name, slug) VALUES
  ('Laptops', 'laptops'),
  ('Audio', 'audio'),
  ('Accessories', 'accessories'),
  ('Smart Home', 'smart-home'),
  ('Wearables', 'wearables');

INSERT INTO products (sku, name, description, price, stock, is_featured, brand_id, category_id) VALUES
  ('LAP-001', 'Aurora Book 14',          'Lightweight 14-inch laptop with 16 GB RAM, 512 GB SSD and an all-day battery.', 28900, 12, true,  1, 1),
  ('LAP-002', 'Kinetic Pro 16',          '16-inch performance laptop with a dedicated GPU for coding, design and gaming.', 45900, 6,  true,  2, 1),
  ('LAP-003', 'Pixelcraft Studio 13',    'Compact creator laptop with a color-accurate OLED display.',                      36500, 8,  false, 5, 1),
  ('AUD-001', 'Lumen Buds Pro',          'Wireless earbuds with active noise cancellation and 30-hour battery life.',       3490,  40, true,  3, 2),
  ('AUD-002', 'Northwind Studio Headphones', 'Over-ear headphones tuned for long listening sessions.',                     5990,  25, false, 4, 2),
  ('AUD-003', 'Aurora Mini Speaker',     'Pocket-size Bluetooth speaker, water resistant (IP67).',                          1290,  60, false, 1, 2),
  ('ACC-001', 'Kinetic Mechanical Keyboard', 'Hot-swappable 75% keyboard with tactile switches.',                         2790,  30, true,  2, 3),
  ('ACC-002', 'Lumen Wireless Mouse',    'Ergonomic silent-click mouse with USB-C charging.',                               890,   80, false, 3, 3),
  ('ACC-003', 'Northwind USB-C Hub 7-in-1', 'HDMI 4K, 3x USB-A, SD card reader and 100 W pass-through charging.',          1190,  45, false, 4, 3),
  ('SMH-001', 'Pixelcraft Smart Bulb (2-pack)', 'Color smart bulbs controlled from your phone or by voice.',               690,   100, false, 5, 4),
  ('SMH-002', 'Aurora Home Camera',      '2K indoor security camera with night vision and motion alerts.',                  1590,  35, true,  1, 4),
  ('WEA-001', 'Kinetic Fit Band',        'Fitness band with heart rate, sleep tracking and 14-day battery.',                1490,  50, false, 2, 5),
  ('WEA-002', 'Lumen Watch S',           'Smartwatch with AMOLED display, GPS and contactless payments.',                   7990,  15, true,  3, 5),
  ('WEA-003', 'Northwind Ring',          'Smart ring that tracks sleep and readiness, no screen needed.',                   9900,  0,  false, 4, 5);

-- Product pictures live in backend/public/images/products, named after the SKU
UPDATE products SET image_url = '/images/products/' || lower(sku) || '.svg';
