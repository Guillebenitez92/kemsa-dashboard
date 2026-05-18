"use client";

// VISTA PREVIA v2 — concepto "elegí por color" con la PALETA REAL del
// catálogo Mormaii Sports (extraída del catálogo vía Canva). Datos de
// muestra para validar la interacción (click en color -> productos de
// ese color). NO funcional, no toca /s/[token].

import { useMemo, useState } from "react";

type Color = { code: string; name: string; hex: string };

// Paleta real de temporada (código de color del catálogo -> aprox. hex).
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
  { code: "00418", name: "Verde Militar", hex: "#5a5f3a" },
  { code: "01339", name: "Vermelho Blood", hex: "#8e2f2f" },
  { code: "00832", name: "Vinho Syrah", hex: "#5a2233" },
  { code: "00150", name: "Amarelo", hex: "#e8c34a" },
];
const HEX: Record<string, Color> = Object.fromEntries(
  PALETTE.map((c) => [c.code, c]),
);

type Prod = {
  code: string;
  name: string;
  category: string;
  gender: "Mujer" | "Hombre";
  colors: string[]; // códigos de color reales del catálogo
};

// Muestra real (códigos y colores del catálogo Sports).
const PRODS: Prod[] = [
  { code: "80578", name: "Cropped Meia Malha estampa", category: "Cropped", gender: "Mujer", colors: ["00548", "01237", "01240", "01268", "01263", "01238" ] },
  { code: "80582", name: "Camiseta Alongada Meia Malha", category: "Remeras", gender: "Mujer", colors: ["01237", "00548", "01240", "01238", "01263", "01268"] },
  { code: "80580", name: "Shorts Básico Mary", category: "Shorts", gender: "Mujer", colors: ["01400", "00548", "00467", "01401", "01402", "00858"] },
  { code: "80608", name: "Top Nadador Mary", category: "Tops", gender: "Mujer", colors: ["01400", "00548", "00467", "01401", "01402", "00858"] },
  { code: "80586", name: "Legging Básica Mary bolsos", category: "Calzas / Leggings", gender: "Mujer", colors: ["01400", "00548", "00467", "01401", "01402", "00858"] },
  { code: "80599", name: "Vestido Curto Mary", category: "Vestidos", gender: "Mujer", colors: ["01400", "01401", "01402", "00548"] },
  { code: "80646", name: "Legging Power Comfy", category: "Calzas / Leggings", gender: "Mujer", colors: ["01051", "01393", "01268", "01395", "00771", "01396", "01397", "00548"] },
  { code: "80647", name: "Top Power Comfy", category: "Tops", gender: "Mujer", colors: ["01051", "01393", "01268", "01395", "00771", "01396", "01397", "00548"] },
  { code: "80650", name: "Legging Power Comfy bolsos", category: "Calzas / Leggings", gender: "Mujer", colors: ["01393", "01398"] },
  { code: "80630", name: "Top Power Comfy costas", category: "Tops", gender: "Mujer", colors: ["01190", "00548"] },
  { code: "80672", name: "Saia Dry Fresh Comfy", category: "Polleras", gender: "Mujer", colors: ["01421", "01396"] },
  { code: "80594", name: "Calça Flare Gloss", category: "Pantalones", gender: "Mujer", colors: ["00548", "00908"] },
  { code: "80637", name: "Regata Alongada Cotton", category: "Musculosas", gender: "Mujer", colors: ["01339", "00548", "00550", "01237", "01238", "01413"] },
  { code: "80639", name: "Polo Essence Cropped", category: "Camisas", gender: "Mujer", colors: ["00547", "01238"] },
  { code: "80660", name: "Camiseta Helanca estampa", category: "Remeras", gender: "Hombre", colors: ["00547", "01238"] },
  { code: "80661", name: "Camiseta Meia Malha estampa", category: "Remeras", gender: "Hombre", colors: ["00547", "00582"] },
  { code: "80689", name: "Camiseta Cristal recorte Dry", category: "Remeras", gender: "Hombre", colors: ["00548", "01051"] },
  { code: "80696", name: "Bermuda Cristal reflectivo", category: "Bermudas", gender: "Hombre", colors: ["01420", "00548"] },
  { code: "80697", name: "Bermuda Cristal elástico", category: "Bermudas", gender: "Hombre", colors: ["01396", "00548"] },
  { code: "80693", name: "Camiseta Dry Fresh gola", category: "Remeras", gender: "Hombre", colors: ["00548", "01416"] },
  { code: "80699", name: "Machão Dry Fresh", category: "Musculosas", gender: "Hombre", colors: ["01416", "00548"] },
  { code: "583211", name: "Camiseta Malha Modal", category: "Remeras", gender: "Hombre", colors: ["00548", "01247"] },
  { code: "056056", name: "Bermuda Tactel c/ elastano", category: "Bermudas", gender: "Hombre", colors: ["00165", "00600", "00162", "00548", "00922", "01084"] },
  { code: "583214", name: "Boné estructurado", category: "Accesorios", gender: "Hombre", colors: ["00548", "00582", "01238", "01240"] },
];

export default function PreviewColors() {
  const [gender, setGender] = useState<"Mujer" | "Hombre" | "">("");
  const [active, setActive] = useState<string>("");

  const pool = useMemo(
    () => (gender ? PRODS.filter((p) => p.gender === gender) : PRODS),
    [gender],
  );

  // Solo colores que tienen al menos un producto (en el género elegido).
  const colors = useMemo(() => {
    const used = new Set<string>();
    pool.forEach((p) => p.colors.forEach((c) => used.add(c)));
    return PALETTE.filter((c) => used.has(c.code));
  }, [pool]);

  const items = active ? pool.filter((p) => p.colors.includes(active)) : [];
  const activeColor = active ? HEX[active] : null;

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center text-[12px] text-amber-800">
        Vista previa v2 · paleta REAL del catálogo · datos de muestra · NO
        funcional — para aprobar el concepto antes de migrar la encuesta
      </div>

      <header className="px-5 sm:px-8 pt-7 pb-3 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400">
            Mormaii Sports · Verão 27
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
            Elegí por color
          </h1>
        </div>
        <div className="flex rounded-full border border-stone-300 overflow-hidden">
          {(["", "Mujer", "Hombre"] as const).map((g) => (
            <button
              key={g || "all"}
              onClick={() => {
                setGender(g);
                setActive("");
              }}
              className={`px-4 py-2 text-sm ${
                gender === g
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600"
              }`}
            >
              {g === "" ? "Todos" : g}
            </button>
          ))}
        </div>
      </header>

      {/* Mosaico de colores tipo catálogo */}
      <section className="px-5 sm:px-8 py-5">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {colors.map((c) => {
            const n = pool.filter((p) => p.colors.includes(c.code)).length;
            const on = active === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setActive(on ? "" : c.code)}
                className={`relative rounded-lg overflow-hidden border text-left transition ${
                  on
                    ? "ring-2 ring-stone-900 border-stone-900"
                    : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <div
                  className="aspect-[4/5] w-full flex items-start justify-start p-3"
                  style={{ backgroundColor: c.hex }}
                >
                  <span
                    className="text-[11px] font-medium leading-tight"
                    style={{
                      color: isLight(c.hex) ? "#1a1a1a" : "#ffffff",
                    }}
                  >
                    {c.name}
                    <br />
                    <span className="opacity-70">{c.code}</span>
                  </span>
                </div>
                <span className="block text-center text-[11px] text-stone-500 py-1.5 bg-white">
                  {n} {n === 1 ? "modelo" : "modelos"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Productos del color elegido */}
      {activeColor && (
        <section className="px-5 sm:px-8 pb-16 border-t border-stone-200 pt-6">
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-full border border-stone-300"
              style={{ backgroundColor: activeColor.hex }}
            />
            <h2 className="text-xl font-semibold tracking-tight">
              {activeColor.name}
            </h2>
            <span className="text-sm text-stone-400">
              {items.length} {items.length === 1 ? "modelo" : "modelos"} en
              este color
            </span>
            <button
              onClick={() => setActive("")}
              className="ml-auto text-xs text-stone-500 underline underline-offset-4"
            >
              ✕ Quitar filtro
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
            {items.map((p) => (
              <div key={p.code} className="flex flex-col">
                <div
                  className="aspect-[3/4] w-full rounded-lg border border-stone-100 flex items-end justify-center"
                  style={{
                    background: `linear-gradient(165deg, ${activeColor.hex} 0%, #ffffff 135%)`,
                  }}
                >
                  <span className="mb-3 text-[10px] uppercase tracking-wide text-stone-600 bg-white/85 px-2 py-0.5 rounded-full">
                    foto del producto en {activeColor.name}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-wide text-stone-400 mt-3">
                  {p.gender} · {p.category}
                </p>
                <p className="text-sm mt-1 leading-snug">{p.name}</p>
                <div className="mt-2 flex gap-1.5 items-center">
                  {p.colors.slice(0, 8).map((cc) => (
                    <span
                      key={cc}
                      title={HEX[cc]?.name || cc}
                      className={`h-4 w-4 rounded-full border ${
                        cc === active ? "border-stone-900" : "border-stone-300"
                      }`}
                      style={{ backgroundColor: HEX[cc]?.hex || "#ccc" }}
                    />
                  ))}
                  <span className="text-[11px] text-stone-400 ml-1">
                    {p.colors.length} colores
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!activeColor && (
        <p className="px-5 sm:px-8 pb-16 text-center text-sm text-stone-400">
          Tocá un color para ver los modelos disponibles en ese color.
        </p>
      )}
    </main>
  );
}

function isLight(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
