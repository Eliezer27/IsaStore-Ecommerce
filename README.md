# IsaStore — Next.js

Tienda en línea de accesorios y regalos (Nicaragua). Migración del template
estático `IsaWebPlantilla` a Next.js 16 (App Router) + TypeScript + Prisma,
según lo acordado en el documento de arquitectura del proyecto.

## Stack

- Next.js 16 (App Router, TypeScript)
- Bootstrap 5 (CSS del template original, servido desde `/public/assets`)
- Prisma + PostgreSQL (Supabase)
- Zustand (carrito, persistido en localStorage)
- PayPal (`@paypal/react-paypal-js`) y Google Maps (`@react-google-maps/api`) — instalados, integración pendiente

## Primeros pasos

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL como mínimo
npx prisma generate
npx prisma db push           # crea las tablas en tu base de datos (o usa prisma/schema.sql directo)
npm run dev
```

Nota sobre `npx prisma generate`: descarga el motor de Prisma desde
`binaries.prisma.sh`. Este scaffold se armó dentro de un entorno con acceso a
internet restringido donde ese dominio no estaba permitido, así que
**este paso no se pudo ejecutar/verificar aquí** — se validó todo lo demás
(ESLint sin errores) pero falta correr `npm run build` una vez con Prisma
generado en tu máquina o en CI para confirmar que compila de punta a punta.

## Qué está migrado ya

| Página | Estado |
|---|---|
| `/` (inicio) | Hero + categorías + productos destacados (Prisma) |
| `/shop` | Catálogo con filtro por categoría (`?categoria=slug`) |
| `/producto/[slug]` | Ficha de producto: galería, precio, stock, reseñas, agregar al carrito |
| `/carrito` | Carrito funcional (Zustand + localStorage), sin backend todavía |
| `/checkout`, `/cuenta`, `/favoritos`, `/blog`, `/contacto` | Páginas placeholder con la nota de qué falta — ver cada archivo en `app/` |

Esto sigue el orden de prioridad definido en el documento de arquitectura:
catálogo primero, luego carrito/checkout, cuenta, contacto+mapa, y por
último wishlist/blog.

## Qué falta (en orden sugerido)

1. Conectar una base de datos real (Supabase) y correr `prisma/schema.sql` o `prisma db push`, cargar productos de prueba.
2. Checkout: formulario de dirección + botones de PayPal (paquete ya instalado) + API routes para crear/capturar la orden (Orders API v2) + webhook.
3. Autenticación real en `/cuenta` (Supabase Auth o NextAuth.js).
4. Mapa de Google en `/contacto` + autocompletar de dirección en checkout (paquete ya instalado).
5. `/favoritos` y `/blog` conectados a sus tablas (`wishlists`, `blog_posts`).
6. Las animaciones/carruseles del template original (AOS, Slick, WOW.js, Vanilla-Tilt) usaban jQuery directo sobre el DOM y **no se migraron** — si se quieren, hay que reemplazarlos por una librería nativa de React (ej. Embla o Swiper) en vez de reintroducir jQuery.

## Estructura

```
app/            rutas (App Router): shop, producto/[slug], carrito, checkout, cuenta, favoritos, blog, contacto, api/
components/     SiteHeader, SiteFooter, ProductCard, AddToCartButton
lib/            prisma.ts (cliente), cart-store.ts (Zustand), types.ts
prisma/         schema.prisma (modelo) + schema.sql (fuente de verdad del SQL)
public/assets/  css/js/imágenes copiados de IsaWebPlantilla
.env.example    variables de entorno necesarias
```

## Documento de arquitectura completo

El análisis completo (esquema de base de datos con su razonamiento,
integración de PayPal y Google Maps paso a paso, decisiones de stack) vive
en el contexto compartido del proyecto — `prisma/schema.sql` de este repo es
exactamente ese esquema, listo para ejecutar.
