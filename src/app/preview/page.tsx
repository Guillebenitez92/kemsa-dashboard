"use client";

// VISTA PREVIA v4 — catálogo estilo vuoriclothing.com con FOTOS REALES
// de los productos (mismas del catálogo que ya funciona) + swatches de
// color por producto. NO funcional, no toca /s/[token].

import { useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "@/lib/products";

type Color = { code: string; name: string; hex: string };

const PALETTE: Color[] = [
  { code: "00548", name: "Preto", hex: "#1a1a1a" },
  { code: "00547", name: "Branco", hex: "#f4f3ef" },
  { code: "01400", name: "Cinza Dark", hex: "#6f6f6f" },
  { code: "01420", name: "Cinza Silver", hex: "#bdbdbd" },
  { code: "00162", name: "Chumbo", hex: "#4b4f54" },
  { code: "01237", name: "Cinza Cacau", hex: "#8c7f6e" },
  { code: "00467", name: "Marrom Mocha", hex: "#5b4334" },
  { code: "01413", name: "Marrom Café", hex: "#6b4b3a" },
  { code: "01247", name: "Marrom Brownie", hex: "#4a3326" },
  { code: "01396", name: "Light Brown", hex: "#b08a6a" },
  { code: "01397", name: "Argila", hex: "#b58463" },
  { code: "00408", name: "Bege", hex: "#d8c4a8" },
  { code: "01240", name: "Bege Beijinho", hex: "#e6d5bf" },
  { code: "00101", name: "Bege Beijinho", hex: "#e6d5bf" },
  { code: "00165", name: "Areia", hex: "#cdbfa3" },
  { code: "01402", name: "Rosa Pop", hex: "#ec5aa0" },
  { code: "01398", name: "Ultra Pink", hex: "#ef4f9a" },
  { code: "01395", name: "Rosa Melancia", hex: "#e8657f" },
  { code: "01263", name: "Rosa Avelã", hex: "#d8a79e" },
  { code: "00474", name: "Rosa", hex: "#e3a9c0" },
  { code: "01268", name: "Roxo Framboesa", hex: "#7d3a59" },
  { code: "01401", name: "Roxo Dark", hex: "#6e5566" },
  { code: "01190", name: "Lilás", hex: "#b9a7d6" },
  { code: "01412", name: "Lilás Flower", hex: "#c7c3e0" },
  { code: "01238", name: "Azul Chantilly", hex: "#a9c7d6" },
  { code: "00858", name: "Azul Índigo", hex: "#3a5a78" },
  { code: "01051", name: "Azul Steel", hex: "#4f6b86" },
  { code: "01393", name: "Marinho Clássico", hex: "#27324c" },
  { code: "01416", name: "Classic Navy", hex: "#25324d" },
  { code: "00600", name: "Marinho", hex: "#1f2a44" },
  { code: "00550", name: "Azul Eclipse", hex: "#2e3b55" },
  { code: "00582", name: "Azul Side", hex: "#3f5e86" },
  { code: "00771", name: "Verde Forest", hex: "#34503a" },
  { code: "01421", name: "Verde Mint", hex: "#9fc7b0" },
  { code: "01415", name: "Verde Palmeira", hex: "#2f5d3a" },
  { code: "00150", name: "Amarelo", hex: "#e8c34a" },
  { code: "00908", name: "Vinho", hex: "#5a2233" },
  { code: "01339", name: "Vermelho", hex: "#8e2f2f" },
];
const HEX: Record<string, Color> = Object.fromEntries(
  PALETTE.map((c) => [c.code, c]),
);

// Colores reales por producto (muestra extraída del catálogo Sports).
const COLORS: Record<string, string[]> = {
  "80578": ["00548", "01237", "00101", "01268", "01263", "01238"],
  "80582": ["01237", "00548", "01240", "01238", "01263", "01268"],
  "80580": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80608": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80586": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80574": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80584": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80576": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80587": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80579": ["01400", "00548", "00467", "01401", "01402", "00858"],
  "80599": ["01400", "01401", "01402", "00548"],
  "80575": ["01400", "01401", "01402", "00548"],
  "80634": ["01400", "01401", "00858", "00548"],
  "80646": ["01051", "01393", "01268", "01395", "00771", "01396", "01397", "00548"],
  "80647": ["01051", "01393", "01268", "01395", "00771", "01396", "01397", "00548"],
  "80648": ["01051", "01393", "01268", "01395", "00771", "01396", "01397", "00548"],
  "80650": ["01393", "01398"],
  "80651": ["01393", "01398"],
  "80630": ["01190", "00548"],
  "80628": ["01190", "00548"],
  "80629": ["01190", "00548"],
  "80672": ["01421", "01396"],
  "80673": ["01421", "01396"],
  "80594": ["00548", "00908"],
  "80595": ["00548", "00908"],
  "80602": ["00548", "00908"],
  "80637": ["01339", "00548", "00550", "01237", "01238", "01413"],
  "80641": ["01339", "00548", "00550", "01237", "01238", "01413"],
  "80639": ["00547", "01238"],
  "80660": ["00547", "01238"],
  "80661": ["00547", "00582"],
  "80689": ["00548", "01051"],
  "80696": ["01420", "00548"],
  "80697": ["01396", "00548"],
  "80693": ["00548", "01416"],
  "80699": ["01416", "00548"],
  "583211": ["00548", "01247"],
};

const USD_PYG = 6500;
function priceLabel(n: number) {
  const g = Math.round((n * USD_PYG) / 1000) * 1000;
  return `US$ ${Math.round(n)} · ₲ ${new Intl.NumberFormat("es-PY").format(g)}`;
}
function driveUrl(id: string, w = 700) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
}

const SPORTS = PRODUCTS.filter((p) => p.division === "Sports").map((p) => ({
  code: p.code,
  imgCode: p.imgCode,
  name: p.name,
  category: p.category,
  gender: p.gender,
  retail: p.retail,
}));

function Img({ id, alt }: { id: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err || !id)
    return (
      <div className="aspect-[3/4] w-full bg-stone-100 flex items-center justify-center text-stone-300 text-xs">
        sin foto
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={driveUrl(id)}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="aspect-[3/4] w-full object-cover bg-stone-100 group-hover:opacity-90 transition"
    />
  );
}

export default function PreviewCatalog() {
  const [manifest, setManifest] = useState<Record<string, string[]> | null>(
    null,
  );
  const [gender, setGender] = useState<"Mujer" | "Hombre" | "">("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    fetch("/products/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && typeof m === "object" && setManifest(m))
      .catch(() => {});
  }, []);

  const withPhoto = useMemo(
    () =>
      manifest
        ? SPORTS.filter((p) => (manifest[p.imgCode] || []).length > 0)
        : [],
    [manifest],
  );

  const cats = useMemo(() => {
    const s = new Set<string>();
    withPhoto.forEach((p) => {
      if (!gender || p.gender === gender) s.add(p.category);
    });
    return Array.from(s).sort();
  }, [withPhoto, gender]);

  const pool = withPhoto.filter(
    (p) => (!gender || p.gender === gender) && (!cat || p.category === cat),
  );

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center text-[12px] text-amber-800">
        Vista previa v4 · fotos reales del catálogo + colores por producto ·
        para aprobar el diseño antes de migrar la encuesta
      </div>

      <header className="px-5 sm:px-10 pt-8 pb-4">
        <p className="text-[11px] tracking-[0.32em] uppercase text-stone-400">
          Mormaii Sports · Verão 27
        </p>
        <h1 className="mt-1 text-3xl sm:text-5xl font-semibold tracking-tight">
          Catálogo
        </h1>
      </header>

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-y border-stone-200 px-5 sm:px-10 py-3 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-stone-300 overflow-hidden">
          {(["", "Mujer", "Hombre"] as const).map((g) => (
            <button
              key={g || "all"}
              onClick={() => {
                setGender(g);
                setCat("");
              }}
              className={`px-5 py-2 text-sm ${
                gender === g
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600"
              }`}
            >
              {g === "" ? "Todos" : g}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          <Chip on={!cat} onClick={() => setCat("")}>
            Todas
          </Chip>
          {cats.map((c) => (
            <Chip key={c} on={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <span className="ml-auto text-xs text-stone-400">
          {manifest === null ? "Cargando…" : `${pool.length} productos`}
        </span>
      </div>

      <section className="px-5 sm:px-10 py-8">
        {manifest === null ? (
          <p className="text-center text-stone-400 py-24">
            Cargando catálogo…
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {pool.map((p) => {
              const imgs = manifest[p.imgCode] || [];
              const cols = COLORS[p.code] || [];
              return (
                <div key={p.code} className="group flex flex-col">
                  <div className="overflow-hidden rounded-lg">
                    <Img id={imgs[0] || ""} alt={p.name} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mt-3">
                    {p.gender} · {p.category}
                  </p>
                  <p className="text-[15px] mt-1 leading-snug">{p.name}</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {priceLabel(p.retail)}
                  </p>
                  {cols.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {cols.map((cc) => (
                        <span
                          key={cc}
                          title={HEX[cc]?.name || cc}
                          className="h-5 w-5 rounded-full border border-stone-300"
                          style={{ backgroundColor: HEX[cc]?.hex || "#ccc" }}
                        />
                      ))}
                      <span className="text-[11px] text-stone-500 ml-1">
                        {cols.length} colores
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full border transition ${
        on
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-white text-stone-600 border-stone-300 hover:border-stone-900"
      }`}
    >
      {children}
    </button>
  );
}
