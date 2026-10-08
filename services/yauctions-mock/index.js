const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3006;


const mockProducts = [
  // 1: Audio
  { id: 'YAUC-001', category_id: 1, title: 'Auriculares Inalámbricos Sony WH-1000XM5', description: 'Cancelación de ruido líder, importación JP.', price_jpy: 48000, stock: 15, condition: 'new', images: ['https://i.imgur.com/eCGC2sC.jpeg'] },
  { id: 'YAUC-002', category_id: 1, title: 'Monitores de Estudio Yamaha HS5', description: 'Par de monitores activos bi-amplificados.', price_jpy: 32000, stock: 4, condition: 'used', images: ['https://i.imgur.com/B7MktTV.jpeg'] },
  { id: 'YAUC-003', category_id: 1, title: 'Amplificador DAC FiiO K7', description: 'Audio de alta resolución de escritorio.', price_jpy: 29500, stock: 8, condition: 'new', images: ['https://i.imgur.com/qIzXoLY.png'] },
  
  // 2: Periféricos
  { id: 'YAUC-004', category_id: 2, title: 'Teclado Mecánico HHKB Professional HYBRID', description: 'Layout japonés, switches Topre. Ideal para programadores.', price_jpy: 35000, stock: 4, condition: 'used', images: ['https://i.imgur.com/QLK0vMc.jpeg'] },
  { id: 'YAUC-005', category_id: 2, title: 'Mouse Inalámbrico Logitech G PRO X Superlight', description: 'Edición japonesa, ultra ligero.', price_jpy: 18500, stock: 20, condition: 'new', images: ['https://i.imgur.com/Xnvsd0U.jpeg'] },
  { id: 'YAUC-006', category_id: 2, title: 'Monitor Curvo Dell UltraSharp 34', description: 'Pantalla WQHD, sin rasguños evidentes.', price_jpy: 85000, stock: 1, condition: 'used', images: ['https://i.imgur.com/BtAxteJ.jpeg'] },

  // 3: Energía
  { id: 'YAUC-007', category_id: 3, title: 'Batería Portátil Anker Prime 27,650mAh', description: 'Power bank con salida de 250W.', price_jpy: 24000, stock: 12, condition: 'new', images: ['https://i.imgur.com/8q6eVev.jpeg'] },
  { id: 'YAUC-008', category_id: 3, title: 'Estación de Energía EcoFlow RIVER 2', description: 'Capacidad de 256Wh, carga ultra rápida.', price_jpy: 42000, stock: 3, condition: 'new', images: ['https://i.imgur.com/JLujFEs.jpeg'] },

  // 4: Casa Inteligente
  { id: 'YAUC-009', category_id: 4, title: 'Amazon Echo Show 8 (JP)', description: 'Pantalla inteligente con Alexa en japonés.', price_jpy: 14980, stock: 6, condition: 'used', images: ['https://i.imgur.com/q5Usx6q.jpeg'] },
  { id: 'YAUC-010', category_id: 4, title: 'Kit Philips Hue White & Color Ambiance', description: 'Incluye 3 focos inteligentes y el Hue Bridge.', price_jpy: 22000, stock: 9, condition: 'new', images: ['https://i.imgur.com/HrJW0BB.jpeg'] },

  // 5: Zona Gaming
  { id: 'YAUC-011', category_id: 5, title: 'Nintendo Switch OLED Edición Zelda (JP)', description: 'Consola versión japonesa, región libre. Nueva.', price_jpy: 37980, stock: 2, condition: 'new', images: ['https://i.imgur.com/3Yosuuo.jpeg'] },
  { id: 'YAUC-012', category_id: 5, title: 'Mando DualSense PS5 Edición Final Fantasy XVI', description: 'Control de edición limitada.', price_jpy: 11000, stock: 5, condition: 'used', images: ['https://i.imgur.com/FIuDQhk.jpeg'] },

  // 6: Celulares
  { id: 'YAUC-013', category_id: 6, title: 'Smartphone Sony Xperia 1 V Libre', description: 'Cámara con sensor Exmor T, sin bloqueo de red.', price_jpy: 165000, stock: 2, condition: 'new', images: ['https://i.imgur.com/RxLXsOR.jpeg'] },

  // 7: Wearables
  { id: 'YAUC-014', category_id: 7, title: 'Smartwatch Casio G-Shock G-SQUAD', description: 'Reloj deportivo resistente con monitor cardíaco.', price_jpy: 55000, stock: 7, condition: 'new', images: ['https://i.imgur.com/sspzJkG.jpeg'] },
  { id: 'YAUC-015', category_id: 7, title: 'Apple Watch Series 8 (GPS, 41mm)', description: 'Caja de aluminio, incluye correa deportiva negra.', price_jpy: 45000, stock: 3, condition: 'used', images: ['https://i.imgur.com/7B2Mqwf.jpeg'] }
];


app.get('/api/external-products', (req, res) => {
  setTimeout(() => {
    res.json(mockProducts);
  }, 1000);
});


app.get('/health', (req, res) => {
  res.json({ status: 'YAuctions Mock API funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`[YAuctions Mock] Simulador corriendo en http://localhost:${PORT}`);
});