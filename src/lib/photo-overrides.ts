// Aplica overrides de fotos a la lista de productos del catálogo.
// Override format: { "<code>/<colorCode>": ["url1", "url2", ...] }
// Si una variante tiene override, su array `photos` se reemplaza.

export type PhotoOverrides = Record<string, string[]>;

export async function fetchPhotoOverrides(): Promise<PhotoOverrides> {
  try {
    const r = await fetch("/photo-overrides.json", { cache: "no-store" });
    if (!r.ok) return {};
    const j = await r.json();
    return j && typeof j === "object" ? (j as PhotoOverrides) : {};
  } catch {
    return {};
  }
}

type Variantish = { colorCode: string; photos: string[] };
type Productish = { code: string; variants: Variantish[] };

export function applyPhotoOverrides<P extends Productish>(
  products: P[],
  overrides: PhotoOverrides,
): P[] {
  if (!overrides || Object.keys(overrides).length === 0) return products;
  return products.map((p) => ({
    ...p,
    variants: p.variants.map((v) => {
      const key = `${p.code}/${v.colorCode}`;
      const ov = overrides[key];
      if (ov && ov.length) return { ...v, photos: ov };
      return v;
    }),
  }));
}
