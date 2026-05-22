// Vista previa del catálogo mayorista (sin token → modo demo, el pedido
// no se envía). La app real está en /s/[token].
import CatalogClient from "../s/[token]/CatalogClient";

export default function PreviewPage() {
  return <CatalogClient />;
}
