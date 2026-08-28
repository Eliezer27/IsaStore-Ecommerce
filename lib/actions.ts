"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { translateAuthError } from "@/lib/auth/errors";
import { recomputeProductRating } from "@/lib/reviews";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function safeRedirectTarget(formData: FormData): string {
  const raw = str(formData, "redirectTo");
  return raw.startsWith("/") ? raw : "/cuenta";
}

/** Estado que devuelven signIn/signUp (para useActionState en
 * AccountAuthForms): null antes de enviar, { error } si algo falló,
 * { success: true } si el registro se hizo pero falta confirmar el correo
 * (cuando el proyecto de Supabase tiene esa opción activada — si no, se
 * redirige directo, así que este caso no siempre se ve).
 */
export type AuthFormState = { error: string } | { success: true } | null;

// ------------------------------------------------------------------
// Cuenta de cliente (público) — login/registro reales vía Supabase Auth.
// El rol queda "customer" por default (lo pone el trigger de la migración,
// ver prisma/migrations/20260827060011_supabase_auth_sync), así que estas
// dos acciones nunca tocan app_metadata directamente — eso es exclusivo del
// flujo de creación de staff (createStaffUser en lib/admin/actions.ts).
export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectTarget(formData);

  if (!email || !password) {
    return { error: "Completá tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(redirectTo);
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const firstName = str(formData, "firstName");
  const redirectTo = safeRedirectTarget(formData);

  if (!email || !password) {
    return { error: "Completá tu correo y contraseña." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName || undefined },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Si el proyecto de Supabase tiene "confirmar correo" activado, signUp
  // no abre sesión todavía (data.session viene null) — se le avisa a la
  // persona que revise su correo en vez de redirigirla. Si está
  // desactivado, ya queda logueada al toque.
  if (data.session) {
    redirect(redirectTo);
  }

  return { success: true };
}

/** Estado que devuelve createReview (para useActionState en WriteReviewForm):
 * null antes de enviar, { error } si algo falló, { success: true } si la
 * reseña se guardó y ya quedó publicada.
 */
export type ReviewFormState = { error: string } | { success: true } | null;

// ------------------------------------------------------------------
// Reseñas (público, sin login — la tienda todavía no tiene cuentas de
// cliente reales, ver app/(site)/cuenta/page.tsx). Se publican solas, sin
// aprobación: isApproved queda en true desde que se crean, y acá mismo se
// recalcula Product.ratingAvg/ratingCount para que el promedio se vea
// actualizado al toque. /admin/resenas (lib/admin/actions.ts) ya no
// modera qué se hace público — es solo para que el equipo vea qué
// calificaron/opinaron de cada producto y pueda borrar una reseña puntual
// si hace falta (spam, contenido ofensivo).
export async function createReview(
  productId: string,
  productSlug: string,
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const ratingRaw = Number(formData.get("rating"));
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "Elegí una calificación de 1 a 5 estrellas." };
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId,
        rating: ratingRaw,
        comment: str(formData, "comment") || null,
        isApproved: true,
      },
    });
    await recomputeProductRating(review.productId);
  } catch (err) {
    return {
      error:
        err instanceof Error && err.message
          ? err.message
          : "No se pudo guardar la reseña. Intentá de nuevo.",
    };
  }

  revalidatePath(`/producto/${productSlug}`);
  return { success: true };
}
