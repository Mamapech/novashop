-- NovaShop database schema (PostgreSQL)
-- Running this file resets the database: it drops and recreates every table.

DROP TABLE IF EXISTS order_items, orders, product_variants, products, categories, brands, members CASCADE;
DROP TYPE IF EXISTS member_role, order_status;

CREATE TYPE member_role  AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

CREATE TABLE members (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    password_hash TEXT         NOT NULL,
    role          member_role  NOT NULL DEFAULT 'customer',
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE brands (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- A product is the "model" (e.g. Aurora Book 14).
-- What a customer actually buys is a variant of it (e.g. Midnight, 512GB).
CREATE TABLE products (
    id               SERIAL PRIMARY KEY,
    sku              VARCHAR(40)   NOT NULL UNIQUE,
    name             VARCHAR(200)  NOT NULL,
    tagline          VARCHAR(200)  NOT NULL DEFAULT '',
    description      TEXT          NOT NULL DEFAULT '',
    specs            JSON          NOT NULL DEFAULT '{}', -- JSON (not JSONB) keeps the order of the keys, e.g. {"Display": "14-inch", "Battery": "18 hours"}
    size_option_name VARCHAR(40),                         -- label for the second option, e.g. "Storage" or "Case size"
    price            NUMERIC(10,2) NOT NULL DEFAULT 0,    -- "From" price: lowest variant price, kept up to date by the API
    image_url        TEXT,                                -- main image: the first variant's image
    is_featured      BOOLEAN       NOT NULL DEFAULT false,
    brand_id         INTEGER       REFERENCES brands(id) ON DELETE SET NULL,
    category_id      INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
    id         SERIAL PRIMARY KEY,
    product_id INTEGER       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku        VARCHAR(60)   NOT NULL UNIQUE,
    color_name VARCHAR(60),
    color_hex  VARCHAR(7)    CHECK (color_hex ~ '^#[0-9a-fA-F]{6}$'),
    size_label VARCHAR(40),
    price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock      INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url  TEXT,
    sort_order INTEGER       NOT NULL DEFAULT 0,
    UNIQUE (product_id, color_name, size_label)
);

CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    member_id        INTEGER       NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status           order_status  NOT NULL DEFAULT 'pending',
    total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    shipping_name    VARCHAR(120)  NOT NULL,
    shipping_phone   VARCHAR(30)   NOT NULL,
    shipping_address TEXT          NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    INTEGER       REFERENCES products(id) ON DELETE SET NULL,
    variant_id    INTEGER       REFERENCES product_variants(id) ON DELETE SET NULL,
    -- Snapshot of what was bought, so old orders stay correct if the product changes or is deleted
    name          VARCHAR(200)  NOT NULL,
    variant_label VARCHAR(120)  NOT NULL DEFAULT '',
    image_url     TEXT,
    unit_price    NUMERIC(10,2) NOT NULL,
    quantity      INTEGER       NOT NULL CHECK (quantity > 0)
);

-- Indexes for the queries the API runs most
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand    ON products(brand_id);
CREATE INDEX idx_products_name     ON products (lower(name));
CREATE INDEX idx_variants_product  ON product_variants(product_id, sort_order);
CREATE INDEX idx_orders_member     ON orders(member_id, created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
