"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { hasUploadedFile, saveUploadedImage } from "@/lib/admin/upload";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { translateAuthError } from "@/lib/auth/errors";
import { recomputeProductRating } from "@/lib/reviews";

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Reconstruye Product.attributes (las "Especificaciones" que se muestran en
 * la ficha del producto) a partir de las filas del editor de
 * AttributesFields: dos arrays paralelos "attributeKeys"/"attributeValues"
 * (uno por fila). Se mandan como arrays en vez de nombres tipo
 * attributes[material] porque FormData no soporta bien claves anidadas.
 * Las filas con la clave vacía se descartan (son filas en blanco del form).
 */
function attributesFromFormData(formData: FormData): Record<string, string> {
  const keys = formData.getAll("attributeKeys").map((v) => String(v).trim());
  const values = formData.getAll("attributeValues").map((v) => String(v).trim());
  const attributes: Record<string, string> = {};
  keys.forEach((key, i) => {
    if (key) attributes[key] = values[i] ?? "";
  });
  return attributes;
}

/**
 * Resuelve la imagen a usar a partir de un formulario que ofrece dos
 * opciones al usuario: subir un archivo ("imageFile") o pegar una URL
 * ("imageUrl"). El archivo subido tiene prioridad si ambos vienen presentes.
 */
async function resolveImageUrl(
  formData: FormData,
  fileFieldKey: string,
  urlFieldKey: string,
  subdir: string
): Promise<string> {
  if (hasUploadedFile(formData, fileFieldKey)) {
    const file = formData.get(fileFieldKey) as File;
    return saveUploadedImage(file, subdir);
  }
  return str(formData, urlFieldKey);
}

/** Estado que devuelven las server actions de producto (para useActionState
 * en ProductForm): null mientras no se envió nada, o un mensaje de error
 * legible cuando algo falla (imagen inválida, error de base de datos,
 * etc.) — en éxito no se devuelve nada porque redirect() corta la
 * ejecución antes.
 */
export type ProductFormState = { error: string } | null;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Product.sku es @unique en el schema (prisma/schema.prisma) — a nivel de
 * Postgres eso ya impide guardar dos productos con el mismo SKU, pero sin
 * esto el error se mostraba con el mensaje genérico de "no se pudo guardar
 * el producto", que no le decía a quien lo carga CUÁL fue el problema.
 * Prisma reporta una violación de unicidad con el código "P2002" y, en
 * meta.target, la columna que chocó (a veces como array, a veces como
 * string según el motor/adapter) — se revisan ambos formatos acá.
 */
function isSkuUniqueViolation(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
    return false;
  }
  const target = err.meta?.target;
  return Array.isArray(target) ? target.includes("sku") : String(target ?? "").includes("sku");
}

// ------------------------------------------------------------------
// Productos
// ------------------------------------------------------------------
export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const name = str(formData, "name");
  const categoryId = str(formData, "categoryId") || null;

  let imageUrl: string;
  try {
    imageUrl = await resolveImageUrl(formData, "imageFile", "imageUrl", "productos");
  } catch (err) {
    return { error: errorMessage(err, "No se pudo procesar la imagen.") };
  }

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        sku: str(formData, "sku") || null,
        price: num(formData, "price"),
        compareAtPrice: formData.get("compareAtPrice")
          ? num(formData, "compareAtPrice")
          : null,
        stock: num(formData, "stock"),
        shortDescription: str(formData, "shortDescription") || null,
        description: str(formData, "description") || null,
        attributes: attributesFromFormData(formData),
        isActive: formData.get("isActive") === "on",
        isFeatured: formData.get("isFeatured") === "on",
        categoryId,
        ...(imageUrl
          ? { images: { create: [{ url: imageUrl, position: 0 }] } }
          : {}),
      },
    });
    productId = product.id;
  } catch (err) {
    if (isSkuUniqueViolation(err)) {
      return { error: "Ya existe un producto con ese SKU. Usá uno diferente." };
    }
    return {
      error: errorMessage(
        err,
        "No se pudo guardar el producto. Revisá los datos e intentá de nuevo."
      ),
    };
  }

  revalidatePath("/admin/productos");
  redirect(`/admin/productos?creado=${productId}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  let imageUrl: string;
  try {
    imageUrl = await resolveImageUrl(formData, "imageFile", "imageUrl", "productos");
  } catch (err) {
    return { error: errorMessage(err, "No se pudo procesar la imagen.") };
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: str(formData, "name"),
        sku: str(formData, "sku") || null,
        price: num(formData, "price"),
        compareAtPrice: formData.get("compareAtPrice")
          ? num(formData, "compareAtPrice")
          : null,
        stock: num(formData, "stock"),
        shortDescription: str(formData, "shortDescription") || null,
        description: str(formData, "description") || null,
        attributes: attributesFromFormData(formData),
        isActive: formData.get("isActive") === "on",
        isFeatured: formData.get("isFeatured") === "on",
        categoryId: str(formData, "categoryId") || null,
        updatedAt: new Date(),
      },
    });

    if (imageUrl) {
      const existing = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { position: "asc" },
      });
      if (existing) {
        await prisma.productImage.update({
          where: { id: existing.id },
          data: { url: imageUrl },
        });
      } else {
        await prisma.productImage.create({
          data: { productId, url: imageUrl, position: 0 },
        });
      }
    }
  } catch (err) {
    if (isSkuUniqueViolation(err)) {
      return { error: "Ya existe un producto con ese SKU. Usá uno diferente." };
    }
    return {
      error: errorMessage(
        err,
        "No se pudo guardar el producto. Revisá los datos e intentá de nuevo."
      ),
    };
  }

  revalidatePath("/admin/productos");
  redirect("/admin/productos?actualizado=1");
}

export async function deleteProduct(formData: FormData) {
  // Segunda capa de verdad: aunque el botón de borrar está oculto para
  // staff en la UI (admin/productos/page.tsx), nada impide que alguien
  // dispare este action directo (devtools, curl con la cookie de sesión).
  // Borrar productos es solo para admin.
  await requireRole(["admin"]);

  const id = str(formData, "id");
  if (!id) return;
  await prisma.product.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/productos");
  redirect("/admin/productos?eliminado=1");
}

// ------------------------------------------------------------------
// Reseñas
// ------------------------------------------------------------------
// Las reseñas se publican solas apenas se envían (ver createReview en
// lib/actions.ts) — el dashboard de /admin/resenas ya no tiene un paso de
// aprobación, es de solo lectura salvo por poder borrar una reseña
// puntual (spam, contenido ofensivo). "Aprobar" se quitó a propósito:
// el equipo usa esta pantalla para VER qué calificaron y qué opinaron de
// cada producto y decidir mejoras por fuera del sistema, no para
// moderar qué se hace público.
export async function deleteReview(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;

  const review = await prisma.review
    .delete({
      where: { id },
      include: { product: { select: { slug: true } } },
    })
    .catch(() => null);

  if (review) {
    await recomputeProductRating(review.productId);
    if (review.product) revalidatePath(`/producto/${review.product.slug}`);
  }

  revalidatePath("/admin/resenas");
  redirect("/admin/resenas?eliminada=1");
}

// ------------------------------------------------------------------
// Categorías
// ------------------------------------------------------------------
/**
 * `position` es lo que decide el orden en el menú del sitio (categories.ts
 * ordena por position asc, name asc como desempate). Como `Category.position`
 * tiene @default(0) en el schema, si no se calcula acá TODAS las categorías
 * quedarían en 0 y el orden real terminaría siendo alfabético por nombre —
 * no el orden en que se fueron creando. Se calcula contando cuántas
 * categorías ya existen con el mismo padre (o sin padre) para que la nueva
 * quede al final, en el orden en que se va agregando desde el dashboard.
 */
async function nextCategoryPosition(parentId: string | null): Promise<number> {
  return prisma.category.count({ where: { parentId } });
}

/**
 * Crea una categoría/subcategoría por nombre — o, si ya existe una con el
 * mismo slug "limpio" (ej. "rostro" para "Rostro"), la ADOPTA en vez de
 * crear una fila duplicada.
 *
 * Esto importa porque antes, cuando el slug ya estaba en uso, se le pegaba
 * un sufijo random (`${slug}-${Date.now().toString(36)}`) y se creaba una
 * fila nueva de todos modos. Si esa colisión venía de una categoría que
 * había quedado suelta en el nivel superior (por ejemplo, de antes de que
 * existiera esta opción de subcategorías), el resultado era una subcategoría
 * nueva CON el padre correcto, pero la vieja fila suelta seguía ahí sin
 * padre — mostrándose como si fuera su propia categoría aparte, además de
 * aparecer anidada. Adoptar la fila existente (reasignarle el nombre,
 * parentId y position) en vez de duplicarla resuelve ese caso de raíz, y de
 * paso corrige cualquier categoría que ya hubiera quedado suelta así antes
 * de este fix.
 */
async function createOrAdoptCategory({
  name,
  parentId,
  position,
}: {
  name: string;
  parentId: string | null;
  position: number;
}) {
  const slug = slugify(name) || "categoria";
  const existing = await prisma.category.findUnique({ where: { slug } });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { name, parentId, position },
    });
  }

  return prisma.category.create({
    data: { name, slug, parentId, position },
  });
}

export async function createCategory(formData: FormData) {
  const name = str(formData, "name");
  // parentId presente -> se está creando una subcategoría dentro de una
  // categoría ya existente (viene de la mini-form "+ Agregar subcategoría"
  // de cada fila en /admin/productos/categorias). Sin parentId -> categoría
  // de nivel superior.
  const parentId = str(formData, "parentId") || null;

  const category = await createOrAdoptCategory({
    name,
    parentId,
    position: await nextCategoryPosition(parentId),
  });

  // Subcategorías opcionales creadas junto con la categoría nueva (solo
  // tiene sentido cuando se está creando una categoría de nivel superior,
  // no al agregar una subcategoría suelta). Si el campo viene vacío no se
  // crea nada — no es obligatorio.
  if (!parentId) {
    const subcategoryNames = formData
      .getAll("subcategoryNames")
      .map((value) => String(value).trim())
      .filter(Boolean);

    for (let i = 0; i < subcategoryNames.length; i++) {
      await createOrAdoptCategory({
        name: subcategoryNames[i],
        parentId: category.id,
        position: i,
      });
    }
  }

  revalidatePath("/admin/productos/categorias");
  redirect("/admin/productos/categorias?creado=1");
}

export async function deleteCategory(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  // onDelete: SetNull en Product.categoryId, así que borrar una categoría no
  // rompe los productos que la usaban (quedan sin categoría).
  await prisma.category.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/productos/categorias");
  redirect("/admin/productos/categorias?eliminado=1");
}

// ------------------------------------------------------------------
// Usuarios
// ------------------------------------------------------------------
// Borra una cuenta de staff (Auth + public.users). A propósito NO borra
// cuentas de rol "admin" (para que un admin no pueda quedarse sin acceso
// por error, ni borrar a otro admin desde acá) ni de rol "customer" (esas
// son de los clientes, se manejan aparte) — el filtro por rol se revalida
// acá adentro aunque el botón ya esté oculto en la UI para esos casos
// (admin/usuarios/page.tsx), por si alguien dispara el action directo.
//
// deleteUser() en Auth no dispara ningún trigger de DELETE (la migración
// solo cubre INSERT/UPDATE de auth.users), así que la fila de public.users
// se borra acá mismo, explícitamente, después de borrar la cuenta real.
export async function deleteStaffUser(formData: FormData) {
  await requireRole(["admin"]);

  const id = str(formData, "id");
  if (!id) return;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role !== "staff") {
    return;
  }

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id).catch(() => null);
  await prisma.user.delete({ where: { id } }).catch(() => null);

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?eliminado=1");
}

/** Estado que devuelve createStaffUser (para useActionState en
 * admin/usuarios/nuevo/page.tsx): null antes de enviar, { error } si algo
 * falló, { success: true, email, password } si la cuenta se creó — el
 * email y la contraseña se devuelven para que el admin los vea una sola
 * vez en pantalla y se los pase a la persona por otro medio (WhatsApp, en
 * persona, etc.).
 */
export type CreateStaffState =
  | { error: string }
  | { success: true; email: string; password: string }
  | null;

function isStaffRole(value: unknown): value is "staff" | "admin" {
  return value === "staff" || value === "admin";
}

// ------------------------------------------------------------------
// Crear staff/admin con contraseña fija — reemplaza tanto al viejo
// createUser (fila suelta sin cuenta real) como al esquema de invitación
// por correo que se probó primero. Se cambió a pedido explícito: el admin
// define la contraseña acá mismo y se la entrega a la persona por fuera del
// sistema (no hace falta que esa persona tenga acceso a un correo para
// activar su cuenta).
//
// auth.admin.createUser({ email, password, email_confirm: true }) crea la
// cuenta ya lista para usarse (email_confirm:true salta el paso de "confirmá
// tu correo" — no aplica acá porque no se manda ningún correo). El rol va
// aparte, en una segunda llamada a updateUserById, por la misma razón que en
// el resto del sistema: app_metadata solo lo puede escribir la Service Role
// Key, nunca la propia persona (ver lib/auth/session.ts). El trigger de la
// migración (prisma/migrations/20260827060011_...) copia todo esto a
// public.users automáticamente — no hace falta tocar Prisma acá para nada.
export async function createStaffUser(
  _prevState: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  await requireRole(["admin"]);

  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const role = str(formData, "role");
  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");

  if (!email) {
    return { error: "El correo es obligatorio." };
  }
  if (!isStaffRole(role)) {
    return { error: "Elegí un rol válido (staff o admin)." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      },
    });

    if (error || !data.user) {
      return { error: translateAuthError(error?.message) };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role },
    });
    if (updateError) {
      return { error: translateAuthError(updateError.message) };
    }
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "No se pudo crear la cuenta. Revisá la configuración de Supabase.",
    };
  }

  revalidatePath("/admin/usuarios");
  return { success: true, email, password };
}
