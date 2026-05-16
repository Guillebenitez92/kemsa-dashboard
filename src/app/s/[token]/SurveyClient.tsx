"use client";

import { useEffect, useMemo, useState } from "react";

type P = {
  code: string;
  imgCode: string;
  name: string;
  category: string;
  gender: string;
  retail: number;
  sizes: string[];
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

function money(n: number) {
  return "US$ " + n.toFixed(2);
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
  const [step, setStep] = useState<"catalog" | "form" | "done">("catalog");
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
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow p-8">
          <div className="text-5xl">✓</div>
          <h1 className="mt-3 text-2xl font-bold text-brand">¡Gracias!</h1>
          <p className="mt-3 text-stone-600">
            Tu selección fue registrada. Vamos a usar estas respuestas para
            decidir qué productos traer. ¡Gracias por participar!
          </p>
        </div>
      </main>
    );
  }

  if (step === "form") {
    return (
      <main className="min-h-screen p-5 max-w-lg mx-auto">
        <button onClick={() => setStep("catalog")} className="text-sm text-stone-500 mb-4">
          ← Volver al catálogo
        </button>
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-xl font-bold text-brand">Casi listo</h1>
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

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <button
            disabled={submitting}
            onClick={submit}
            className="mt-5 w-full bg-brand text-white font-semibold rounded-xl py-3 disabled:opacity-60"
          >
            {submitting ? "Enviando..." : `Enviar mi selección (${count})`}
          </button>
        </div>
        <style jsx global>{`
          .inp {
            width: 100%;
            margin-top: 6px;
            border: 1px solid #d6d3d1;
            border-radius: 12px;
            padding: 10px 12px;
            outline: none;
            font-size: 15px;
          }
          .inp:focus {
            border-color: #16a34a;
          }
        `}</style>
      </main>
    );
  }

  const openP = openCode ? byCode[openCode] : null;
  const openImgs = openP ? imagesFor(openP) : [];
  const openSel = openCode ? selected[openCode] : undefined;

  return (
    <main className="min-h-screen pb-28">
      <header className="bg-brand text-white p-5 sticky top-0 z-20 shadow">
        <h1 className="text-lg font-bold">Mormaii Sports — Verão 27</h1>
        <p className="text-sm text-white/80 mt-0.5">
          Tocá un producto para ver todas sus fotos. Marcá lo que comprarías,
          elegí tu talle y la foto/color que más te gusta.
        </p>
      </header>

      <div className="p-4 sticky top-[84px] z-10 bg-stone-100/95 backdrop-blur space-y-3">
        <input
          className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm"
          placeholder="Buscar producto o código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {filtered.map((p) => {
          const sel = selected[p.code];
          const isSel = Boolean(sel);
          const imgs = imagesFor(p);
          const placeholder = (
            <div className="aspect-[3/4] w-full rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 flex flex-col items-center justify-center text-stone-400">
              <span className="text-xs font-medium uppercase tracking-wide">
                {p.category}
              </span>
              <span className="text-[10px] mt-1">#{p.code}</span>
            </div>
          );
          return (
            <div
              key={p.code}
              className={`rounded-2xl bg-white p-2.5 border-2 transition ${
                isSel ? "border-brand-accent shadow-md" : "border-transparent shadow-sm"
              }`}
            >
              <button
                onClick={() => {
                  setOpenCode(p.code);
                  setGIdx(0);
                }}
                className="block w-full text-left relative"
              >
                <DriveImg
                  id={imgs[0] || ""}
                  alt={p.name}
                  w={600}
                  className="aspect-[3/4] w-full rounded-xl object-cover bg-stone-100"
                  fallback={placeholder}
                />
                {imgs.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {imgs.length} fotos
                  </span>
                )}
                <div className="mt-2 flex items-start justify-between gap-1">
                  <span className="text-[11px] text-stone-400">#{p.code}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.gender === "Mujer"
                        ? "bg-pink-100 text-pink-700"
                        : p.gender === "Hombre"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {p.gender}
                  </span>
                </div>
                <p className="text-xs font-medium leading-tight mt-1 line-clamp-2 min-h-[2.2rem]">
                  {p.name}
                </p>
                <p className="text-sm font-bold text-brand mt-1">{money(p.retail)}</p>
              </button>

              <button
                onClick={() => toggle(p)}
                className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold ${
                  isSel ? "bg-brand-accent text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                {isSel ? "✓ Me interesa" : "Me interesa"}
              </button>

              {isSel && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {p.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => patch(p.code, { size: s })}
                        className={`text-[11px] px-2 py-1 rounded-md border ${
                          sel?.size === s
                            ? "bg-brand text-white border-brand"
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
                      className="mt-2 text-[11px] text-brand underline"
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
          <p className="col-span-full text-center text-stone-400 py-10">
            No hay productos con ese filtro.
          </p>
        )}
      </div>

      {openP && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{openP.name}</p>
                <p className="text-[11px] text-stone-400">
                  #{openP.code} · {money(openP.retail)}
                </p>
              </div>
              <button
                onClick={() => setOpenCode(null)}
                className="ml-3 text-stone-500 text-xl leading-none px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              {openImgs.length === 0 ? (
                <div className="aspect-square w-full rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
                  Sin fotos para este producto
                </div>
              ) : (
                <>
                  <div className="relative">
                    <DriveImg
                      id={openImgs[gIdx]}
                      alt={openP.name}
                      w={1200}
                      className="w-full rounded-xl object-contain bg-stone-50 max-h-[55vh]"
                      fallback={
                        <div className="aspect-square w-full rounded-xl bg-stone-100" />
                      }
                    />
                    {openImgs.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setGIdx((i) => (i - 1 + openImgs.length) % openImgs.length)
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 rounded-full w-9 h-9 text-lg shadow"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setGIdx((i) => (i + 1) % openImgs.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 rounded-full w-9 h-9 text-lg shadow"
                        >
                          ›
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-white text-[11px] px-2 py-0.5 rounded-full">
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
                          className={`shrink-0 rounded-lg overflow-hidden border-2 ${
                            i === gIdx ? "border-brand-accent" : "border-transparent"
                          }`}
                        >
                          <DriveImg
                            id={id}
                            alt={`${openP.name} ${i + 1}`}
                            w={200}
                            className="h-16 w-16 object-cover bg-stone-100"
                            fallback={<div className="h-16 w-16 bg-stone-100" />}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => toggle(openP)}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold ${
                  openSel
                    ? "bg-brand-accent text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {openSel ? "✓ Me interesa" : "Me interesa"}
              </button>

              {openSel && (
                <>
                  <p className="text-xs font-medium text-stone-600 mt-4">Talle</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {openP.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => patch(openP.code, { size: s })}
                        className={`text-xs px-2.5 py-1.5 rounded-md border ${
                          openSel.size === s
                            ? "bg-brand text-white border-brand"
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
                      className={`mt-4 w-full rounded-xl py-2.5 text-sm font-medium border ${
                        openSel.favImg === openImgs[gIdx]
                          ? "bg-amber-400 border-amber-400 text-amber-950"
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

              <button
                onClick={() => setOpenCode(null)}
                className="mt-3 w-full rounded-xl py-2.5 text-sm bg-brand text-white font-semibold"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 p-4 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="text-sm">
            <span className="font-bold text-brand">{count}</span> seleccionados
          </div>
          <button
            disabled={count === 0}
            onClick={() => setStep("form")}
            className="ml-auto bg-brand text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-50"
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
      className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border ${
        active ? "bg-brand text-white border-brand" : "bg-white text-stone-600 border-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mt-4">
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
    <div className="mt-4">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              value === o
                ? "bg-brand text-white border-brand"
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
