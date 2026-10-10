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

## Configuración inicial (primera vez)

### 1. Clonar el repositorio y usar Node 24

```bash
git clone https://github.com/melissa-lp/CompraLatino.git
cd CompraLatino
node -v   # debe mostrar v24.x
```

Si se tiene otra versión: con [nvm](https://github.com/nvm-sh/nvm) ejecuta `nvm install` y `nvm use` (leen el archivo `.nvmrc`); sin nvm, instala Node 24 desde [nodejs.org](https://nodejs.org).

### 2. Crear rama

Ver [Flujo de trabajo › Primera vez](#primera-vez-crear-rama).

### 3. Instalar dependencias

Cada servicio es un proyecto independiente con su propio `package.json`, así que `npm install` se ejecuta **dentro de cada carpeta** (no en la raíz):

```bash
cd services/identity && npm install && cd ../..
cd services/gateway && npm install && cd ../..
cd services/catalog && npm install && cd ../..
cd services/orders && npm install && cd ../..
cd services/yauctions-mock && npm install && cd ../..
cd frontend && npm install && cd ..
```

Repetir `npm install` en una carpeta cada vez que, después de un `git pull`, cambie su `package.json`.

### 4. Crear los archivos `.env`

Cada carpeta tiene un `.env.example` con los nombres de las variables. Copiar como `.env` en la **misma carpeta**:

```bash
cp services/identity/.env.example services/identity/.env
cp services/gateway/.env.example services/gateway/.env
cp services/catalog/.env.example services/catalog/.env
cp services/orders/.env.example services/orders/.env
cp services/yauctions-mock/.env.example services/yauctions-mock/.env
cp frontend/.env.example frontend/.env
```

Solo se debe completar **dos secretos**, que el equipo comparte:

| Archivo `.env` | Qué completar |
|---|---|
| `services/identity` | `DATABASE_URL` y `JWT_SECRET` |
| `services/gateway` | `JWT_SECRET` (**el mismo** que identity: con él se verifican los tokens) |
| `services/catalog` | `DATABASE_URL` |
| `services/orders` | `DATABASE_URL` |
| `services/yauctions-mock` y `frontend` | Nada |

Todos usan la misma `DATABASE_URL`. Los `.env` están en `.gitignore`

Para comprobar la conexión a la base de datos:

```bash
cd services/identity && npm run test:db
```

### 5. Levantar la app

Cada servicio en **su propia terminal** (en VS Code: botón **+** del panel de terminal). Los servidores se quedan corriendo y se reinician solos al guardar cambios:

```bash
cd services/yauctions-mock && npm run dev   # 3006
cd services/catalog        && npm run dev   # 3002
cd services/identity       && npm run dev   # 3001
cd services/orders         && npm run dev   # 3003
cd services/gateway        && npm run dev   # 3000
cd frontend                && npm run dev   # 5173 → abrir http://localhost:5173
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

### 6. (Opcional) Usar el panel de administración

Al registrarse, toda cuenta es `customer`. Para volverse admin, ejecutar en el **SQL Editor** de Supabase:

```sql
update identity.users set role = 'admin' where email = 'tu-correo@ejemplo.com';
```

Después **cierra sesión y vuelve a entrar** (el rol viaja dentro del token).


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
