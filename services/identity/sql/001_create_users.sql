create schema if not exists identity;

create table if not exists identity.users (
    id            uuid primary key default gen_random_uuid(),
    email         text not null,
    password_hash text not null,
    full_name     text not null,
    role          text not null default 'customer' check (role in ('customer', 'admin')),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create unique index if not exists users_email_lower_key on identity.users (lower(email));
