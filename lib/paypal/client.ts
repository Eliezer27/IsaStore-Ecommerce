import "server-only";

// Cliente mínimo de la REST API de PayPal (Orders API v2). No usamos un SDK:
// son dos llamadas (crear orden, capturar orden) más el token OAuth, así que
// fetch alcanza y evitamos una dependencia extra.
//
// Todo esto vive del lado del servidor (los endpoints en app/api/paypal/*).
// PAYPAL_CLIENT_SECRET nunca debe llegar al navegador — solo se usa acá.

const PAYPAL_BASE_URLS = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
} as const;

/** Base URL según PAYPAL_MODE (sandbox por defecto, para no cobrar de verdad
 * por accidente si la variable falta). */
export function paypalBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? PAYPAL_BASE_URLS.live
    : PAYPAL_BASE_URLS.sandbox;
}

/** true si hay credenciales cargadas — lo usa el checkout para decidir si
 * mostrar los botones de PayPal o el aviso de "Próximamente". */
export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** Los precios del catálogo están en NIO (córdoba), pero PayPal NO admite NIO
 * como moneda de cobro. Cobramos en USD usando una tasa fija configurable en
 * .env (NIO_TO_USD_RATE). Si la variable falta o es inválida, tiramos error en
 * vez de cobrar un monto equivocado. */
export const PAYPAL_CURRENCY = "USD";

export function nioToUsd(amountNio: number): string {
  const rate = Number(process.env.NIO_TO_USD_RATE);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(
      "NIO_TO_USD_RATE no está configurada (o es inválida). Definí la tasa NIO→USD en .env.local para poder cobrar con PayPal."
    );
  }
  const usd = amountNio * rate;
  // PayPal rechaza montos <= 0 y exige a lo sumo 2 decimales para USD.
  return (Math.round(usd * 100) / 100).toFixed(2);
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // Nunca cachear el token acá — cada request de checkout pide uno fresco.
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`No se pudo autenticar con PayPal (${res.status}). ${detail}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("PayPal no devolvió un access_token.");
  }
  return data.access_token;
}

type PayPalAmount = { currency_code: string; value: string };

export type PayPalOrder = {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: PayPalAmount;
      }>;
    };
  }>;
};

/** Crea una orden en PayPal (intent CAPTURE) por el monto en USD indicado.
 * Devuelve el objeto de la orden — el id es el que el botón del cliente usa
 * para aprobar el pago. */
export async function createPayPalOrder(params: {
  amountUsd: string;
  orderNumber: string;
}): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.orderNumber,
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: params.amountUsd,
          },
        },
      ],
    }),
  });

  const data = (await res.json().catch(() => null)) as PayPalOrder | null;
  if (!res.ok || !data?.id) {
    throw new Error(
      `PayPal rechazó la creación de la orden (${res.status}). ${JSON.stringify(data)}`
    );
  }
  return data;
}

/** Captura (cobra) una orden ya aprobada por el comprador. El pago solo queda
 * confirmado si el status del capture es "COMPLETED". */
export async function capturePayPalOrder(paypalOrderId: string): Promise<PayPalOrder> {
  const token = await getAccessToken();
  const res = await fetch(
    `${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = (await res.json().catch(() => null)) as PayPalOrder | null;
  if (!res.ok || !data?.id) {
    throw new Error(
      `PayPal rechazó la captura de la orden (${res.status}). ${JSON.stringify(data)}`
    );
  }
  return data;
}
