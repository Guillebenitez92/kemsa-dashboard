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

type Sel = { size: string; favImg: string | null };

const GENDER_OPTS = ["Femenino", "Masculino", "Otro", "Prefiero no decir"];
const AGE_OPTS = ["Menos de 18", "18-24", "25-34", "35-44", "45-54", "55+"];
const FREQ_OPTS = [
  "No entreno",
  "1-2 veces por semana",
  "3-4 veces por semana",
  "5 o más veces por semana",
];

const USD_PYG = 6500;

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
  const [manifest, setManifest] = useState<Record<string, string[]> | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [gIdx, setGIdx] = useState(0);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [freq, setFreq] = useState("");
  const [buys, setBuys] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selKey = `kemsa_sel_${token}`;
  const doneKey = `kemsa_done_${token}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(selKey);
      if (saved) setSelected(JSON.parse(saved));
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
    fetch("/products/manifest.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && typeof m === "object" && setManifest(m))
      .catch(() => {});
  }, []);

  const imagesFor = (p: P): string[] => manifest?.[p.imgCode] ?? [];

  const count = Object.keys(selected).length;

  function toggle(p: P) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.code]) {
        delete next[p.code];
      } else {
        next[p.code] = {
          size: p.sizes.length === 1 ? p.sizes[0] : "",
          favImg: null,
        };
      }
      return next;
    });
  }

  function patch(code: string, p: Partial<Sel>) {
    setSelected((prev) =>
      prev[code] ? { ...prev, [code]: { ...prev[code], ...p } } : prev,
    );
  }

  const byCode = useMemo(
    () => Object.fromEntries(products.map((p) => [p.code, p])),
    [products],
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (gen && p.gender !== gen) return false;
      if (qq && !`${p.name} ${p.code}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [products, q, cat, gen]);

  // Variantes del mismo modelo (mismo nombre, otro código = otra estampa/color)
  // o, si no hay, productos de la misma línea/tejido.
  function recommendFor(p: P): { title: string; items: P[] } {
    const sameModel = products.filter(
      (x) => x.code !== p.code && x.name === p.name,
    );
    if (sameModel.length > 0) {
      return { title: "Otras variantes de este modelo", items: sameModel };
    }
    if (p.line) {
      const sameLine = products
        .filter((x) => x.code !== p.code && x.line && x.line === p.line)
        .sort((a, b) => {
          const ca = a.category === p.category ? 0 : 1;
          const cb = b.category === p.category ? 0 : 1;
          return ca - cb;
        })
        .slice(0, 10);
      if (sameLine.length > 0) {
        return { title: `También en línea ${p.line}`, items: sameLine };
      }
    }
    const sameCat = products
      .filter((x) => x.code !== p.code && x.category === p.category)
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
      setError("Elegí el talle en todos los productos marcados.");
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
          selections: Object.entries(selected).map(([code, s]) => ({
            code,
            size: s.size,
            favImg: s.favImg,
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

  const openP = openCode ? byCode[openCode] : null;
  const openImgs = openP ? imagesFor(openP) : [];
  const openSel = openCode ? selected[openCode] : undefined;
  const reco = openP ? recommendFor(openP) : null;
  const fab = openP ? fabricFor(openP.line) : undefined;

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
          Tocá un producto para ver todas sus fotos y variantes. Marcá lo que
          comprarías, elegí el talle y la foto/color que más te gusta.
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
        {filtered.length} producto{filtered.length === 1 ? "" : "s"}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 px-5 py-5">
        {filtered.map((p) => {
          const sel = selected[p.code];
          const isSel = Boolean(sel);
          const imgs = imagesFor(p);
          const placeholder = (
            <div className="aspect-[3/4] w-full bg-stone-50 flex flex-col items-center justify-center text-stone-300">
              <span className="text-[11px] font-medium uppercase tracking-wide">
                {p.category}
              </span>
              <span className="text-[10px] mt-1">#{p.code}</span>
            </div>
          );
          return (
            <div key={p.code} className="flex flex-col">
              <button
                onClick={() => {
                  setOpenCode(p.code);
                  setGIdx(0);
                }}
                className="block w-full text-left relative group"
              >
                <div
                  className={`overflow-hidden ${
                    isSel ? "ring-1 ring-black" : ""
                  }`}
                >
                  <DriveImg
                    id={imgs[0] || ""}
                    alt={p.name}
                    w={600}
                    className="aspect-[3/4] w-full object-cover bg-stone-50"
                    fallback={placeholder}
                  />
                </div>
                {imgs.length > 1 && (
                  <span className="absolute top-2 right-2 bg-white/85 text-stone-700 text-[10px] px-2 py-0.5 rounded-full">
                    {imgs.length} fotos
                  </span>
                )}
                <div className="mt-2.5 flex items-center gap-2 text-[10px] uppercase tracking-wide text-stone-400">
                  <span>{p.gender}</span>
                  {p.line && <span>· {p.line}</span>}
                </div>
                <p className="text-[13px] leading-snug mt-1 line-clamp-2 min-h-[2.4rem] text-stone-800">
                  {p.name}
                </p>
                <Price n={p.retail} />
              </button>

              <button
                onClick={() => toggle(p)}
                className={`mt-2.5 w-full rounded-full py-2 text-xs font-medium border transition ${
                  isSel
                    ? "bg-black text-white border-black"
                    : "bg-white text-stone-900 border-stone-300 hover:border-stone-900"
                }`}
              >
                {isSel ? "✓ Me interesa" : "Me interesa"}
              </button>

              {isSel && (
                <div className="mt-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {p.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => patch(p.code, { size: s })}
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
                  {imgs.length > 1 && (
                    <button
                      onClick={() => {
                        setOpenCode(p.code);
                        setGIdx(
                          sel?.favImg ? Math.max(0, imgs.indexOf(sel.favImg)) : 0,
                        );
                      }}
                      className="mt-2 text-[11px] text-stone-500 underline underline-offset-2"
                    >
                      {sel?.favImg
                        ? "✓ Color/foto elegido"
                        : "Elegir color/foto favorita"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-stone-400 py-16">
            No hay productos con ese filtro.
          </p>
        )}
      </div>

      {openP && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
              <div className="min-w-0 pr-3">
                <p className="font-medium text-sm truncate">{openP.name}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  #{openP.code}
                  {openP.line ? ` · ${openP.line}` : ""}
                </p>
              </div>
              <button
                onClick={() => setOpenCode(null)}
                className="text-stone-400 text-xl leading-none px-1"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {openImgs.length === 0 ? (
                <div className="aspect-square w-full bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
                  Sin fotos para este producto
                </div>
              ) : (
                <>
                  <div className="relative">
                    <DriveImg
                      id={openImgs[gIdx]}
                      alt={openP.name}
                      w={1200}
                      className="w-full object-contain bg-stone-50 max-h-[56vh]"
                      fallback={
                        <div className="aspect-square w-full bg-stone-50" />
                      }
                    />
                    {openImgs.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setGIdx(
                              (i) => (i - 1 + openImgs.length) % openImgs.length,
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setGIdx((i) => (i + 1) % openImgs.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg"
                        >
                          ›
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/85 text-stone-600 text-[11px] px-2 py-0.5 rounded-full">
                          {gIdx + 1} / {openImgs.length}
                        </span>
                      </>
                    )}
                  </div>

                  {openImgs.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                      {openImgs.map((id, i) => (
                        <button
                          key={id}
                          onClick={() => setGIdx(i)}
                          className={`shrink-0 overflow-hidden border ${
                            i === gIdx ? "border-black" : "border-stone-200"
                          }`}
                        >
                          <DriveImg
                            id={id}
                            alt={`${openP.name} ${i + 1}`}
                            w={200}
                            className="h-16 w-16 object-cover bg-stone-50"
                            fallback={<div className="h-16 w-16 bg-stone-50" />}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-4">
                <Price n={openP.retail} big />
              </div>

              <button
                onClick={() => toggle(openP)}
                className={`mt-4 w-full rounded-full py-3 text-sm font-medium border ${
                  openSel
                    ? "bg-black text-white border-black"
                    : "bg-white text-stone-900 border-stone-300"
                }`}
              >
                {openSel ? "✓ Me interesa" : "Me interesa"}
              </button>

              {openSel && (
                <>
                  <p className="text-xs font-medium text-stone-500 mt-5 uppercase tracking-wide">
                    Talle
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {openP.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => patch(openP.code, { size: s })}
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

                  {openImgs.length > 0 && (
                    <button
                      onClick={() =>
                        patch(openP.code, {
                          favImg:
                            openSel.favImg === openImgs[gIdx]
                              ? null
                              : openImgs[gIdx],
                        })
                      }
                      className={`mt-4 w-full rounded-full py-3 text-sm font-medium border ${
                        openSel.favImg === openImgs[gIdx]
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-stone-300 text-stone-700"
                      }`}
                    >
                      {openSel.favImg === openImgs[gIdx]
                        ? "★ Esta foto/color es mi favorita"
                        : "☆ Marcar esta foto/color como favorita"}
                    </button>
                  )}
                </>
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
                      const rImgs = imagesFor(r);
                      const rSel = Boolean(selected[r.code]);
                      return (
                        <button
                          key={r.code}
                          onClick={() => {
                            setOpenCode(r.code);
                            setGIdx(0);
                          }}
                          className="shrink-0 w-28 text-left"
                        >
                          <div
                            className={`overflow-hidden ${
                              rSel ? "ring-1 ring-black" : ""
                            }`}
                          >
                            <DriveImg
                              id={rImgs[0] || ""}
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
                onClick={() => setOpenCode(null)}
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
          <div className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{count}</span>{" "}
            seleccionado{count === 1 ? "" : "s"}
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
