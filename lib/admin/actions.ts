"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ------------------------------------------------------------------
// Productos
// ------------------------------------------------------------------
export async function createProduct(formData: FormData) {
  const name = str(formData, "name");
  const categoryId = str(formData, "categoryId") || null;
  const imageUrl = str(formData, "imageUrl");

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
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      categoryId,
      ...(imageUrl
        ? { images: { create: [{ url: imageUrl, position: 0 }] } }
        : {}),
    },
  });

  revalidatePath("/admin/productos");
  redirect(`/admin/productos?creado=${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const imageUrl = str(formData, "imageUrl");

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

  revalidatePath("/admin/productos");
  redirect("/admin/productos?actualizado=1");
}

export async function deleteProduct(formData: FormData) {
  const id = str(formData, "id");
  if (!id) return;
  await prisma.product.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/productos");
  redirect("/admin/productos?eliminado=1");
}

// ------------------------------------------------------------------
// Categorías
// ------------------------------------------------------------------
export async function createCategory(formData: FormData) {
  const name = str(formData, "name");
  await prisma.category.create({
    data: {
      name,
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      imageUrl: str(formData, "imageUrl") || null,
    },
  });
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
export async function createUser(formData: FormData) {
  const email = str(formData, "email");
  await prisma.user.create({
    data: {
      email,
      firstName: str(formData, "firstName") || null,
      lastName: str(formData, "lastName") || null,
      phone: str(formData, "phone") || null,
      role: str(formData, "role") || "customer",
      isActive: formData.get("isActive") === "on",
    },
  });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?creado=1");
}
