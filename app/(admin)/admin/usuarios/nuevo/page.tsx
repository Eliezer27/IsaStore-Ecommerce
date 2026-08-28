"use client";

import { useActionState, useState } from "react";
import { createStaffUser, type CreateStaffState } from "@/lib/admin/actions";

// El admin define la contraseña directo (en vez del flujo de invitación por
// correo que se probó primero) — así no hace falta que la persona invitada
// tenga acceso a un correo real para activar su cuenta. Vos como admin la
// creás, la ves en pantalla una sola vez, y se la pasás por otro medio
// (WhatsApp, en persona, etc.) — ver createStaffUser en lib/admin/actions.ts.
function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

export default function NewUserPage() {
  const [state, formAction, pending] = useActionState<CreateStaffState, FormData>(
    createStaffUser,
    null
  );
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCredentials(email: string, pass: string) {
    try {
      await navigator.clipboard.writeText(`Correo: ${email}\nContraseña: ${pass}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, la persona igual puede
      // seleccionar el texto a mano — no es un error grave.
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h4>Nuevo usuario</h4>
          <h6>Crear una cuenta de staff o administrador</h6>
        </div>
      </div>

      <div className="alert alert-info">
        Definís la contraseña vos mismo acá abajo. Una vez creada la cuenta,
        vas a ver el correo y la contraseña en pantalla — copialos y
        pasáselos a la persona por otro medio (WhatsApp, en persona, etc.).
        No se guardan en ningún otro lado ni se vuelven a mostrar después.
      </div>

      {state && "success" in state && (
        <div className="alert alert-success" role="status">
          <p className="mb-8 fw-semibold">¡Cuenta creada! Pasále estos datos:</p>
          <div className="mb-8">
            <div>
              <strong>Correo:</strong> {state.email}
            </div>
            <div>
              <strong>Contraseña:</strong> {state.password}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={() => copyCredentials(state.email, state.password)}
          >
            {copied ? "¡Copiado!" : "Copiar correo y contraseña"}
          </button>
        </div>
      )}
      {state && "error" in state && (
        <div className="alert alert-danger" role="alert">
          {state.error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form action={formAction}>
            <div className="row">
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" name="firstName" className="form-control" />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input type="text" name="lastName" className="form-control" />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" required />
                </div>
              </div>
              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label">Rol</label>
                  <select name="role" className="form-control form-select" defaultValue="staff">
                    <option value="staff">Staff</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <div className="d-flex gap-8">
                    <input
                      type="text"
                      name="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                      placeholder="Al menos 8 caracteres"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary text-nowrap"
                      onClick={() => setPassword(randomPassword())}
                    >
                      Generar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-submit me-2" disabled={pending}>
              {pending ? "Creando..." : "Crear cuenta"}
            </button>
            <a href="/admin/usuarios" className="btn btn-cancel">
              Cancelar
            </a>
          </form>
        </div>
      </div>
    </>
  );
}
