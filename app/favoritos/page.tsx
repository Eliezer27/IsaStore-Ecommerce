export default function WishlistPage() {
  return (
    <div className="container py-5">
      <h1 className="h4 mb-3">Favoritos</h1>
      <p className="text-secondary">
        Pendiente: lista de deseos conectada a la tabla <code>wishlists</code>
        {" "}(requiere login). Prioridad baja según el plan de migración.
      </p>
    </div>
  );
}
