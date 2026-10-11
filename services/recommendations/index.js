import express from 'express';
import sql from './db.js';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Ruta para comprobar que el servicio funciona
app.get('/health', async (req, res) => {
    try {
        const result = await sql`SELECT NOW() AS fecha`;

        res.json({
            status: 'ok',
            service: 'recommendations',
            database: 'connected',
            timestamp: result[0].fecha
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: 'error',
            message: 'Error al conectar con la base de datos'
        });
    }
});

// Obtener los productos más populares de los últimos 7 días
app.get('/recommendations/popular', async (req, res) => {
    try {
        const products = await sql`
      SELECT
        product_id,
        SUM(quantity)::integer AS total_sold,
        COUNT(DISTINCT order_id)::integer AS total_orders
      FROM recom.purchase_history
      WHERE purchased_at >= NOW() - INTERVAL '7 days'
      GROUP BY product_id
      ORDER BY total_sold DESC, total_orders DESC, product_id
      LIMIT 10
    `;

        res.json({
            status: 'ok',
            type: 'popular',
            period: 'last_7_days',
            total: products.length,
            products
        });

    } catch (error) {
        console.error(
            '[Recomendaciones] Error:', error.message
        );

        res.status(500).json({
            status: 'error',
            message: 'No se pudieron obtener los productos populares'
        });
    }
});

// Consultar estadísticas del historial de compras
app.get('/recommendations/stats', async (req, res) => {
    try {
        const result = await sql`
      SELECT
        COUNT(*)::integer AS total_purchases,
        COUNT(DISTINCT user_id)::integer AS total_users,
        COUNT(DISTINCT product_id)::integer AS total_products,
        MAX(purchased_at) AS last_purchase
      FROM recom.purchase_history
    `;

        res.json({
            status: 'ok',
            stats: result[0]
        });

    } catch (error) {
        console.error('[Recomendaciones] Error:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'No se pudieron obtener las estadísticas'
        });
    }
});

// Recibir eventos de compras confirmadas
app.post('/events/order-created', async (req, res) => {
    try {
        const event = req.body;

        if (
            event.type !== 'OrdenCreada' ||
            !event.orderId ||
            !event.userId ||
            !event.purchasedAt ||
            !Array.isArray(event.items) ||
            event.items.length === 0
        ) {
            return res.status(400).json({
                error: 'Evento de compra inválido'
            });
        }

        const orderId = event.orderId;
        const userId = event.userId;
        const purchasedAt = event.purchasedAt;

        await sql.begin(async (tx) => {
            for (const item of event.items) {
                if (
                    !item.productId ||
                    !Number.isInteger(item.categoryId) ||
                    !Number.isInteger(item.quantity) ||
                    item.quantity <= 0
                ) {
                    throw new Error('Producto inválido en el evento');
                }

                await tx`
          INSERT INTO recom.purchase_history
            (order_id, user_id, product_id,
             category_id, quantity, purchased_at)
          VALUES
            (${orderId}, ${userId}, ${item.productId},
             ${item.categoryId}, ${item.quantity}, ${purchasedAt})
          ON CONFLICT (order_id, product_id)
          DO NOTHING
        `;
            }
        });

        res.status(200).json({
            status: 'ok',
            message: 'Evento de compra procesado'
        });

    } catch (error) {
        console.error(
            '[Recomendaciones] Error al procesar compra:',
            error.message
        );

        res.status(500).json({
            status: 'error',
            message: 'No se pudo procesar el evento'
        });
    }
});

// Obtener productos relacionados por categoría
app.get('/recommendations/related/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const UUID_REGEX =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!UUID_REGEX.test(productId)) {
            return res.status(400).json({
                error: 'ID de producto inválido'
            });
        }

        const catalogUrl = process.env.CATALOG_URL;

        if (!catalogUrl) {
            return res.status(503).json({
                error: 'Catálogo no configurado'
            });
        }

        // Consultar el producto original
        const response = await fetch(
            `${catalogUrl}/internal/products?ids=${productId}`,
            { signal: AbortSignal.timeout(5000) }
        );

        if (!response.ok) {
            throw new Error('Error al consultar el catálogo');
        }

        const products = await response.json();
        const original = products[0];

        if (!original) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        // Consultar productos de la misma categoría
        const related = await sql`
  SELECT
    p.id,
    p.title,
    p.price_jpy,
    p.stock,
    p.condition,
    c.name AS category_name,
    i.url AS image_url
  FROM catalog.products p
  JOIN catalog.categories c
    ON c.id = p.category_id
  LEFT JOIN catalog.product_images i
    ON i.product_id = p.id AND i.position = 0
  WHERE p.category_id = ${original.categoryId}
    AND p.id != ${productId}
    AND p.is_active = true
    AND p.stock > 0
  ORDER BY p.created_at DESC
  LIMIT 6
`;

        res.json({
            status: 'ok',
            productId,
            total: related.length,
            products: related.map((product) => ({
                id: product.id,
                title: product.title,
                priceJpy: product.price_jpy,
                stock: product.stock,
                condition: product.condition,
                categoryName: product.category_name,
                imageUrl: product.image_url
            }))
        });

    } catch (error) {
        console.error(
            '[Recomendaciones] Error:', error.message
        );

        res.status(502).json({
            error: 'No se pudieron obtener productos relacionados'
        });
    }
});

// Recomendaciones personalizadas según historial de compras
app.get('/recommendations/me', async (req, res) => {
    try {
        // Obtener el token enviado por el usuario
        const authorization = req.headers.authorization ?? '';
        const [scheme, token] = authorization.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                error: 'Debes iniciar sesión'
            });
        }

        // Verificar que el token sea válido
        let payload;

        try {
            payload = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });
        } catch {
            return res.status(401).json({
                error: 'La sesión no es válida o ha expirado'
            });
        }

        // Obtener el ID del usuario autenticado
        const userId = payload.sub;

        const UUID_REGEX =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
            return res.status(401).json({
                error: 'Identificador de usuario inválido'
            });
        }

        // Identificar las categorías favoritas del usuario
        const categories = await sql`
      SELECT
        category_id,
        SUM(quantity)::integer AS total_purchased
      FROM recom.purchase_history
      WHERE user_id = ${userId}
      GROUP BY category_id
      ORDER BY total_purchased DESC
      LIMIT 3
    `;

        if (categories.length === 0) {
            return res.json({
                status: 'ok',
                type: 'personalized',
                hasHistory: false,
                total: 0,
                products: []
            });
        }

        const categoryIds = categories.map(
            (category) => category.category_id
        );

        // Buscar productos de las categorías favoritas
        const products = await sql`
      SELECT
    p.id,
    p.title,
    p.price_jpy,
    p.stock,
    p.condition,
    c.name AS category_name,
    i.url AS image_url
  FROM catalog.products p
  JOIN catalog.categories c
    ON c.id = p.category_id
  LEFT JOIN catalog.product_images i
    ON i.product_id = p.id AND i.position = 0
  WHERE p.category_id IN ${sql(categoryIds)}
    AND p.is_active = true
    AND p.stock > 0
    AND NOT EXISTS (
      SELECT 1
      FROM recom.purchase_history h
      WHERE h.user_id = ${userId}
        AND h.product_id = p.id
    )
  ORDER BY p.created_at DESC
  LIMIT 6
    `;

        res.json({
            status: 'ok',
            type: 'personalized',
            hasHistory: true,
            total: products.length,
            products: products.map((product) => ({
                id: product.id,
                title: product.title,
                priceJpy: product.price_jpy,
                stock: product.stock,
                condition: product.condition,
                categoryName: product.category_name,
                imageUrl: product.image_url
            }))
        });

    } catch (error) {
        console.error(
            '[Recomendaciones] Error personalizado:',
            error.message
        );

        res.status(500).json({
            error: 'No se pudieron obtener las recomendaciones'
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `[Recomendaciones] Servicio corriendo en http://localhost:${PORT}`
    );
});