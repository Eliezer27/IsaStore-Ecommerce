// Gate simple para /admin: no hay todavía un sistema de auth real (NextAuth
// no está instalado, NEXTAUTH_SECRET en .env es solo un placeholder para el
// futuro). Mientras tanto, /admin se protege con UNA sola contraseña
// compartida (ADMIN_PASSWORD en .env.local) en vez de cuentas individuales.
//
// No es un sistema de sesiones "de verdad": la cookie solo demuestra que en
// algún momento se ingresó la contraseña correcta. Suficiente para no dejar
// el panel abierto al público, pero se debería reemplazar por auth real
// (con usuarios/roles, ya modelado en prisma.User.role) antes de manejar
// datos sensibles de clientes reales en producción.
import { createHash } from "crypto";

export const ADMIN_AUTH_COOKIE = "admin_auth";

export function adminAuthToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export function isValidAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && input === expected;
}
