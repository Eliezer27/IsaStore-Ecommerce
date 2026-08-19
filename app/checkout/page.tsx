export default function CheckoutPage() {
  return (
    <div className="container py-5">
      <h1 className="h4 mb-3">Checkout</h1>
      <p className="text-secondary">
        Pendiente: formulario de dirección (con autocompletar de Google
        Places), selección de método de pago (transferencia, cheque, contra
        entrega, PayPal) y los botones de PayPal (
        <code>@paypal/react-paypal-js</code>, ya instalado). Ver la sección 7
        del documento de arquitectura para el flujo completo de creación y
        captura de la orden.
      </p>
    </div>
  );
}
