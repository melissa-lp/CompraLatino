# CompraLatino

Plataforma de comercio electrónico que permite a clientes de Latinoamérica comprar productos de YAuctions (Japón), resolviendo pagos y envíos.

Proyecto de la materia Desarrollo de Software Empresarial (DSE941), Universidad Don Bosco.

## Estructura

```
services/
  identity/          Registro, login y autorización (JWT)
  catalog/           Consulta de productos (datos de YAuctions)
  orders/            Órdenes y ejecución de compras
  recommendations/   Recomendaciones según historial
  admin/             Métricas y reportes
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
cp .env.example .env   # llenar con las credenciales compartidas por el equipo
```

## Flujo de trabajo

1. Actualizar `main`: `git checkout main && git pull`
2. Crear rama: `git checkout -b feature/<servicio>-<descripcion>`
3. Commits en español y en imperativo (ej. `Agrega endpoint de registro de usuario`)
4. Subir la rama y abrir un Pull Request hacia `main`; otro integrante debe revisarlo antes de fusionar.

## Equipo

Luis Gustavo Hernández Rivas, Rodrigo André Henríquez López, Melissa Vanina López Peña, Ronald Alexander Martínez Gutiérrez, Emilia Eunice Meléndez Barreiro.
