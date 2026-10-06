-- Esquema del servicio de Catálogo
create schema if not exists catalog;

create table if not exists catalog.categories (
    id         smallint generated always as identity primary key,
    name       text not null unique,
    slug       text not null unique,
    created_at timestamptz not null default now()
);

create table if not exists catalog.products (
    id                uuid primary key default gen_random_uuid(),
    yauctions_item_id text not null unique,   -- id del producto en YAuctions (mock)
    category_id       smallint not null references catalog.categories (id),
    title             text not null,
    description       text not null default '',
    price_jpy         integer not null check (price_jpy > 0),
    stock             integer not null default 0 check (stock >= 0),
    condition         text not null check (condition in ('new', 'used')),
    is_active         boolean not null default true,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);


create index if not exists products_category_id_idx on catalog.products (category_id);

create table if not exists catalog.product_images (
    id         uuid primary key default gen_random_uuid(),
    product_id uuid not null references catalog.products (id) on delete cascade,
    url        text not null,
    position   smallint not null default 0 check (position >= 0),   -- 0 = imagen principal
    created_at timestamptz not null default now(),
    unique (product_id, position)
);

-- Cierra las tablas a la API automática de Supabase (anon/authenticated)
alter table catalog.categories     enable row level security;
alter table catalog.product_images enable row level security;
alter table catalog.products       enable row level security;