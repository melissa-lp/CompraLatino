# Pruebas automatizadas de CompraLatino (Fase 4 · QA)

Suite sin dependencias externas: usa el ejecutor de pruebas incluido en Node (`node --test`). Solo necesitas **Node 24** (el mismo del proyecto, ver `.nvmrc`). No hay que instalar nada con npm.

Cada prueba lleva un ID en el título (`[TC-AUT-03]`) que corresponde a una fila de `Matriz_de_Pruebas_CompraLatino.xlsx`.

## Contenido
| Carpeta | Qué prueba | Necesita servicios corriendo |
|---|---|---|
| `unit/` | Validación y cálculo de precios del servicio de órdenes (TC-VAL, TC-PRC) | No |
| `integration/` | Cuentas, seguridad, catálogo, órdenes, recomendaciones, salud, administración y el mock de YAuctions | Sí |

## Pasos
1. Copia esta carpeta `tests/` a la raíz del repositorio.
2. Copia `.env.example` a `.env` (no se sube a GitHub; verifica que `.env` esté en `.gitignore`).
3. Levanta los servicios como indica el README del proyecto: gateway 3000, identity 3001, catalog 3002, orders 3003, recommendations 3004, yauctions-mock 3006 (y el frontend 5173 solo para las pruebas manuales). Recuerda en `orders/.env` poner `RECOMMENDATIONS_URL=http://localhost:3004`.
4. Pruebas unitarias (no requieren servicios):
   ```
   cd tests
   npm run test:unit
   ```
5. Pruebas de integración:
   ```
   npm run test:integration
   ```
6. (Opcional) Pruebas de administración: crea una cuenta desde la app y conviértela en admin en Supabase:
   `update identity.users set role='admin' where email='tu-correo';`
   Luego pon `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `tests/.env`. La sincronización (TC-ADM-03) requiere además `QA_RUN_SYNC=1`.
7. Para guardar evidencia del informe:
   ```
   npm run test:unit > evidencia-unit.txt 2>&1
   npm run test:integration > evidencia-integracion.txt 2>&1
   ```
   Adjunta estos archivos y capturas de pantalla.

## Cómo interpretar los resultados
- Una prueba **fallida** no siempre es un error en la prueba: puede ser una **incidencia real** del sistema. Regístrala en la hoja «Incidencias» (con el ID del caso), corrígela o justifica por qué se acepta, y vuelve a ejecutar.
- Las pruebas de «endurecimiento/observación» (TC-SEC-14 a TC-SEC-17, TC-ORD-15) revisan buenas prácticas (límite de intentos, cabeceras de seguridad, 413 en cuerpos grandes, estadísticas públicas). Es probable que fallen en la primera ejecución: son hallazgos esperables y documentables. Ver la hoja «Hallazgos iniciales».
- Las pruebas con saltos (`skip`) aparecen como omitidas, no como aprobadas: en el informe cuéntalas como «No ejecutadas» y explica el motivo.

## Precauciones (base de datos compartida)
- Las pruebas crean cuentas `qa.*@example.com` y órdenes en la base de Supabase compartida. Avisa al equipo antes de ejecutarlas y limpia con `cleanup.sql` al terminar.
- Las pruebas de compra **descuentan stock** en `services/yauctions-mock/data/products.json`. Para restaurarlo: `git checkout services/yauctions-mock/data/products.json`. Si no quieres comprar, usa `QA_SKIP_PURCHASE=1`.
- Si las pruebas de login fallan masivamente, revisa si el proyecto de Supabase se pausó por inactividad.

## Pruebas manuales y de rendimiento
Están en la matriz (TC-UI, TC-MAN, TC-PER). Rendimiento, con lecturas solamente y carga suave:
```
npx autocannon -c 10 -d 15 http://localhost:3000/products
npx autocannon -c 10 -d 15 http://localhost:3000/categories
```
Las herramientas sugeridas: Chrome DevTools y Lighthouse (responsivo y rendimiento), Bruno o Postman (exploración manual de la API), `npm audit` (dependencias) y GitHub Issues (seguimiento de incidencias).
