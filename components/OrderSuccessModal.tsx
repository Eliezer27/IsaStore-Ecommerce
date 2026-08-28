"use client";

import Link from "next/link";

// Popup de "pago exitoso" al terminar el checkout (createOrder en
// lib/checkout/actions.ts). Estilos inline a propósito: es un overlay de
// página completa que tiene que funcionar sí o sí sin depender de que
// alguna clase Bootstrap/CSS del tema esté disponible en este contexto.
export default function OrderSuccessModal({
  orderNumber,
  onClose,
}: {
  orderNumber: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        background: "rgba(17, 17, 17, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 32px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#e9f9ee",
            color: "#1f9d55",
            fontSize: 36,
            marginBottom: 20,
          }}
        >
          <i className="ph-bold ph-check" />
        </span>

        <h3 id="order-success-title" className="mb-8" style={{ fontSize: 22 }}>
          ¡Pago realizado exitosamente!
        </h3>
        <p className="text-gray-500 mb-24">
          Tu pedido <strong>{orderNumber}</strong> quedó registrado. Te vamos a contactar para
          confirmar los detalles de la entrega.
        </p>

        <div className="d-flex flex-column gap-8">
          <Link href="/shop" className="btn btn-main w-100" onClick={onClose}>
            Seguir comprando
          </Link>
          <Link href="/" className="btn btn-outline-dark w-100" onClick={onClose}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
