"use client";

// Panel para reordenar y borrar fotos de cada producto del catálogo.
// Los cambios viven en localStorage; al final se descarga un JSON que
// reemplaza public/photo-overrides.json en el repo.

import { useCallback, useEffect, useMemo, useState } from "react";

type Variant = {
  colorCode: string; colorName: string; hex: string; photos: string[];
};
type Product = {
  code: string; name: string; section: string; category: string;
  collection: string; variants: Variant[];
};

type Overrides = Record<string, string[]>;
const STORAGE_KEY = "photo-overrides-draft-v1";

function variantKey(p: Product, v: Variant) {
  return `${p.code}/${v.colorCode}`;
}

function loadDraft(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Overrides;
  } catch {
    return {};
  }
}

function saveDraft(ov: Overrides) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ov));
  } catch {}
}

// ----------------------------------------------------------------------

export default function FotosPage() {
  const [state, setState] = useState<"loading" | "unauth" | "ok" | "error">("loading");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [serverOverrides, setServerOverrides] = useState<Overrides>({});
  const [draft, setDraft] = useState<Overrides>({});
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [openColor, setOpenColor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    const r = await fetch("/api/admin/check", { cache: "no-store" });
    if (r.status === 401) { setState("unauth"); return; }
    if (!r.ok) { setErr("No se pudo verificar la sesión."); setState("error"); return; }
    try {
      const [cd, ovRes] = await Promise.all([
        fetch("/catalog-data.json", { cache: "no-store" }).then((x) => x.json()),
        fetch("/photo-overrides.json", { cache: "no-store" }).then((x) => x.json()).catch(() => ({})),
      ]);
      setProducts(cd.products);
      setServerOverrides(ovRes || {});
      setDraft(loadDraft());
      setState("ok");
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar el catálogo.");
      setState("error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ----- helpers para construir la vista actual de fotos de una variante -----

  // Orden vigente para (code, color): draft → server → default (del catálogo).
  function currentPhotos(p: Product, v: Variant): string[] {
    const k = variantKey(p, v);
    if (draft[k]) return draft[k];
    if (serverOverrides[k]) return serverOverrides[k];
    return v.photos;
  }

  // Para detectar cambios respecto al estado "publicado".
  function hasChange(p: Product, v: Variant): boolean {
    const k = variantKey(p, v);
    if (!(k in draft)) return false;
    const baseline = serverOverrides[k] ?? v.photos;
    const cur = draft[k];
    if (cur.length !== baseline.length) return true;
    return cur.some((url, i) => url !== baseline[i]);
  }

  function setVariantPhotos(p: Product, v: Variant, photos: string[]) {
    const k = variantKey(p, v);
    const baseline = serverOverrides[k] ?? v.photos;
    const next = { ...draft };
    // Si el resultado vuelve al baseline, sacar la entrada del draft.
    const same = photos.length === baseline.length && photos.every((u, i) => u === baseline[i]);
    if (same) delete next[k];
    else next[k] = photos;
    setDraft(next);
    saveDraft(next);
  }

  function move(p: Product, v: Variant, idx: number, dir: -1 | 1) {
    const photos = [...currentPhotos(p, v)];
    const j = idx + dir;
    if (j < 0 || j >= photos.length) return;
    [photos[idx], photos[j]] = [photos[j], photos[idx]];
    setVariantPhotos(p, v, photos);
  }
  function removePhoto(p: Product, v: Variant, idx: number) {
    const photos = currentPhotos(p, v).filter((_, i) => i !== idx);
    setVariantPhotos(p, v, photos);
  }
  function resetVariant(p: Product, v: Variant) {
    const k = variantKey(p, v);
    const next = { ...draft };
    delete next[k];
    setDraft(next);
    saveDraft(next);
  }

  // ----- merge final (server + draft) que es lo que se descarga -----

  const merged: Overrides = useMemo(
    () => ({ ...serverOverrides, ...draft }),
    [serverOverrides, draft],
  );
  const draftCount = Object.keys(draft).length;

  function downloadJson() {
    const json = JSON.stringify(merged, null, 2) + "\n";
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "photo-overrides.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function clearDraft() {
    if (!confirm("¿Descartar todos los cambios sin guardar?")) return;
    setDraft({});
    saveDraft({});
  }

  // ----- filtros -----

  const sections = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.section))).sort(),
    [products],
  );
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (products || []).filter((p) => {
      if (section && p.section !== section) return false;
      if (qq && !`${p.name} ${p.code}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [products, section, q]);

  const openProduct = openCode ? (products || []).find((p) => p.code === openCode) || null : null;
  const openVariant = openProduct
    ? openProduct.variants.find((v) => v.colorCode === openColor) ?? openProduct.variants[0]
    : null;

  // ----- render -----

  if (state === "loading")
    return <main className="min-h-screen flex items-center justify-center text-stone-400">Cargando…</main>;

  if (state === "unauth")
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-brand">Fotos · admin</h1>
          <p className="text-sm text-stone-500 mt-2">Iniciá sesión para ordenar las fotos.</p>
          <a href="/admin" className="mt-4 inline-block bg-brand text-white font-semibold rounded-xl px-5 py-2.5">
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );

  if (state === "error" || !products)
    return <main className="min-h-screen flex items-center justify-center p-6 text-red-600">{err || "Error."}</main>;

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-5 sm:px-8 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">Admin · catálogo</p>
            <h1 className="text-2xl font-semibold tracking-tight">Ordenar fotos</h1>
            <p className="text-xs text-stone-500 mt-1">
              Reordená o borrá fotos. Los cambios se guardan acá ({draftCount} en el draft); descargá el JSON cuando termines.
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <a href="/admin" className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2">← Admin</a>
            <button onClick={clearDraft} disabled={draftCount === 0}
              className="text-sm border border-stone-300 text-stone-600 rounded-lg px-4 py-2 disabled:opacity-40">
              Descartar draft
            </button>
            <button onClick={downloadJson}
              className="text-sm bg-black text-white font-medium rounded-lg px-4 py-2">
              Descargar JSON ({Object.keys(merged).length})
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 min-h-[calc(100vh-110px)]">
        {/* Lista de productos */}
        <aside className="bg-white border-r border-stone-200 p-3 overflow-y-auto max-h-[calc(100vh-110px)]">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar código o nombre"
            className="w-full border border-stone-200 rounded-full px-3 py-2 text-sm outline-none focus:border-stone-900" />
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <Chip on={!section} onClick={() => setSection("")}>Todas</Chip>
            {sections.map((s) => (
              <Chip key={s} on={section === s} onClick={() => setSection(s)}>{s}</Chip>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-wide text-stone-400 mt-3 mb-1.5 px-1">
            {filtered.length} productos
          </p>
          <div className="space-y-1">
            {filtered.map((p) => {
              const sel = openCode === p.code;
              const changed = p.variants.some((v) => hasChange(p, v));
              return (
                <button key={p.code}
                  onClick={() => { setOpenCode(p.code); setOpenColor(p.variants[0].colorCode); }}
                  className={"w-full text-left rounded-lg px-2.5 py-2 border transition " +
                    (sel ? "border-black bg-stone-50" : "border-transparent hover:border-stone-200")}>
                  <div className="flex items-center gap-2">
                    <img src={p.variants[0].photos[0]} alt=""
                      className="h-10 w-10 object-cover rounded bg-stone-100 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono truncate">
                        #{p.code} · {p.section}
                      </p>
                    </div>
                    {changed && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detalle del producto seleccionado */}
        <section className="p-5 overflow-y-auto max-h-[calc(100vh-110px)]">
          {!openProduct ? (
            <p className="text-stone-400 text-sm">Elegí un producto a la izquierda.</p>
          ) : (
            <ProductEditor
              p={openProduct}
              v={openVariant!}
              onPickVariant={(c) => setOpenColor(c)}
              currentPhotos={currentPhotos}
              hasChange={hasChange}
              move={move}
              removePhoto={removePhoto}
              resetVariant={resetVariant}
            />
          )}
        </section>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------------

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={"text-[11px] px-2.5 py-1 rounded-full border transition " +
        (on ? "bg-black text-white border-black" : "bg-white text-stone-600 border-stone-300 hover:border-stone-900")}>
      {children}
    </button>
  );
}

function ProductEditor({
  p, v, onPickVariant, currentPhotos, hasChange, move, removePhoto, resetVariant,
}: {
  p: Product;
  v: Variant;
  onPickVariant: (colorCode: string) => void;
  currentPhotos: (p: Product, v: Variant) => string[];
  hasChange: (p: Product, v: Variant) => boolean;
  move: (p: Product, v: Variant, idx: number, dir: -1 | 1) => void;
  removePhoto: (p: Product, v: Variant, idx: number) => void;
  resetVariant: (p: Product, v: Variant) => void;
}) {
  const photos = currentPhotos(p, v);
  const changed = hasChange(p, v);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] tracking-[0.18em] uppercase text-stone-400">
            {p.section} · {p.collection} · {p.category}
          </p>
          <h2 className="text-xl font-semibold tracking-tight">{p.name}</h2>
          <p className="text-xs text-stone-500 font-mono mt-0.5">#{p.code}</p>
        </div>
        {changed && (
          <button onClick={() => resetVariant(p, v)}
            className="text-xs text-stone-600 underline hover:text-stone-900">
            ↺ Volver al orden original
          </button>
        )}
      </div>

      {p.variants.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {p.variants.map((vr) => (
            <button key={vr.colorCode} onClick={() => onPickVariant(vr.colorCode)}
              className={"flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition " +
                (vr.colorCode === v.colorCode
                  ? "border-black bg-black text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-900")}>
              <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: vr.hex }} />
              {vr.colorName}
              {vr.colorCode !== "-" && <span className="opacity-50">({vr.colorCode})</span>}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-stone-500 font-medium mb-3">
          {photos.length} fotos · usá ← → para reordenar, ✕ para borrar
        </p>
        {photos.length === 0 ? (
          <p className="text-sm text-stone-400 border border-dashed border-stone-300 rounded-xl p-8 text-center">
            No quedan fotos en esta variante.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {photos.map((url, i) => (
              <li key={url + i} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="relative">
                  <img src={url} alt={`#${i + 1}`}
                    className="w-full h-72 object-contain bg-stone-50" />
                  <span className="absolute top-2 left-2 bg-black text-white text-[11px] font-mono px-1.5 py-0.5 rounded">
                    #{i + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-stone-100">
                  <p className="text-[10px] text-stone-400 font-mono truncate">{url.split("/").pop()}</p>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => move(p, v, i, -1)} disabled={i === 0}
                      className="w-7 h-7 rounded border border-stone-300 text-sm leading-none hover:bg-stone-100 disabled:opacity-30">
                      ←
                    </button>
                    <button onClick={() => move(p, v, i, 1)} disabled={i === photos.length - 1}
                      className="w-7 h-7 rounded border border-stone-300 text-sm leading-none hover:bg-stone-100 disabled:opacity-30">
                      →
                    </button>
                    <button onClick={() => {
                      if (confirm("¿Sacar esta foto del producto?")) removePhoto(p, v, i);
                    }}
                      className="w-7 h-7 rounded border border-stone-300 text-stone-500 text-sm leading-none hover:bg-red-50 hover:border-red-300 hover:text-red-600">
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
