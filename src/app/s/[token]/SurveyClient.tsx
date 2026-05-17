"use client";

import { useEffect, useMemo, useState } from "react";
import { fabricFor } from "@/lib/fabrics";

type P = {
  code: string;
  imgCode: string;
  name: string;
  category: string;
  gender: string;
  retail: number;
  sizes: string[];
  line: string;
};

// Cada color del artículo es una tarjeta independiente del catálogo.
type Variant = {
  vid: string; // `${code}__${img}`
  code: string;
  img: string; // Drive id de la foto (= el color)
  name: string;
  category: string;
  gender: string;
  retail: number;
  sizes: string[];
  line: string;
  imgs: string[]; // todas las fotos/colores del mismo código
  colorIdx: number; // 1..colorCount
  colorCount: number;
};

type Sel = { size: string; code: string; img: string };

const GENDER_OPTS = ["Femenino", "Masculino", "Otro", "Prefiero no decir"];
const AGE_OPTS = ["Menos de 18", "18-24", "25-34", "35-44", "45-54", "55+"];
const FREQ_OPTS = [
  "No entreno",
  "1-2 veces por semana",
  "3-4 veces por semana",
  "5 o más veces por semana",
];

const USD_PYG = 6500;

const SIN_COLECCION = "Otras prendas";

// Grupo de talle por tipo de prenda: el talle elegido se recuerda por grupo
// (ej: ponés M en una de arriba → las próximas de arriba ya vienen con M).
const SIZE_GROUP: Record<string, string> = {
  Tops: "arriba",
  Cropped: "arriba",
  Remeras: "arriba",
  Musculosas: "arriba",
  Blusas: "arriba",
  Camisas: "arriba",
  Camperas: "arriba",
  Shorts: "abajo",
  "Calzas / Leggings": "abajo",
  Pantalones: "abajo",
  Bermudas: "abajo",
  Polleras: "abajo",
  Vestidos: "entero",
  Enterizos: "entero",
  Bodies: "entero",
  Accesorios: "acc",
};
function groupOf(category: string): string {
  return SIZE_GROUP[category] || "otro";
}

function usd(n: number) {
  return "US$ " + Math.round(n);
}

function pyg(n: number) {
  const g = Math.round((n * USD_PYG) / 1000) * 1000;
  return "₲ " + new Intl.NumberFormat("es-PY").format(g);
}

function Price({ n, big }: { n: number; big?: boolean }) {
  return (
    <div className={big ? "" : "mt-1"}>
      <span className={big ? "text-base font-semibold" : "text-sm font-semibold"}>
        {usd(n)}
      </span>
      <span className="ml-2 text-xs text-stone-500">{pyg(n)}</span>
    </div>
  );
}

function driveUrl(id: string, w = 1000) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
}

function DriveImg({
  id,
  alt,
  className,
  w,
  fallback,
}: {
  id: string;
  alt: string;
  className: string;
  w?: number;
  fallback: React.ReactNode;
}) {
  const [err, setErr] = useState(false);
  if (err || !id) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={driveUrl(id, w)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setErr(true)}
    />
  );
}

export default function SurveyClient({
  token,
  products,
  categories,
}: {
  token: string;
  products: P[];
  categories: string[];
  multiplier: number;
}) {
  const [step, setStep] = useState<"home" | "catalog" | "form" | "done">("home");
  const [selected, setSelected] = useState<Record<string, Sel>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [gen, setGen] = useState("");
  const [col, setCol] = useState("");
  const [manifest, setManifest] = useState<Record<string, string[]> | null>(null);
  const [openVid, setOpenVid] = useState<string | null>(null);
  const [sizeByGroup, setSizeByGroup] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [freq, setFreq] = useState("");
  const [buys, setBuys] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // v2: el modelo de selección cambió (ahora por color, no por código).
  const selKey = `kemsa_sel2_${token}`;
  const doneKey = `kemsa_done_${token}`;
  const sizesKey = `kemsa_sizes_${token}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(selKey);
      if (saved) setSelected(JSON.parse(saved));
      const sv = localStorage.getItem(sizesKey);
      if (sv) setSizeByGroup(JSON.parse(sv));
      if (localStorage.getItem(doneKey) === "1") setStep("done");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(selKey, JSON.stringify(selected));
    } catch {}
  }, [selected, selKey]);

  useEffect(() => {
    try {
      localStorage.setItem(sizesKey, JSON.stringify(sizeByGroup));
    } catch {}
  }, [sizeByGroup, sizesKey]);

  useEffect(() => {
    fetch("/products/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && typeof m === "object" && setManifest(m))
      .catch(() => {});
  }, []);

  // Una tarjeta por cada color (cada foto del manifest) de cada artículo.
  const variants = useMemo<Variant[]>(() => {
    if (!manifest) return [];
    const out: Variant[] = [];
    for (const p of products) {
      const imgs = manifest[p.imgCode] ?? [];
      imgs.forEach((img, i) => {
        out.push({
          vid: `${p.code}__${img}`,
          code: p.code,
          img,
          name: p.name,
          category: p.category,
          gender: p.gender,
          retail: p.retail,
          sizes: p.sizes,
          line: p.line,
          imgs,
          colorIdx: i + 1,
          colorCount: imgs.length,
        });
      });
    }
    return out;
  }, [products, manifest]);

  const byVid = useMemo(
    () => Object.fromEntries(variants.map((v) => [v.vid, v])),
    [variants],
  );

  const collections = useMemo(() => {
    const s = new Set<string>();
    for (const v of variants) if (v.line) s.add(v.line);
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [variants]);

  const count = Object.keys(selected).length;

  function toggle(v: Variant) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[v.vid]) {
        delete next[v.vid];
      } else {
        const remembered = sizeByGroup[groupOf(v.category)];
        next[v.vid] = {
          size:
            v.sizes.length === 1
              ? v.sizes[0]
              : remembered && v.sizes.includes(remembered)
              ? remembered
              : "",
          code: v.code,
          img: v.img,
        };
      }
      return next;
    });
  }

  function patch(vid: string, p: Partial<Sel>) {
    setSelected((prev) =>
      prev[vid] ? { ...prev, [vid]: { ...prev[vid], ...p } } : prev,
    );
  }

  // Elegir talle y recordarlo para todas las prendas del mismo grupo.
  function rememberSize(v: Variant, s: string) {
    patch(v.vid, { size: s });
    setSizeByGroup((prev) => ({ ...prev, [groupOf(v.category)]: s }));
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return variants.filter((v) => {
      if (cat && v.category !== cat) return false;
      if (gen && v.gender !== gen) return false;
      if (col && (v.line || SIN_COLECCION) !== col) return false;
      if (qq && !`${v.name} ${v.code}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [variants, q, cat, gen, col]);

  // Catálogo ordenado/agrupado por colección de productos.
  const groups = useMemo(() => {
    const m = new Map<string, Variant[]>();
    for (const v of filtered) {
      const key = v.line || SIN_COLECCION;
      const arr = m.get(key);
      if (arr) arr.push(v);
      else m.set(key, [v]);
    }
    const keys = Array.from(m.keys()).sort((a, b) => {
      if (a === SIN_COLECCION) return 1;
      if (b === SIN_COLECCION) return -1;
      return a.localeCompare(b, "es");
    });
    return keys.map((k) => ({ line: k, items: m.get(k)! }));
  }, [filtered]);

  // Una variante "representativa" por código, para las recomendaciones.
  const reps = useMemo(() => {
    const m = new Map<string, Variant>();
    for (const v of variants) if (!m.has(v.code)) m.set(v.code, v);
    return Array.from(m.values());
  }, [variants]);

  function recommendFor(v: Variant): { title: string; items: Variant[] } {
    const sameModel = reps.filter((x) => x.code !== v.code && x.name === v.name);
    if (sameModel.length > 0) {
      return { title: "Otras versiones de este modelo", items: sameModel.slice(0, 10) };
    }
    if (v.line) {
      const sameLine = reps
        .filter((x) => x.code !== v.code && x.line && x.line === v.line)
        .sort((a, b) => {
          const ca = a.category === v.category ? 0 : 1;
          const cb = b.category === v.category ? 0 : 1;
          return ca - cb;
        })
        .slice(0, 10);
      if (sameLine.length > 0) {
        return { title: `Más de la colección ${v.line}`, items: sameLine };
      }
    }
    const sameCat = reps
      .filter((x) => x.code !== v.code && x.category === v.category)
      .slice(0, 10);
    return { title: "También te puede interesar", items: sameCat };
  }

  async function submit() {
    setError("");
    if (count === 0) {
      setError("Seleccioná al menos un producto.");
      return;
    }
    const missingSize = Object.entries(selected).find(([, s]) => !s.size);
    if (missingSize) {
      setError("Elegí el talle en todos los colores marcados.");
      setStep("catalog");
      return;
    }
    if (!gender || !age || !freq) {
      setError("Completá género, edad y frecuencia de entrenamiento.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name || null,
          gender,
          age_range: age,
          train_frequency: freq,
          buys_where: buys || null,
          comment: comment || null,
          // Una fila por color marcado: el color va en favImg.
          selections: Object.values(selected).map((s) => ({
            code: s.code,
            size: s.size,
            favImg: s.img,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      try {
        localStorage.setItem(doneKey, "1");
        localStorage.removeItem(selKey);
      } catch {}
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Error al enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md text-center">
          <div className="text-4xl">✓</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            ¡Gracias!
          </h1>
          <p className="mt-3 text-stone-600 leading-relaxed">
            Tu selección fue registrada. Vamos a usar estas respuestas para
            decidir qué productos traer. ¡Gracias por participar!
          </p>
        </div>
      </main>
    );
  }

  if (step === "home") {
    const enter = (g: string) => {
      setGen(g);
      setCat("");
      setCol("");
      setQ("");
      setStep("catalog");
    };
    const Cover = ({
      g,
      label,
      src,
    }: {
      g: string;
      label: string;
      src: string;
    }) => (
      <button
        onClick={() => enter(g)}
        className="relative flex-1 h-[50vh] sm:h-screen overflow-hidden group"
      >
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="text-4xl sm:text-6xl font-semibold tracking-tight">
            {label}
          </span>
          <span className="mt-4 text-xs uppercase tracking-[0.25em] border-b border-white/80 pb-1">
            Ver catálogo
          </span>
        </div>
      </button>
    );
    return (
      <main className="relative h-screen w-screen overflow-hidden bg-black">
        <div className="flex flex-col sm:flex-row h-full">
          <Cover g="Mujer" label="MUJER" src="/landing/mujer.mp4" />
          <Cover g="Hombre" label="HOMBRE" src="/landing/hombre.mp4" />
        </div>
        <div className="absolute top-0 inset-x-0 pt-6 text-center pointer-events-none">
          <p className="text-[11px] tracking-[0.3em] text-white/80 uppercase">
            Encuesta de catálogo
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow">
            MORMAII SPORTS · Verão 27
          </h1>
        </div>
        <div className="absolute bottom-0 inset-x-0 pb-6 text-center">
          <button
            onClick={() => enter("")}
            className="text-xs uppercase tracking-[0.2em] text-white/90 underline underline-offset-4"
          >
            Ver todo el catálogo
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    return (
      <main className="min-h-screen bg-white p-5 max-w-lg mx-auto">
        <button
          onClick={() => setStep("catalog")}
          className="text-sm text-stone-500 mb-6"
        >
          ← Volver al catálogo
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Casi listo</h1>
        <p className="text-sm text-stone-500 mt-1">
          Contanos un poco sobre vos. Es anónimo y muy corto.
        </p>

        <Field label="Nombre (opcional)">
          <input
            className="inp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Field>

        <Chips label="Género *" opts={GENDER_OPTS} value={gender} onPick={setGender} />
        <Chips label="Rango de edad *" opts={AGE_OPTS} value={age} onPick={setAge} />
        <Chips
          label="¿Con qué frecuencia entrenás? *"
          opts={FREQ_OPTS}
          value={freq}
          onPick={setFreq}
        />

        <Field label="¿Dónde solés comprar ropa deportiva? (opcional)">
          <input
            className="inp"
            value={buys}
            onChange={(e) => setBuys(e.target.value)}
            placeholder="Ej: tiendas, online, shopping..."
          />
        </Field>

        <Field label="Comentario (opcional)">
          <textarea
            className="inp"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te gustaría que traigamos?"
          />
        </Field>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button
          disabled={submitting}
          onClick={submit}
          className="mt-6 w-full bg-black text-white font-medium rounded-full py-3.5 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : `Enviar mi selección (${count})`}
        </button>
        <style jsx global>{`
          .inp {
            width: 100%;
            margin-top: 8px;
            border: 1px solid #e7e5e4;
            border-radius: 10px;
            padding: 11px 13px;
            outline: none;
            font-size: 15px;
            background: #fff;
          }
          .inp:focus {
            border-color: #111;
          }
        `}</style>
      </main>
    );
  }

  const openV = openVid ? byVid[openVid] : null;
  const openSel = openVid ? selected[openVid] : undefined;
  const otrosColores = openV
    ? variants.filter((x) => x.code === openV.code && x.vid !== openV.vid)
    : [];
  const reco = openV ? recommendFor(openV) : null;
  const fab = openV ? fabricFor(openV.line) : undefined;

  return (
    <main className="min-h-screen pb-28 bg-white">
      <header className="px-5 pt-6 pb-5 border-b border-stone-200">
        <button
          onClick={() => setStep("home")}
          className="text-[11px] tracking-[0.18em] text-stone-400 uppercase hover:text-stone-700"
        >
          ← Inicio · Encuesta de catálogo
        </button>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
          Mormaii Sports — Verão 27
        </h1>
        <p className="text-sm text-stone-500 mt-2 max-w-xl">
          Cada color es una tarjeta aparte, ordenado por colección. Marcá los
          colores que comprarías y elegí el talle.
        </p>
      </header>

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="px-5 py-3 space-y-3">
          <input
            className="w-full border border-stone-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-stone-900"
            placeholder="Buscar producto o código"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <Pill active={!col} onClick={() => setCol("")}>
              Todas las colecciones
            </Pill>
            {collections.map((c) => (
              <Pill key={c} active={col === c} onClick={() => setCol(c)}>
                {c}
              </Pill>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <Pill active={!cat} onClick={() => setCat("")}>
              Todas
            </Pill>
            {categories.map((c) => (
              <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Pill>
            ))}
          </div>
          <div className="flex gap-2">
            {["", "Mujer", "Hombre", "Unisex"].map((g) => (
              <Pill key={g || "all"} active={gen === g} onClick={() => setGen(g)}>
                {g === "" ? "Todos" : g}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 text-xs text-stone-400">
        {manifest === null
          ? "Cargando catálogo…"
          : `${filtered.length} ${filtered.length === 1 ? "color" : "colores"} · ${
              groups.length
            } ${groups.length === 1 ? "colección" : "colecciones"}`}
      </div>

      {manifest === null ? (
        <div className="px-5 py-24 text-center text-stone-400">
          Cargando catálogo…
        </div>
      ) : groups.length === 0 ? (
        <p className="px-5 py-16 text-center text-stone-400">
          No hay productos con ese filtro.
        </p>
      ) : (
        groups.map((grp) => (
          <section key={grp.line}>
            <div className="px-5 pt-7 pb-1 flex items-baseline justify-between">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                {grp.line}
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-stone-400">
                {grp.items.length}{" "}
                {grp.items.length === 1 ? "color" : "colores"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 px-5 py-4">
              {grp.items.map((v) => {
                const sel = selected[v.vid];
                const isSel = Boolean(sel);
                const placeholder = (
                  <div className="aspect-[3/4] w-full bg-stone-50 flex flex-col items-center justify-center text-stone-300">
                    <span className="text-[11px] font-medium uppercase tracking-wide">
                      {v.category}
                    </span>
                    <span className="text-[10px] mt-1">#{v.code}</span>
                  </div>
                );
                return (
                  <div key={v.vid} className="flex flex-col">
                    <button
                      onClick={() => setOpenVid(v.vid)}
                      className="block w-full text-left relative group"
                    >
                      <div
                        className={`overflow-hidden ${
                          isSel ? "ring-1 ring-black" : ""
                        }`}
                      >
                        <DriveImg
                          id={v.img}
                          alt={v.name}
                          w={600}
                          className="aspect-[3/4] w-full object-cover bg-stone-50"
                          fallback={placeholder}
                        />
                      </div>
                      {v.colorCount > 1 && (
                        <span className="absolute top-2 right-2 bg-white/85 text-stone-700 text-[10px] px-2 py-0.5 rounded-full">
                          Color {v.colorIdx}/{v.colorCount}
                        </span>
                      )}
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-stone-400">
                        <span>{v.gender}</span>
                        {v.line && <span>· {v.line}</span>}
                      </div>
                      <p className="text-[13px] leading-snug mt-1 line-clamp-2 min-h-[2.4rem] text-stone-800">
                        {v.name}
                      </p>
                      <Price n={v.retail} />
                    </button>

                    <button
                      onClick={() => toggle(v)}
                      aria-label={isSel ? "Quitar me gusta" : "Me gusta"}
                      className={`mt-2.5 rounded-full border w-9 h-9 flex items-center justify-center transition ${
                        isSel
                          ? "bg-black text-white border-black"
                          : "bg-white text-stone-500 border-stone-300 hover:border-stone-900 hover:text-stone-900"
                      }`}
                    >
                      <Heart filled={isSel} />
                    </button>

                    {isSel && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {v.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => rememberSize(v, s)}
                            className={`min-w-[34px] text-[11px] px-2 py-1 border ${
                              sel?.size === s
                                ? "bg-black text-white border-black"
                                : "bg-white text-stone-600 border-stone-300"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {openV && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
              <div className="min-w-0 pr-3">
                <p className="font-medium text-sm truncate">{openV.name}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  #{openV.code}
                  {openV.line ? ` · ${openV.line}` : ""}
                  {openV.colorCount > 1
                    ? ` · Color ${openV.colorIdx} de ${openV.colorCount}`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setOpenVid(null)}
                className="text-stone-400 text-xl leading-none px-1"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <DriveImg
                id={openV.img}
                alt={openV.name}
                w={1200}
                className="w-full object-contain bg-stone-50 max-h-[56vh]"
                fallback={<div className="aspect-square w-full bg-stone-50" />}
              />

              <div className="mt-4">
                <Price n={openV.retail} big />
              </div>

              <button
                onClick={() => toggle(openV)}
                className={`mt-4 w-full rounded-full py-3 text-sm font-medium border flex items-center justify-center gap-2 ${
                  openSel
                    ? "bg-black text-white border-black"
                    : "bg-white text-stone-900 border-stone-300"
                }`}
              >
                <Heart filled={!!openSel} className="w-4 h-4" />
                {openSel ? "Te gusta este color" : "Me gusta este color"}
              </button>

              {openSel && (
                <>
                  <p className="text-xs font-medium text-stone-500 mt-5 uppercase tracking-wide">
                    Talle
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {openV.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => rememberSize(openV, s)}
                        className={`min-w-[40px] text-xs px-3 py-2 border ${
                          openSel.size === s
                            ? "bg-black text-white border-black"
                            : "bg-white text-stone-600 border-stone-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {otrosColores.length > 0 && (
                <div className="mt-7 border-t border-stone-100 pt-5">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    Otros colores de este artículo
                  </p>
                  <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
                    {otrosColores.map((c) => {
                      const cSel = Boolean(selected[c.vid]);
                      return (
                        <button
                          key={c.vid}
                          onClick={() => setOpenVid(c.vid)}
                          className={`shrink-0 overflow-hidden border ${
                            cSel ? "border-black" : "border-stone-200"
                          }`}
                          title={`Color ${c.colorIdx} de ${c.colorCount}`}
                        >
                          <DriveImg
                            id={c.img}
                            alt={`${c.name} color ${c.colorIdx}`}
                            w={200}
                            className="h-20 w-20 object-cover bg-stone-50"
                            fallback={<div className="h-20 w-20 bg-stone-50" />}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {fab && (
                <div className="mt-7 border-t border-stone-100 pt-5">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    La tela · {fab.name}
                  </p>
                  <p className="text-sm font-medium mt-1">{fab.tagline}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fab.features.map((f) => (
                      <span
                        key={f}
                        className="text-[11px] px-2 py-1 border border-stone-300 text-stone-600 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed mt-3">
                    {fab.desc}
                  </p>
                  {fab.videoId && (
                    <div className="mt-3 flex justify-center">
                      <div className="w-full max-w-[260px] aspect-[9/16] overflow-hidden rounded-lg bg-stone-100">
                        <iframe
                          src={`https://drive.google.com/file/d/${fab.videoId}/preview`}
                          title={`Tela ${fab.name}`}
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {reco && reco.items.length > 0 && (
                <div className="mt-7 border-t border-stone-100 pt-5">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {reco.title}
                  </p>
                  <div className="flex gap-3 overflow-x-auto mt-3 pb-1">
                    {reco.items.map((r) => {
                      const rSel = Boolean(selected[r.vid]);
                      return (
                        <button
                          key={r.vid}
                          onClick={() => setOpenVid(r.vid)}
                          className="shrink-0 w-28 text-left"
                        >
                          <div
                            className={`overflow-hidden ${
                              rSel ? "ring-1 ring-black" : ""
                            }`}
                          >
                            <DriveImg
                              id={r.img}
                              alt={r.name}
                              w={300}
                              className="aspect-[3/4] w-full object-cover bg-stone-50"
                              fallback={
                                <div className="aspect-[3/4] w-full bg-stone-50 flex items-center justify-center text-[10px] text-stone-300">
                                  #{r.code}
                                </div>
                              }
                            />
                          </div>
                          <p className="text-[11px] leading-tight mt-1.5 line-clamp-2 text-stone-700">
                            {r.name}
                          </p>
                          <p className="text-[11px] font-semibold mt-0.5">
                            {usd(r.retail)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setOpenVid(null)}
                className="mt-6 w-full rounded-full py-3 text-sm bg-black text-white font-medium"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-5 py-4 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="text-sm text-stone-600 flex items-center gap-1.5">
            <Heart filled className="w-4 h-4 text-stone-900" />
            <span className="font-semibold text-stone-900">{count}</span>{" "}
            {count === 1 ? "color marcado" : "colores marcados"}
          </div>
          <button
            disabled={count === 0}
            onClick={() => setStep("form")}
            className="ml-auto bg-black text-white font-medium rounded-full px-7 py-3 disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      </div>
    </main>
  );
}

function Heart({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "w-5 h-5"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.7s-7.6-4.7-9.6-9.4C1 7.9 3 4.8 6.3 4.8c1.9 0 3.3 1 3.9 2.1.6-1.1 2-2.1 3.9-2.1 3.3 0 5.3 3.1 3.9 6.5-2 4.7-9.9 9.4-9.9 9.4z" />
    </svg>
  );
}

function Pill({
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
      className={`whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full border transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-stone-600 border-stone-300 hover:border-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function Chips({
  label,
  opts,
  value,
  onPick,
}: {
  label: string;
  opts: string[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="mt-5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`text-sm px-3.5 py-1.5 rounded-full border ${
              value === o
                ? "bg-black text-white border-black"
                : "bg-white text-stone-600 border-stone-300"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
