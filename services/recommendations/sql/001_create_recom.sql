-- Esquema del servicio de Recomendaciones
-- Se alimenta del evento OrdenCreada que publica el servicio de Compras
create schema if not exists recom;

create table if not exists recom.purchase_history (
    id           bigint generated always as identity primary key,
    order_id     uuid not null,
    user_id      uuid not null,
    product_id   uuid not null,
    category_id  smallint not null,
    quantity     integer not null check (quantity > 0),
    purchased_at timestamptz not null,
    unique (order_id, product_id)             -- si el evento llega dos veces, no se duplica la compra
);

-- Recomendaciones personales: compras de un usuario
create index if not exists purchase_history_user_id_idx on recom.purchase_history (user_id);
-- "Lo más popular esta semana": compras recientes
create index if not exists purchase_history_purchased_at_idx on recom.purchase_history (purchased_at);

-- Cierra la tabla a la API automática de Supabase (anon/authenticated)
alter table recom.purchase_history enable row level security;
