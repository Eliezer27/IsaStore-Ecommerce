-- ============================================================
-- IsaStore — Esquema de base de datos (PostgreSQL 15+)
-- Diseñado a partir de las páginas de la plantilla IsaStore WEB2.1:
-- index, shop, product-details (x2), cart, checkout, account,
-- wishlist, blog, contact.
-- Compatible con Supabase / Postgres estándar.
--
-- Este archivo es la fuente de verdad del esquema. prisma/schema.prisma
-- se escribió a mano a partir de este SQL (ver ese archivo para el
-- modelo que usa la app). Si cambias algo aquí, refleja el cambio ahí.
-- ============================================================

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ------------------------------------------------------------
-- USUARIOS Y DIRECCIONES  (usados en account.html / checkout.html)
-- ------------------------------------------------------------
-- El id de esta tabla es el MISMO id que auth.users.id de Supabase Auth.
-- Un trigger (ver prisma/migrations/20260827060011_supabase_auth_sync)
-- mantiene esta fila en sync automáticamente: se crea sola cuando alguien
-- se registra en /cuenta o el admin invita a alguien del staff desde
-- /admin/usuarios. password_hash ya no se usa (las contraseñas viven en
-- auth.users, que administra Supabase) — queda la columna por compatibilidad.
create table users (
    id              uuid primary key default gen_random_uuid(),
    email           varchar(255) not null unique,
    password_hash   varchar(255),              -- sin uso: las contraseñas viven en auth.users
    first_name      varchar(100),
    last_name       varchar(100),
    phone           varchar(30),
    role            varchar(20) not null default 'customer', -- customer | staff | admin
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table addresses (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references users(id) on delete cascade,
    label           varchar(50),               -- "Casa", "Oficina"
    first_name      varchar(100),
    last_name       varchar(100),
    country         varchar(100) not null default 'Nicaragua',
    city            varchar(100),
    postal_code     varchar(20),
    phone           varchar(30),
    line1           varchar(255),
    notes           text,
    lat             double precision,          -- para Google Maps / geocoding
    lng             double precision,
    is_default      boolean not null default false,
    created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATALOGO  (categorías vistas en el mega-menú: Ropa, Cadenas y
-- Llaveros, Peluches y Juguetes, Collares, Maquillaje, Accesorios)
-- ------------------------------------------------------------
create table categories (
    id              uuid primary key default gen_random_uuid(),
    parent_id       uuid references categories(id) on delete set null,
    name            varchar(100) not null,
    slug            varchar(120) not null unique,
    image_url       varchar(500),
    position        int not null default 0,
    is_active       boolean not null default true
);

create table products (
    id                  uuid primary key default gen_random_uuid(),
    category_id         uuid references categories(id) on delete set null,
    name                varchar(200) not null,
    slug                varchar(220) not null unique,
    sku                 varchar(60) unique,
    short_description   varchar(500),
    description         text,
    price               numeric(10,2) not null,
    compare_at_price    numeric(10,2),          -- precio tachado / oferta
    currency            varchar(3) not null default 'NIO',
    stock               int not null default 0,
    is_active           boolean not null default true,
    is_featured         boolean not null default false,
    rating_avg          numeric(2,1) default 0,
    rating_count        int default 0,
    attributes          jsonb default '{}',     -- material, marca, etc.
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table product_images (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid not null references products(id) on delete cascade,
    url             varchar(500) not null,
    alt             varchar(200),
    position        int not null default 0
);

-- Variantes (talla / color) — opcional, activar si se venden variantes
create table product_variants (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid not null references products(id) on delete cascade,
    size            varchar(30),
    color           varchar(30),
    sku             varchar(60) unique,
    price_override  numeric(10,2),
    stock           int not null default 0
);

create table reviews (
    id              uuid primary key default gen_random_uuid(),
    product_id      uuid not null references products(id) on delete cascade,
    user_id         uuid references users(id) on delete set null,
    rating          smallint not null check (rating between 1 and 5),
    title           varchar(200),
    comment         text,
    is_approved     boolean not null default false,
    created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CARRITO Y DESEOS  (cart.html / wishlist.html)
-- ------------------------------------------------------------
create table carts (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references users(id) on delete cascade,
    session_id      varchar(100),              -- para invitados sin cuenta
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table cart_items (
    id              uuid primary key default gen_random_uuid(),
    cart_id         uuid not null references carts(id) on delete cascade,
    product_id      uuid not null references products(id),
    variant_id      uuid references product_variants(id),
    quantity        int not null default 1 check (quantity > 0),
    unit_price      numeric(10,2) not null,
    created_at      timestamptz not null default now()
);

create table wishlists (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references users(id) on delete cascade,
    product_id      uuid not null references products(id) on delete cascade,
    created_at      timestamptz not null default now(),
    unique (user_id, product_id)
);

-- ------------------------------------------------------------
-- CUPONES  (visto en cart.html)
-- ------------------------------------------------------------
create table coupons (
    id              uuid primary key default gen_random_uuid(),
    code            varchar(50) not null unique,
    type            varchar(20) not null,      -- percent | fixed
    value           numeric(10,2) not null,
    min_order_total numeric(10,2) default 0,
    usage_limit     int,
    used_count      int not null default 0,
    expires_at      timestamptz,
    is_active       boolean not null default true
);

-- ------------------------------------------------------------
-- PEDIDOS Y PAGOS  (checkout.html: transferencia, cheque, contra
-- entrega -> se agrega PayPal como método adicional)
-- ------------------------------------------------------------
create table orders (
    id                  uuid primary key default gen_random_uuid(),
    order_number        varchar(30) not null unique,
    user_id             uuid references users(id) on delete set null,
    status              varchar(30) not null default 'pending',
    -- pending | paid | processing | shipped | delivered | cancelled | refunded
    subtotal            numeric(10,2) not null,
    shipping_total      numeric(10,2) not null default 0,
    tax_total           numeric(10,2) not null default 0,
    discount_total      numeric(10,2) not null default 0,
    total               numeric(10,2) not null,
    currency            varchar(3) not null default 'NIO',
    coupon_id           uuid references coupons(id),
    shipping_address_id uuid references addresses(id),
    billing_address_id  uuid references addresses(id),
    payment_method      varchar(30) not null,  -- bank_transfer | check | cod | paypal
    payment_status      varchar(20) not null default 'unpaid',
    -- unpaid | paid | failed | refunded
    customer_notes      text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table order_items (
    id              uuid primary key default gen_random_uuid(),
    order_id        uuid not null references orders(id) on delete cascade,
    product_id      uuid references products(id),
    variant_id      uuid references product_variants(id),
    product_name    varchar(200) not null,      -- snapshot al momento de compra
    quantity        int not null,
    unit_price      numeric(10,2) not null,
    total            numeric(10,2) not null
);

-- Pagos: soporta PayPal y otros métodos futuros (tarjeta, etc.)
create table payments (
    id                  uuid primary key default gen_random_uuid(),
    order_id            uuid not null references orders(id) on delete cascade,
    provider            varchar(30) not null,   -- paypal | manual
    provider_payment_id varchar(120),           -- PayPal order/capture id
    amount              numeric(10,2) not null,
    currency            varchar(3) not null default 'USD',
    status              varchar(20) not null,   -- created | approved | completed | failed
    raw_response        jsonb,                  -- respuesta cruda de la API para auditoría
    created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- UBICACIONES DE TIENDA  (contact.html + Google Maps)
-- ------------------------------------------------------------
create table store_locations (
    id              uuid primary key default gen_random_uuid(),
    name            varchar(150) not null,
    address         varchar(255) not null,
    lat             double precision not null,
    lng             double precision not null,
    phone           varchar(30),
    email           varchar(150),
    opening_hours   jsonb,                      -- { "lun-vie": "9am-6pm", ... }
    is_main         boolean not null default false
);

-- ------------------------------------------------------------
-- BLOG Y NEWSLETTER  (blog.html / footer newsletter)
-- ------------------------------------------------------------
create table blog_posts (
    id              uuid primary key default gen_random_uuid(),
    title           varchar(200) not null,
    slug            varchar(220) not null unique,
    cover_image     varchar(500),
    excerpt         varchar(500),
    content         text,
    author_name     varchar(100),
    is_published    boolean not null default false,
    published_at    timestamptz,
    created_at      timestamptz not null default now()
);

create table newsletter_subscribers (
    id              uuid primary key default gen_random_uuid(),
    email           varchar(255) not null unique,
    subscribed_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES RECOMENDADOS
-- ------------------------------------------------------------
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_product_images_product on product_images(product_id);
create index idx_cart_items_cart on cart_items(cart_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_reviews_product on reviews(product_id);
create index idx_addresses_user on addresses(user_id);
