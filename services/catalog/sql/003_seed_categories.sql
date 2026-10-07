-- Categorías de CompraLatino
insert into catalog.categories (name, slug) values
    ('Audio',            'audio'),
    ('Periféricos',      'perifericos'),
    ('Energía',          'energia'),
    ('Casa Inteligente', 'casa-inteligente'),
    ('Zona Gaming',      'zona-gaming'),
    ('Celulares',        'celulares'),
    ('Wearables',        'wearables')
on conflict (slug) do nothing;
