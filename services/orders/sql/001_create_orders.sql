-- Esquema del servicio de Compras
create schema if not exists orders;

create table if not exists orders.orders (
    id                    uuid primary key default gen_random_uuid(),
    user_id               uuid not null,
    status                text not null default 'pending'
                          check (status in ('pending', 'purchased', 'shipped', 'delivered', 'cancelled')),
    subtotal_jpy          integer not null check (subtotal_jpy > 0),
    exchange_rate         numeric(12, 6) not null check (exchange_rate > 0),   -- dólares por 1 yen al momento de comprar
    service_fee_usd       numeric(10, 2) not null default 0 check (service_fee_usd >= 0),
    total_usd             numeric(10, 2) not null check (total_usd > 0),
    
    shipping_full_name    text not null,
    shipping_phone        text not null,
    shipping_country      text not null,
    shipping_city         text not null,
    shipping_address      text not null,
    yauctions_purchase_id text unique,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

-- Historial de compras de un usuario
create index if not exists orders_user_id_created_at_idx on orders.orders (user_id, created_at desc);

create table if not exists orders.order_items (
    id             uuid primary key default gen_random_uuid(),
    order_id       uuid not null references orders.orders (id) on delete cascade,
    product_id     uuid not null,
    product_title  text not null,          
    unit_price_jpy integer not null check (unit_price_jpy > 0),   -- snapshot: precio al comprarlo
    quantity       integer not null check (quantity > 0),
    unique (order_id, product_id)             -- un producto aparece una sola vez por orden (con su cantidad)
);

create table if not exists orders.order_status_history (
    id         bigint generated always as identity primary key,
    order_id   uuid not null references orders.orders (id) on delete cascade,
    status     text not null
               check (status in ('pending', 'purchased', 'shipped', 'delivered', 'cancelled')),
    note       text,
    changed_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx on orders.order_status_history (order_id, changed_at);

create table if not exists orders.cart_items (
    user_id    uuid not null,
    product_id uuid not null,
    quantity   integer not null check (quantity between 1 and 99),
    added_at   timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, product_id)         -- cada producto aparece una vez en el carrito
);

-- Cierra las tablas a la API automática de Supabase (anon/authenticated)
alter table orders.orders               enable row level security;
alter table orders.order_items          enable row level security;
alter table orders.order_status_history enable row level security;
alter table orders.cart_items           enable row level security;
