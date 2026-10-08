const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

app.get('/api/sync-yauctions', async (req, res) => {
  try {
    console.log('Obteniendo productos del proveedor japonés...');
    const response = await fetch('http://localhost:3006/api/external-products');
    const products = await response.json();
    
    console.log(`Preparando la inserción de ${products.length} productos...`);
    
    await pool.query('BEGIN');
    
    let insertados = 0;

    for (const prod of products) {
      const productQuery = `
        INSERT INTO catalog.products 
        (yauctions_item_id, category_id, title, description, price_jpy, stock, condition) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (yauctions_item_id) DO NOTHING
        RETURNING id;
      `;
      
      const productValues = [
        prod.id, prod.category_id, prod.title, prod.description, 
        prod.price_jpy, prod.stock, prod.condition
      ];
      
      const result = await pool.query(productQuery, productValues);
      
      if (result.rows.length > 0) {
        const newProductId = result.rows[0].id; 
        console.log(`Guardado: ${prod.title}`);
        insertados++;
        
        let position = 0;
        for (const imageUrl of prod.images) {
          const imageQuery = `
            INSERT INTO catalog.product_images (product_id, url, position)
            VALUES ($1, $2, $3)
          `;
          await pool.query(imageQuery, [newProductId, imageUrl, position]);
          position++;
        }
      } else {
         console.log(`Ya existía, se omitió: ${prod.title}`);
      }
    }
    
    await pool.query('COMMIT');
    
    res.json({ 
      mensaje: 'Sincronización exitosa',
      productos_nuevos_insertados: insertados 
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error en la sincronización:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { q } = req.query; 

    let query = `
      SELECT 
        p.id, 
        p.title, 
        p.description, 
        p.price_jpy, 
        p.stock, 
        p.condition, 
        c.name as category_name,
        i.url as image_url
      FROM catalog.products p
      JOIN catalog.categories c ON p.category_id = c.id
      LEFT JOIN catalog.product_images i ON p.id = i.product_id AND i.position = 0
      WHERE p.is_active = true
    `;
    
    const values = [];

    if (q) {
      query += ` AND (p.title ILIKE $1 OR c.name ILIKE $1)`;
      values.push(`%${q}%`); 
    }

    query += ` ORDER BY p.created_at DESC;`;
    
    const result = await pool.query(query, values);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.status(500).json({ error: 'Fallo al obtener el catálogo' });
  }
});


app.get('/api/admin/metrics', async (req, res) => {
  try {
    const [totalProducts, stockValue, activeCategories] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM catalog.products'),
      
      pool.query('SELECT SUM(stock) as total_items, SUM(price_jpy * stock) as total_value FROM catalog.products'),
      
      pool.query('SELECT COUNT(DISTINCT category_id) as active_cats FROM catalog.products')
    ]);

    res.json({
      total_products: parseInt(totalProducts.rows[0].count),
      total_items_stock: parseInt(stockValue.rows[0].total_items) || 0,
      total_inventory_value_jpy: parseInt(stockValue.rows[0].total_value) || 0,
      active_categories: parseInt(activeCategories.rows[0].active_cats)
    });

  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    res.status(500).json({ error: 'Fallo al obtener métricas' });
  }
});

app.listen(PORT, () => {
  console.log(`[Catálogo] Servicio corriendo en http://localhost:${PORT}`);
});