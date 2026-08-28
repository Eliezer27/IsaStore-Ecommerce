// Supabase Auth siempre devuelve sus mensajes de error en inglés (el SDK no
// tiene i18n) — esto los traduce a español por coincidencia de texto, para
// que ninguna pantalla (signIn/signUp en lib/actions.ts, createStaffUser en
// lib/admin/actions.ts) le muestre a alguien un mensaje crudo tipo "email
// rate limit exceeded". No hay códigos de error estables en todas las
// versiones del SDK, así que el texto en inglés es lo único consistente
// para engancharse.
const TRANSLATIONS: [RegExp, string][] = [
  [
    /email rate limit exceeded/i,
    "Supabase alcanzó su límite de correos por ahora. Esperá unos minutos y probá de nuevo.",
  ],
  [/user already registered/i, "Ya existe una cuenta con ese correo."],
  [
    /signups not allowed|signups? (is|are) disabled/i,
    "El registro de nuevas cuentas está desactivado en la configuración de Supabase (Authentication → Providers → Email → \"Allow new users to sign up\").",
  ],
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [
    /email not confirmed/i,
    "Todavía no confirmaste tu correo — revisá tu bandeja de entrada.",
  ],
  [
    /for security purposes, you can only request this after/i,
    "Hiciste varios intentos seguidos. Esperá un momento y probá de nuevo.",
  ],
  [
    /password.*(at least|should be)/i,
    "La contraseña no cumple los requisitos mínimos (al menos 6 caracteres).",
  ],
  [/unable to validate email address/i, "Ese correo no tiene un formato válido."],
  [
    /email address .* is invalid/i,
    "Ese correo no es válido — probá con uno de un dominio real (Gmail, tu empresa, etc.), no uno inventado.",
  ],
];

export function translateAuthError(message: string | null | undefined): string {
  if (!message) {
    return "No se pudo completar la operación. Intentá de nuevo.";
  }
  for (const [pattern, spanish] of TRANSLATIONS) {
    if (pattern.test(message)) return spanish;
  }
  return "No se pudo completar la operación. Intentá de nuevo en unos minutos.";
}
