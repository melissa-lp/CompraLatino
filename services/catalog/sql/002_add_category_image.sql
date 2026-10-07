-- La página de Productos muestra una imagen por categoría 
alter table catalog.categories add column if not exists image_url text;
