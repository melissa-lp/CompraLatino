# CompraLatino

Plataforma de comercio electrónico que permite a clientes de Latinoamérica comprar productos de YAuctions (Japón), resolviendo pagos y envíos.

Proyecto de la materia Desarrollo de Software Empresarial (DSE941), Universidad Don Bosco.

## Estructura

```
services/
  gateway/           API Gateway: punto de entrada y enrutamiento a los servicios
  identity/          Registro, login y autorización (JWT)
  catalog/           Consulta de productos (datos de YAuctions)
  orders/            Órdenes y ejecución de compras
  recommendations/   Recomendaciones según historial
  admin/             Métricas y reportes
  yauctions-mock/    Simulación de la API externa de YAuctions
frontend/            SPA en React
docs/                Documentación y diagramas
```

## Requisitos

- Node.js 24 (ver `.nvmrc`; con nvm: `nvm use`)
- Git
- Docker (para levantar los servicios en contenedores)

## Primeros pasos

```bash
git clone https://github.com/melissa-lp/CompraLatino.git
cd CompraLatino
```

### Variables de entorno

Cada servicio tiene su propio `.env` dentro de su carpeta, para que solo conozca las credenciales que necesita. Para configurar un servicio:

```bash
cd services/identity
cp .env.example .env   # llenar con las credenciales compartidas 
npm install
npm run test:db        # verifica la conexión a la base de datos
```

| Servicio | Puerto |
|---|---|
| gateway | 3000 |
| identity | 3001 |
| catalog | 3002 |
| orders | 3003 |
| recommendations | 3004 |
| admin | 3005 |
| yauctions-mock | 3006 |
| frontend (Vite) | 5173 |

### Levantar la app en desarrollo

Cada uno en su propia terminal (los servidores se quedan corriendo):

```bash
cd services/identity && npm run dev   # 3001
cd services/gateway  && npm run dev   # 3000
cd frontend          && npm run dev   # 5173
```

El frontend solo habla con el gateway (`VITE_API_URL` en `frontend/.env`), nunca directo con un servicio.

## Flujo de trabajo

Cada integrante trabaja en su propia rama: `luis`, `rodrigo`, `melissa`, `ronald` y `emilia`.

### Primera vez (crear rama)

```bash
git checkout main
git pull
git checkout -b <nombre>
git push -u origin <nombre>
```

### Día a día (trabajar en cada rama)

```bash
git checkout <nombre>
git merge main                
git add .
git commit -m "mensaje" 
git push
```

### Integrar  cambios a `main`

```bash
git checkout main
git pull                      
git merge <nombre>
git push                
git checkout <nombre>     
```

## Equipo

Luis Gustavo Hernández Rivas, Rodrigo André Henríquez López, Melissa Vanina López Peña, Ronald Alexander Martínez Gutiérrez, Emilia Eunice Meléndez Barreiro.
