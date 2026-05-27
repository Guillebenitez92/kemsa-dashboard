"use client";

// Selector de muestras para pedir a KMNO (uso interno):
// muestra todos los artículos del catálogo con precio FOB (USD), permite
// elegir color + talle + cantidad y descargar el pedido de muestras en CSV.

import { useCallback, useEffect, useMemo, useState } from "react";
import { applyPhotoOverrides, fetchPhotoOverrides } from "@/lib/photo-overrides";

type Variant = {
  colorCode: string; colorName: string; hex: string;
  photos: string[]; mayorista?: number;
};
type Product = {
  code: string; name: string; section: string; category: string;
  collection: string; mayorista: number;
  kind?: "curva" | "sized"; sizes?: string[];
  commercialDesc?: string; composition?: string | null;
  variants: Variant[];
};
type Tile = { p: Product; v: Variant; key: string };
type CartLine = { key: string; p: Product; v: Variant; size: string; qty: number };

const MARKUP = 2.3;
const fob = (mayorista: number) =>
  Math.round((mayorista / MARKUP) * 100) / 100;
const unitMayorista = (p: Product, v: Variant) => v.mayorista ?? p.mayorista;
const unitFob = (p: Product, v: Variant) => fob(unitMayorista(p, v));
const usd = (n: number) =>
  "US$ " + n.toLocaleString("es-PY", { maximumFractionDigits: 2 });

function defaultSizes(p: Product): string[] {
  if (p.kind === "sized" && p.sizes && p.sizes.length) return p.sizes;
  if (p.category === "Boné" || p.category === "Cinturón") return ["Único"];
  return ["P", "M", "G", "GG"];
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// --------------------------------------------------------------------------

export default function MuestrasPage() {
  const [state, setState] = useState<"loading" | "unauth" | "ok" | "error">(
    "loading",
  );
  const [products, setProducts] = useState<Product[] | null>(null);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [collection, setCollection] = useState("");
  const [category, setCategory] = useState("");

  // cart key = `${code}/${colorCode}/${size}` → qty (unidades de muestra)
  const [cart, setCart] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState<Tile | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  // chequeo de sesión admin (endpoint liviano, no toca Supabase).
  const load = useCallback(async () => {
    setState("loading");
    const r = await fetch("/api/admin/check", { cache: "no-store" });
    if (r.status === 401) { setState("unauth"); return; }
    if (!r.ok) { setErr("No se pudo verificar la sesión."); setState("error"); return; }
    try {
      const [cd, overrides] = await Promise.all([
        fetch("/catalog-data.json", { cache: "no-store" }).then((x) => x.json()),
        fetchPhotoOverrides(),
      ]);
      setProducts(applyPhotoOverrides<Product>(cd.products, overrides));
      setState("ok");
    } catch (e: any) {
      setErr(e?.message || "No se pudo cargar el catálogo.");
      setState("error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setQty = (key: string, n: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[key]; else next[key] = n;
      return next;
    });

  const sections = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.section))).sort(),
    [products],
  );
  const pool0 = useMemo(
    () => (products || []).filter((p) => !section || p.section === section),
    [products, section],
  );
  const collections = useMemo(
    () => Array.from(new Set(pool0.map((p) => p.collection).filter(Boolean))).sort(),
    [pool0],
  );
  const categories = useMemo(
    () => Array.from(new Set(pool0.map((p) => p.category))).sort(),
    [pool0],
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pool0.filter((p) => {
      if (collection && p.collection !== collection) return false;
      if (category && p.category !== category) return false;
      if (qq && !`${p.name} ${p.code} ${p.variants.map((v) => v.colorName).join(" ")}`.toLowerCase().includes(qq)) return false;
      return true;
    });
  }, [pool0, collection, category, q]);

  // Una tarjeta por producto × color (como en el catálogo mayorista) —
  // así se ve la variante con SU foto y se elige cualquier color al click.
  const tiles: Tile[] = useMemo(() => {
    const out: Tile[] = [];
    for (const p of filtered)
      for (const v of p.variants)
        out.push({ p, v, key: `${p.code}/${v.colorCode}` });
    return out;
  }, [filtered]);

  const lines: CartLine[] = useMemo(() => {
    if (!products) return [];
    const out: CartLine[] = [];
    for (const k of Object.keys(cart)) {
      const [code, colorCode, size] = k.split("/");
      const p = products.find((x) => x.code === code);
      const v = p?.variants.find((x) => x.colorCode === colorCode);
      if (p && v && size) out.push({ key: k, p, v, size, qty: cart[k] });
    }
    return out;
  }, [cart, products]);

  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);
  const totalFob =
    Math.round(lines.reduce((s, l) => s + unitFob(l.p, l.v) * l.qty, 0) * 100) / 100;

  const downloadCSV = () => {
    const rows: string[] = [];
    rows.push(
      [
        "Sección", "Colección", "Categoría", "Código", "Producto",
        "Color", "Código color", "Talle", "Cantidad",
        "FOB unitario USD", "Subtotal FOB USD",
      ].join(","),
    );
    for (const l of lines) {
      const fobU = unitFob(l.p, l.v);
      rows.push(
        [
          csvCell(l.p.section), csvCell(l.p.collection), csvCell(l.p.category),
          csvCell(l.p.code), csvCell(l.p.name),
          csvCell(l.v.colorName), csvCell(l.v.colorCode), csvCell(l.size),
          csvCell(l.qty), csvCell(fobU),
          csvCell(Math.round(fobU * l.qty * 100) / 100),
        ].join(","),
      );
    }
    if (comment.trim()) {
      rows.push("");
      rows.push(`"Comentario:","${comment.replace(/"/g, '""')}"`);
    }
    rows.push("");
    rows.push(`"TOTAL","","","","","","","",${csvCell(totalUnits)},"",${csvCell(totalFob)}`);

    const csv = "﻿" + rows.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `muestras-mormaii-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // -- estados de auth/loading --

  if (state === "loading")
    return <main className="min-h-screen flex items-center justify-center text-stone-400">Cargando…</main>;

  if (state === "unauth")
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-brand">Muestras KMNO</h1>
          <p className="text-sm text-stone-500 mt-2">Iniciá sesión en el panel para armar el pedido.</p>
          <a href="/admin" className="mt-4 inline-block bg-brand text-white font-semibold rounded-xl px-5 py-2.5">
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );

  if (state === "error" || !products)
    return <main className="min-h-screen flex items-center justify-center p-6 text-red-600">{err || "Error."}</main>;

  // -- UI principal --

  return (
    <main className="min-h-screen bg-white text-stone-900 pb-28">
      <header className="px-5 sm:px-10 pt-7 pb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400">Pedido de muestras · KMNO</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Selector de muestras Mormaii</h1>
          <p className="text-sm text-stone-500 mt-1.5">
            Precios <span className="font-medium text-stone-700">FOB</span> (USD). Pedí cualquier producto por color y talle; al final descargás el CSV.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/pedidos" className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2">
            ← Pedidos
          </a>
          <button onClick={() => setCartOpen(true)}
            className="text-sm bg-brand text-white rounded-lg px-4 py-2 font-medium">
            🛒 {totalUnits} u. · {usd(totalFob)}
          </button>
        </div>
      </header>

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-y border-stone-200 px-5 sm:px-10 py-3 space-y-2.5">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto, código o color"
          className="w-full border border-stone-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-stone-900" />
        <Row label="Sección" opts={sections} value={section}
          onPick={(v) => { setSection(v); setCollection(""); setCategory(""); }} allLabel="Todas" />
        <Row label="Colección" opts={collections} value={collection} onPick={setCollection} allLabel="Todas" />
        <Row label="Categoría" opts={categories} value={category} onPick={setCategory} allLabel="Todas" />
      </div>

      <div className="px-5 sm:px-10 pt-3 text-xs text-stone-400">
        {filtered.length} productos · {tiles.length} colores
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 px-5 sm:px-10 py-4">
        {tiles.map((t) => {
          const inCart = lines
            .filter((l) => l.p.code === t.p.code && l.v.colorCode === t.v.colorCode)
            .reduce((s, l) => s + l.qty, 0);
          return (
            <button key={t.key} onClick={() => setOpen(t)}
              className="flex flex-col text-left group">
              <div className={"overflow-hidden rounded-lg " + (inCart > 0 ? "ring-1 ring-black" : "")}>
                {t.v.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.v.photos[0]} alt={t.p.name} loading="lazy"
                    className="aspect-[3/4] w-full object-cover bg-stone-100 group-hover:opacity-90 transition" />
                ) : (
                  <div className="aspect-[3/4] w-full bg-stone-100" />
                )}
              </div>
              <p className="text-[10px] uppercase tracking-[0.13em] text-stone-400 mt-2.5">
                {t.p.section} · {t.p.category}{t.v.colorCode !== "-" ? ` · ${t.v.colorName}` : ""}
              </p>
              <p className="text-[13px] leading-snug mt-1 line-clamp-2 min-h-[2.2rem] text-stone-800">{t.p.name}</p>
              <p className="text-[11px] text-stone-400 font-mono">
                #{t.p.code}{t.v.colorCode !== "-" ? ` · color ${t.v.colorCode}` : ""}
              </p>
              <p className="text-sm font-semibold mt-1">
                {usd(unitFob(t.p, t.v))}
                <span className="text-[11px] font-normal text-stone-400 ml-1.5">FOB / unidad</span>
              </p>
              {t.p.variants.length > 1 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {t.p.variants.slice(0, 8).map((vr) => (
                    <span key={vr.colorCode} title={vr.colorName}
                      className={"h-3.5 w-3.5 rounded-full border " +
                        (vr.colorCode === t.v.colorCode ? "border-black ring-1 ring-black" : "border-stone-300")}
                      style={{ backgroundColor: vr.hex }} />
                  ))}
                </div>
              )}
              {inCart > 0 && (
                <p className="text-[11px] font-medium text-brand mt-1">{inCart} u. en muestra</p>
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <Picker tile={open} cart={cart} setQty={setQty} onClose={() => setOpen(null)} />
      )}

      {cartOpen && (
        <CartDrawer
          lines={lines} totalUnits={totalUnits} totalFob={totalFob}
          comment={comment} setComment={setComment}
          setQty={setQty} onClose={() => setCartOpen(false)}
          onDownload={downloadCSV} onClear={() => setCart({})}
        />
      )}

      {totalUnits > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-5 py-4 z-30">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <span className="text-sm text-stone-600">
              🛒 <span className="font-semibold text-stone-900">{totalUnits}</span> muestras · {usd(totalFob)} FOB
            </span>
            <button onClick={() => setCartOpen(true)}
              className="ml-auto bg-black text-white font-medium rounded-full px-6 py-2.5">Ver carrito →</button>
          </div>
        </div>
      )}
    </main>
  );
}

// --------------------------------------------------------------------------

function Row({ label, opts, value, onPick, allLabel }: {
  label: string; opts: string[]; value: string; onPick: (v: string) => void; allLabel: string;
}) {
  if (opts.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 items-center">
      <span className="text-[10px] uppercase tracking-wide text-stone-400 shrink-0 w-16">{label}</span>
      <Chip on={!value} onClick={() => onPick("")}>{allLabel}</Chip>
      {opts.map((o) => <Chip key={o} on={value === o} onClick={() => onPick(o)}>{o}</Chip>)}
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={"whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full border transition " +
        (on ? "bg-black text-white border-black" : "bg-white text-stone-600 border-stone-300 hover:border-stone-900")}>
      {children}
    </button>
  );
}

function Picker({ tile, cart, setQty, onClose }: {
  tile: Tile; cart: Record<string, number>;
  setQty: (k: string, n: number) => void; onClose: () => void;
}) {
  const { p } = tile;
  const initialIdx = Math.max(0, p.variants.findIndex((x) => x.colorCode === tile.v.colorCode));
  const [vIdx, setVIdx] = useState(initialIdx);
  const [gIdx, setGIdx] = useState(0);
  const v = p.variants[vIdx];
  const sizes = defaultSizes(p);
  useEffect(() => setGIdx(0), [vIdx]);
  const imgs = v.photos;
  const totalForV = sizes.reduce(
    (s, sz) => s + (cart[`${p.code}/${v.colorCode}/${sz}`] || 0), 0);

  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div className="min-w-0 pr-3">
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 font-mono">
              #{p.code}{v.colorCode !== "-" ? ` · ${v.colorName}` : ""} · {p.section}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 text-xl px-1">✕</button>
        </div>

        <div className="p-5">
          <div className="relative">
            {imgs[gIdx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgs[gIdx]} alt={p.name}
                className="w-full object-contain bg-stone-50 max-h-[52vh] rounded-lg" />
            ) : (
              <div className="aspect-[3/4] w-full bg-stone-100" />
            )}
            {imgs.length > 1 && (
              <>
                <button onClick={() => setGIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg">‹</button>
                <button onClick={() => setGIdx((i) => (i + 1) % imgs.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg">›</button>
              </>
            )}
          </div>

          <div className="mt-4">
            <span className="text-lg font-semibold">{usd(unitFob(p, v))}</span>
            <span className="text-[11px] uppercase tracking-wide text-stone-400 ml-2">FOB / unidad</span>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Mayorista referencia · {usd(unitMayorista(p, v))}
            </div>
          </div>

          {p.commercialDesc && (
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">{p.commercialDesc}</p>
          )}
          {p.composition && (
            <p className="mt-1.5 text-xs text-stone-500">
              <span className="uppercase tracking-wide text-stone-400">Composición · </span>
              <span className="font-medium text-stone-700">{p.composition}</span>
            </p>
          )}

          {p.variants.length > 1 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Color {v.colorCode !== "-" && <span className="ml-1 text-stone-900 normal-case tracking-normal">· {v.colorName}</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((vr, i) => (
                  <button key={vr.colorCode + i} title={vr.colorName} onClick={() => setVIdx(i)}
                    className={"h-7 w-7 rounded-full border transition " +
                      (i === vIdx ? "border-black ring-2 ring-black ring-offset-2" : "border-stone-300 hover:border-stone-900")}
                    style={{ backgroundColor: vr.hex }} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Talle y cantidad
              {totalForV > 0 && (
                <span className="ml-2 text-stone-900 normal-case tracking-normal">· {totalForV} u.</span>
              )}
            </p>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sizes.map((sz) => {
                const k = `${p.code}/${v.colorCode}/${sz}`;
                const qn = cart[k] || 0;
                return (
                  <div key={sz}
                    className={"flex items-center justify-between rounded-xl border px-3 py-1.5 " +
                      (qn > 0 ? "border-black bg-stone-50" : "border-stone-200")}>
                    <span className="text-sm font-medium">{sz}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setQty(k, Math.max(0, qn - 1))}
                        className="w-7 h-7 rounded-full border border-stone-300 text-base leading-none hover:bg-stone-100">−</button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{qn}</span>
                      <button onClick={() => setQty(k, qn + 1)}
                        className="w-7 h-7 rounded-full border border-stone-300 text-base leading-none hover:bg-stone-100">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={onClose}
            className="mt-6 w-full rounded-full py-3 text-sm bg-black text-white font-medium">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  lines, totalUnits, totalFob, comment, setComment, setQty, onClose, onDownload, onClear,
}: {
  lines: CartLine[]; totalUnits: number; totalFob: number;
  comment: string; setComment: (s: string) => void;
  setQty: (k: string, n: number) => void; onClose: () => void;
  onDownload: () => void; onClear: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex justify-end">
      <div className="bg-white w-full max-w-md flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold tracking-tight">Pedido de muestras</h2>
          <button onClick={onClose} className="text-stone-400 text-xl px-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {lines.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-12">Todavía no agregaste muestras.</p>
          )}
          {lines.map((l) => {
            const fobU = unitFob(l.p, l.v);
            return (
              <div key={l.key} className="flex gap-3 pb-3 border-b border-stone-100">
                {l.v.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.v.photos[0]} alt={l.p.name}
                    className="w-14 h-18 object-cover rounded bg-stone-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-snug line-clamp-2">{l.p.name}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    #{l.p.code}
                    {l.v.colorCode !== "-" ? ` · ${l.v.colorName}` : ""}
                    {` · talle ${l.size}`}
                  </p>
                  <p className="text-[11px] font-semibold mt-0.5">
                    {usd(fobU)} FOB · subtotal {usd(Math.round(fobU * l.qty * 100) / 100)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <button onClick={() => setQty(l.key, Math.max(0, l.qty - 1))}
                      className="w-7 h-7 rounded-full border border-stone-300 text-base leading-none hover:bg-stone-100">−</button>
                    <span className="w-10 text-center text-xs font-semibold">{l.qty} u.</span>
                    <button onClick={() => setQty(l.key, l.qty + 1)}
                      className="w-7 h-7 rounded-full border border-stone-300 text-base leading-none hover:bg-stone-100">+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4 space-y-3">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              rows={2} placeholder="Comentario para KMNO (opcional)"
              className="w-full border border-stone-200 rounded-lg p-2 text-sm outline-none focus:border-stone-900" />
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Total muestras</span>
              <span className="font-medium">{totalUnits} u.</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-stone-500">Total FOB</span>
              <span className="font-semibold">{usd(totalFob)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onClear}
                className="flex-1 border border-stone-300 text-stone-600 rounded-full py-2.5 text-sm hover:bg-stone-50">
                Vaciar
              </button>
              <button onClick={onDownload}
                className="flex-1 bg-black text-white font-medium rounded-full py-2.5 text-sm">
                Descargar CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
