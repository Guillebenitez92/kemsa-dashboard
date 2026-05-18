"use client";

// VISTA PREVIA DE DISEÑO — NO funcional, datos de muestra.
// Objetivo: mostrar la dirección visual estilo vuoriclothing.com
// (elegí por color + categorías + Hombre/Mujer) antes de migrar la
// encuesta real. No toca /s/[token].

import { useMemo, useState } from "react";

// Nombre de color (portugués, como viene en el catálogo) -> color aprox.
const COLOR_HEX: Record<string, string> = {
  PRETO: "#1a1a1a",
  BRANCO: "#f5f5f3",
  "CINZA CACAU": "#8a7d6b",
  CHUMBO: "#4b4f54",
  CINZA: "#9a9a9a",
  MARINHO: "#1f2a44",
  "AZUL CHANTILLY": "#9fc4d6",
  "AZUL": "#2f5e8d",
  "BEGE BEIJINHO": "#e7d8c3",
  BEGE: "#d8c4a8",
  AREIA: "#cdbfa3",
  CAQUI: "#7c734f",
  "VERDE": "#3f6b4f",
  "VERDE MILITAR": "#5a5f3a",
  "ROSA AVELÃ": "#d8a7a0",
  "ROSA": "#e3a9c0",
  "ROXO FRAMBOESA": "#7c3a5a",
  "MARROM": "#5b3f2e",
  "MARROM BROWNIE": "#4a3326",
  VERMELHO: "#b23a2f",
  AMARELO: "#e6c44d",
};
function hexOf(name: string) {
  return COLOR_HEX[name.toUpperCase()] ?? "#c9c4bd";
}

type Sample = {
  name: string;
  category: string;
  gender: "Mujer" | "Hombre";
  price: number;
  colors: string[];
};

const SAMPLE: Sample[] = [
  { name: "Cropped Meia Malha con estampa", category: "Tops", gender: "Mujer", price: 14, colors: ["PRETO", "CINZA CACAU", "BEGE BEIJINHO", "ROXO FRAMBOESA", "ROSA AVELÃ", "AZUL CHANTILLY"] },
  { name: "Camiseta Malha Cotton", category: "Remeras", gender: "Hombre", price: 21, colors: ["BRANCO", "PRETO", "MARINHO", "CAQUI"] },
  { name: "Bermuda Sarja", category: "Bermudas", gender: "Hombre", price: 60, colors: ["CAQUI", "MARINHO", "PRETO"] },
  { name: "Calça Jeans Slim", category: "Pantalones", gender: "Hombre", price: 50, colors: ["AZUL", "PRETO", "CINZA"] },
  { name: "Camisa Piquet Polo", category: "Camisas", gender: "Hombre", price: 25, colors: ["BRANCO", "MARINHO", "VERDE", "VERMELHO"] },
  { name: "Regata Ribana Canelada", category: "Tanks", gender: "Mujer", price: 12, colors: ["PRETO", "BRANCO", "ROSA"] },
  { name: "Blusa Moletom", category: "Blusas", gender: "Mujer", price: 22, colors: ["BEGE", "PRETO", "ROXO FRAMBOESA"] },
  { name: "Short Tactel Hydronatic", category: "Shorts", gender: "Hombre", price: 27, colors: ["MARINHO", "PRETO", "VERDE MILITAR"] },
  { name: "Calça Jeans Wide Leg", category: "Pantalones", gender: "Mujer", price: 58, colors: ["AZUL", "PRETO"] },
  { name: "Camiseta M/M Pent estampa", category: "Remeras", gender: "Mujer", price: 13, colors: ["BRANCO", "ROSA AVELÃ", "AZUL CHANTILLY", "BEGE BEIJINHO"] },
  { name: "Baby Tee Malha Cotton", category: "Tops", gender: "Mujer", price: 17, colors: ["PRETO", "BRANCO", "ROSA"] },
  { name: "Boardshorts Tactel", category: "Shorts", gender: "Hombre", price: 41, colors: ["MARINHO", "PRETO", "AMARELO"] },
];

export default function PreviewPLP() {
  const [gender, setGender] = useState<"Mujer" | "Hombre">("Mujer");
  const [cat, setCat] = useState("");
  const [color, setColor] = useState("");

  const byGender = useMemo(
    () => SAMPLE.filter((s) => s.gender === gender),
    [gender],
  );
  const cats = useMemo(
    () => Array.from(new Set(byGender.map((s) => s.category))),
    [byGender],
  );
  const colors = useMemo(() => {
    const set = new Set<string>();
    byGender.forEach((s) => s.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [byGender]);

  const items = byGender.filter(
    (s) =>
      (!cat || s.category === cat) && (!color || s.colors.includes(color)),
  );

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center text-[12px] text-amber-800">
        Vista previa de diseño · datos de muestra · NO funcional — para
        aprobar la dirección antes de migrar la encuesta real
      </div>

      <header className="px-5 sm:px-8 pt-7 pb-4">
        <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400">
          Mormaii · Verão 27
        </p>
        <div className="mt-2 flex items-end justify-between flex-wrap gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Catálogo
          </h1>
          <div className="flex rounded-full border border-stone-300 overflow-hidden">
            {(["Mujer", "Hombre"] as const).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGender(g);
                  setCat("");
                  setColor("");
                }}
                className={`px-5 py-2 text-sm ${
                  gender === g
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="px-5 sm:px-8 py-4 border-y border-stone-200">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Elegí por color
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={() => setColor("")}
            className={`h-9 px-3 rounded-full border text-xs ${
              !color
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 text-stone-600"
            }`}
          >
            Todos
          </button>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c === color ? "" : c)}
              className="flex items-center gap-2 group"
              title={c}
            >
              <span
                className={`inline-block h-9 w-9 rounded-full border-2 transition ${
                  color === c
                    ? "border-stone-900 scale-105"
                    : "border-stone-200 group-hover:border-stone-400"
                }`}
                style={{ backgroundColor: hexOf(c) }}
              />
              <span
                className={`text-[11px] ${
                  color === c ? "text-stone-900 font-medium" : "text-stone-500"
                }`}
              >
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="px-5 sm:px-8 py-3 flex gap-2 overflow-x-auto border-b border-stone-100">
        <Chip active={!cat} onClick={() => setCat("")}>
          Todas
        </Chip>
        {cats.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="px-5 sm:px-8 py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9">
        {items.map((s, i) => {
          const shown = color && s.colors.includes(color) ? color : s.colors[0];
          return (
            <div key={i} className="flex flex-col">
              <div
                className="aspect-[3/4] w-full rounded-lg border border-stone-100 flex items-end justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(160deg, ${hexOf(
                    shown,
                  )} 0%, #ffffff 130%)`,
                }}
              >
                <span className="mb-3 text-[10px] uppercase tracking-wide text-stone-500 bg-white/80 px-2 py-0.5 rounded-full">
                  foto del color
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wide text-stone-400 mt-3">
                {s.gender} · {s.category}
              </p>
              <p className="text-sm mt-1 leading-snug">{s.name}</p>
              <p className="text-sm font-semibold mt-0.5">US$ {s.price}</p>
              <div className="mt-2 flex gap-1.5">
                {s.colors.map((c) => (
                  <span
                    key={c}
                    title={c}
                    onClick={() => setColor(c)}
                    className={`h-4 w-4 rounded-full border cursor-pointer ${
                      shown === c ? "border-stone-900" : "border-stone-300"
                    }`}
                    style={{ backgroundColor: hexOf(c) }}
                  />
                ))}
                <span className="text-[11px] text-stone-400 ml-1">
                  {s.colors.length} colores
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 sm:px-8 py-10 text-center text-xs text-stone-400">
        {items.length} productos · diseño de referencia inspirado en
        vuoriclothing.com
      </div>
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs px-4 py-1.5 rounded-full border transition ${
        active
          ? "bg-stone-900 text-white border-stone-900"
          : "bg-white text-stone-600 border-stone-300 hover:border-stone-900"
      }`}
    >
      {children}
    </button>
  );
}
