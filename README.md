# IsaStore

Tienda en línea de accesorios y regalos (Nicaragua). El proyecto es una
migración del template estático `IsaWebPlantilla` a una aplicación real con
Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL (Supabase),
según el documento de arquitectura acordado para el proyecto.

## Objetivo

Reemplazar el catálogo estático original por una aplicación con dos partes
que comparten la misma base de datos:

1. **La tienda pública** (`app/(site)`) — donde el cliente navega el
   catálogo, arma su carrito, se registra/inicia sesión y hace el pedido.
2. **El panel administrativo** (`app/(admin)`) — donde el staff y los
   administradores de IsaStore cargan productos, revisan pedidos, ven
   reportes de ventas y gestionan cuentas de otros miembros del equipo.

No son dos proyectos separados: es una sola aplicación Next.js con dos
grupos de rutas independientes, cada uno con su propio layout, su propia
sesión de autenticación y sus propias reglas de acceso (ver
[Los dos sistemas](#los-dos-sistemas)).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Prisma 7** + **PostgreSQL** (pensado para Supabase) — ver la nota sobre
  Prisma 7 más abajo, trae cambios importantes respecto a versiones previas
- **Supabase Auth** — login real de clientes y de staff/admin, con dos
  sesiones independientes (ver más abajo)
- **Zustand** — carrito y wishlist, persistidos en `localStorage`
- **Bootstrap 5** — CSS del template original (tienda), servido desde
  `/public/assets`; el panel admin usa una plantilla aparte (DreamsPOS) en
  `/public/admin-assets`
- **PayPal** (`@paypal/react-paypal-js` en el front + REST Orders API v2 en el
  server) — cobro real de pedidos en el `/checkout`, ya integrado; funciona en
  sandbox y en live según `PAYPAL_MODE` (ver
  [Estado del proyecto](#estado-del-proyecto))
- **Leaflet** (`react-leaflet` + tiles de OpenStreetMap) — mapa interactivo
  en el `/checkout` para que el cliente confirme el punto exacto de entrega;
  es gratis y **no** necesita API key
- **Google Maps** (`@react-google-maps/api`) — instalado para el mapa de
  `/contacto`, esa integración sigue pendiente

No hay una suite de pruebas automatizadas (no hay Jest/Vitest/Playwright
configurado todavía).

## Los dos sistemas

Aunque viven en el mismo repo y la misma base de datos, la tienda y el
panel admin están deliberadamente separados a nivel de sesión:

- **Sesión de cliente** (`sb-customer-auth`) — se inicia en `/cuenta`, y es
  la que exige `/checkout` para poder completar un pedido. Cualquier
  persona se puede registrar sola con su correo real.
- **Sesión de staff/admin** (`sb-admin-auth`) — se inicia en
  `/admin-login`, y es la que exige todo lo que está bajo `/admin/*`. Las
  cuentas de staff/admin no se auto-registran: las crea un administrador
  desde `/admin/usuarios/nuevo` con una contraseña fija que le entrega a la
  persona por fuera del sistema.

Son dos cookies distintas manejadas por el mismo middleware
(`proxy.ts` + `lib/supabase/middleware.ts`), así que iniciar sesión en el
panel como staff nunca cierra ni pisa la sesión de cliente de esa misma
persona en `/cuenta`, y viceversa. El rol (`customer` / `staff` / `admin`)
se guarda en `app_metadata` de Supabase Auth, que solo se puede escribir
con la Service Role Key — un usuario no puede otorgarse un rol más alto por
su cuenta.

Dentro del panel, algunas secciones son solo para `admin` (Reportes,
Usuarios, borrar productos) — `staff` puede operar el día a día (cargar
productos, ver ventas) pero no esas pantallas. Esto se refuerza en dos
capas: el middleware bloquea `/admin/*` a quien no tenga sesión de
staff/admin, y `requireRole()` (`lib/auth/session.ts`) vuelve a validar el
rol exacto dentro de cada página que lo necesita.

## Estructura del proyecto

```
app/
  (site)/           tienda pública: shop, producto/[slug], carrito,
                     checkout, cuenta, favoritos, blog, contacto
  (admin)/           panel: admin-login, admin/ (dashboard, productos,
                     categorías, ventas, reportes, reseñas, usuarios)
  api/auth/          logout unificado (cierra la sesión del scope indicado)
  api/paypal/        crear y capturar la orden de PayPal (Orders API v2)
components/          componentes de la tienda + components/admin/
                     (PayPalCheckout, DeliveryMap/DeliveryMapInner, Toaster)
lib/
  actions.ts          server actions públicas (signIn, signUp, createReview)
  admin/              server actions y utilidades del panel
  auth/               sesión actual, traducción de errores de Supabase
  checkout/           actions.ts (efectivo) + order.ts (precio y persistencia
                       compartidos entre efectivo y PayPal)
  paypal/             cliente REST de PayPal (token OAuth, crear/capturar
                       orden, conversión NIO->USD)
  supabase/           clientes de Supabase (browser, server, admin, middleware)
  cart-store.ts       carrito (Zustand + localStorage)
  wishlist-store.ts   favoritos (Zustand + localStorage)
  toast-store.ts      avisos flotantes / notificaciones (Zustand)
  categories.ts       árbol de categorías
  prisma.ts           cliente Prisma (adapter-pg)
prisma/
  schema.prisma       modelo de datos (fuente de verdad en Prisma)
  schema.sql          el mismo esquema en SQL plano, listo para ejecutar
  migrations/         migraciones aplicadas, incluida la sincronización
                       con Supabase Auth (triggers de auth.users -> public.users)
scripts/              scripts de una sola vez: seed de categorías/productos
                       de ejemplo, backfill de descripciones, export a CSV
public/assets/        CSS/JS/imágenes del template de la tienda
public/admin-assets/  CSS/JS/imágenes del template del panel (DreamsPOS)
public/uploads/       imágenes subidas desde el panel (no se versiona el
                       contenido, solo la carpeta — ver .gitignore)
proxy.ts              middleware: refresca ambas sesiones y aplica el
                       gateo de /admin y /checkout
```

## Modelo de datos (resumen)

El esquema completo vive en `prisma/schema.prisma` (y su equivalente en SQL
plano en `prisma/schema.sql`). Resumen de las tablas principales:

| Modelo | Para qué sirve |
|---|---|
| `User` | Cuenta de cliente o staff/admin. El `id` es el mismo UUID que Supabase Auth le da a esa persona (sincronizado por trigger). |
| `Address` | Direcciones de envío/facturación de un usuario. |
| `Category` | Categorías y subcategorías del catálogo (autorelación padre-hijo). |
| `Product` / `ProductImage` / `ProductVariant` | Productos, sus imágenes y variantes opcionales (talla/color). |
| `Review` | Reseñas de producto (rating 1-5). |
| `Cart` / `CartItem` | Carrito persistido en base de datos (por usuario o por invitado) — el carrito que usa la tienda hoy vive en `localStorage`, esta tabla está preparada para cuando se quiera sincronizar entre dispositivos. |
| `Wishlist` | Favoritos guardados por usuario — mismo caso que el carrito: hoy la wishlist de la tienda vive en `localStorage`. |
| `Coupon` | Cupones de descuento. |
| `Order` / `OrderItem` | Pedidos y sus líneas (con snapshot del nombre/precio al momento de compra). |
| `Payment` | Registro de pagos (PayPal u otro proveedor), con la respuesta cruda de la API para auditoría. |
| `StoreLocation` | Ubicaciones físicas de la tienda (mapa de contacto). |
| `BlogPost` | Artículos del blog. |
| `NewsletterSubscriber` | Suscriptores al newsletter. |

## Primeros pasos

Requisitos: Node.js 20+, una base de datos PostgreSQL (el proyecto está
pensado para Supabase, que además provee la autenticación), y npm.

```bash
git clone <url-del-repo>
cd IsaStore-Ecommerce
npm install
cp .env.example .env.local   # completar según la sección de abajo
npx prisma generate
npx prisma migrate deploy    # crea las tablas + el trigger de sincronización
                             # con Supabase Auth (recomendado sobre `db push`,
                             # que NO aplica ese trigger)
npm run dev
```

La app queda en `http://localhost:3000` — la tienda en `/`, el login de
staff/admin en `/admin-login`.

### Variables de entorno (`.env.local`)

Todas están documentadas con más detalle en `.env.example`; resumen por
grupo:

- **Base de datos** — `DATABASE_URL` (conexión *pooled*, puerto 6543, la
  usa la app en runtime) y `DIRECT_URL` (conexión directa, puerto 5432, la
  usa el CLI de Prisma para migrar — las migraciones no funcionan bien a
  través de un pooler de transacciones).
- **Supabase Auth** (obligatorias, sin esto no funciona ningún
  login/registro): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (esta última nunca debe llegar al navegador —
  es la que puede crear staff y asignar roles).
- **PayPal** — `PAYPAL_MODE` (`sandbox` o `live`), `PAYPAL_CLIENT_ID`,
  `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (el mismo Client ID,
  este va al navegador) y `PAYPAL_WEBHOOK_ID` (opcional, solo si se agrega el
  webhook). Con `PAYPAL_CLIENT_ID`/`SECRET` vacías, el checkout muestra el
  botón de PayPal deshabilitado ("Próximamente"); con credenciales válidas,
  aparecen los botones de PayPal y el cobro es real.
- **Conversión de moneda** — `NIO_TO_USD_RATE` (obligatoria para PayPal). Los
  precios del catálogo están en NIO (córdoba), pero PayPal no admite NIO como
  moneda de cobro, así que el total se convierte a USD con esta tasa fija al
  momento de cobrar (ej. `0.027` ≈ 1 USD por cada ~36.6 NIO).
- **Leaflet / mapa de entrega** — no necesita ninguna variable: usa tiles de
  OpenStreetMap directamente.
- **Google Maps** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (para el mapa de
  `/contacto`, todavía pendiente). El mapa del `/checkout` ya NO usa Google:
  usa Leaflet (ver arriba).
- **Correo (SMTP)** — pensado para las confirmaciones de pedido por correo;
  las variables ya están en `.env.example` pero el envío de correos
  todavía no está implementado en el código (ver estado del proyecto).
- **App** — `NEXT_PUBLIC_SITE_URL` (usada para construir URLs absolutas).

### Cargar datos de prueba (opcional)

`scripts/` tiene scripts de una sola vez, pensados para correrse con
`node scripts/<archivo>.cjs` (leen `.env.local` ellos mismos):

- `seed-categories.cjs` — crea las categorías y subcategorías reales del
  catálogo (idempotente, se puede correr más de una vez).
- `seed-accesorios-subcategorias.cjs`, `seed-cadenas-subcategorias.cjs`,
  `seed-maquillaje-subcategorias.cjs`, `seed-peluches-subcategorias.cjs`,
  `seed-ropa-subcategorias.cjs`, `seed-empty-categories.cjs` — cargan
  productos de ejemplo por subcategoría (sin imagen real).
- `backfill-product-descriptions.cjs` — completa descripción/atributos de
  productos que no los tengan.
- `exportar-productos.cjs` — exporta el catálogo actual a un CSV.

### Nota importante: Prisma ORM 7

Este proyecto usa Prisma 7, que trajo varios cambios importantes respecto a
versiones anteriores:

- La URL de conexión **ya no va en `prisma/schema.prisma`** — vive en
  `prisma.config.ts` (usa `DIRECT_URL`, la conexión sin pooling, porque las
  migraciones no corren bien a través de pgbouncer).
- `PrismaClient` ya no se puede instanciar sin argumentos: ahora requiere un
  **driver adapter**. Este proyecto usa `@prisma/adapter-pg` sobre un `Pool`
  de `pg` (ver `lib/prisma.ts`), conectado con `DATABASE_URL` (la conexión
  pooled).
- El generador se dejó como `provider = "prisma-client-js"` **sin** `output`
  a propósito (no el nuevo `"prisma-client"`) — es lo que evita el error
  `Cannot find module '.prisma/client/default'` con Turbopack en Next.js 16.
  Si de todos modos aparece ese error, agregar en `next.config.ts`:
  ```ts
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
  ```

`npx prisma generate` descarga el motor de Prisma desde `binaries.prisma.sh`
— si trabajás detrás de un proxy o firewall que bloquee ese dominio, ese
paso puntual va a fallar aunque la configuración esté bien.

## Estado del proyecto

### Ya funciona de punta a punta

- Catálogo (`/shop`, `/producto/[slug]`) con filtro por categoría,
  subcategoría, precio y rating.
- Carrito (`/carrito`) y wishlist (`/favoritos`), ambos en `localStorage`,
  con **avisos flotantes** (toasts) al agregar/quitar productos
  (`lib/toast-store.ts` + `components/Toaster.tsx`).
- Registro/login real de clientes (`/cuenta`) y de staff/admin
  (`/admin-login`), con Supabase Auth y sesiones separadas.
- Checkout con **dos métodos de pago activos**:
  - **Efectivo en tienda** — el pedido se marca pagado al crearse (el cliente
    paga al recoger en persona).
  - **PayPal** — cobro real vía Orders API v2: el server crea la orden
    (`/api/paypal/create-order`), el cliente aprueba, y el server la captura
    (`/api/paypal/capture-order`) creando el pedido + el registro `Payment`
    solo si la captura vuelve `COMPLETED`. El total (en NIO) se convierte a
    USD con `NIO_TO_USD_RATE`. El precio siempre se recalcula en el servidor.
- **Mapa de entrega en el `/checkout`** — mapa interactivo con Leaflet +
  OpenStreetMap (sin API key): el cliente marca/arrastra el pin y las
  coordenadas se guardan en `addresses.lat`/`lng`.
- Reseñas de producto (`WriteReviewForm`), se publican sin aprobación
  manual.
- Panel admin: productos (alta/edición/borrado), categorías/subcategorías,
  ventas (listado + detalle imprimible tipo factura), reportes (ventas por
  fecha, stock bajo, pedidos por estado/método de pago — solo `admin`),
  reseñas (solo lectura + borrar), usuarios de staff (solo `admin`).

### Pendiente

- **Webhook de PayPal** (opcional) — el cobro ya funciona capturando desde el
  navegador; un webhook (`PAYPAL_WEBHOOK_ID`) daría una confirmación más
  confiable sin depender del cliente. La tabla `Payment` ya guarda la
  respuesta cruda de la API para auditoría.
- **Correo de confirmación de pedido** — las variables SMTP ya están
  documentadas, pero hoy no se envía ningún correo al completar un pedido
  (solo se muestra un modal en pantalla).
- **Mapa de Google en `/contacto`** y autocompletado de dirección — el
  paquete está instalado y la UI tiene el espacio reservado. (El mapa del
  `/checkout` ya está resuelto con Leaflet.)
- **Productos relacionados** en la ficha de producto — no hay lógica de
  Prisma para esto todavía.
- Migrar carrito/wishlist de `localStorage` a las tablas `Cart`/`Wishlist`
  de la base de datos, para que persistan entre dispositivos (ya existe
  login real de clientes, así que esto ya no está bloqueado por falta de
  autenticación).
- Blog (`/blog`) conectado a `BlogPost` — listo para publicar, falta
  contenido real.

## Notas de limpieza pendientes (no aplicadas en esta pasada)

- `tmp/` (salida de un `npm run build` de verificación) quedó en el repo
  como carpeta sin trackear; ya se agregó a `.gitignore` para que no se
  vuelva a commitear por accidente, pero la carpeta en sí sigue en disco —
  se puede borrar sin riesgo (`rm -rf tmp/`) cuando quieras.
- `productos-export.csv` y `prompts-fotos-productos.xlsx` están sueltos en
  la raíz del repo (salida de `scripts/exportar-productos.cjs` y un archivo
  de trabajo aparte). No los toqué porque no son código ni configuración —
  si querés, se pueden mover a una carpeta `data/` para que la raíz del
  repo quede solo con configuración y código.
- Hay bastante trabajo ya hecho sin commitear (auth, checkout, reseñas,
  wishlist, varias páginas del panel, migraciones de Supabase Auth) —
  conviene revisar `git status` y commitear en bloques lógicos antes de
  seguir agregando cambios encima.
