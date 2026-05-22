"use client";

// CATÁLOGO MAYORISTA — Mormaii Sports Verão 27.
// Grilla producto×color, filtros, modal con galería, carrito por curvas
// pre-pack y checkout para locales. Datos: /catalog-data.json + fotos en
// /catalog/. Con `token` envía el pedido al backend; sin token (ruta
// /preview) guarda local como vista previa.

import { useEffect, useMemo, useState } from "react";

type Variant = { colorCode: string; colorName: string; hex: string; photos: string[] };
type Fabric = { name: string; tagline: string; features: string[]; desc: string };
type Product = {
  code: string; name: string; section: string; category: string;
  collection: string; page: string; mayorista: number;
  commercialDesc?: string; composition?: string | null;
  fabric?: Fabric | null; variants: Variant[];
};
type Tile = { p: Product; v: Variant; key: string };
type CartLine = { key: string; p: Product; v: Variant; qty: number };

const CURVA = [
  { size: "P", units: 1 }, { size: "M", units: 2 },
  { size: "G", units: 3 }, { size: "GG", units: 2 },
];
const CURVA_UNITS = 8;
const usd = (n: number) =>
  "US$ " + n.toLocaleString("es-PY", { maximumFractionDigits: 2 });

function Photo({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  if (!src || err)
    return (
      <div className={className + " bg-stone-100 flex items-center justify-center text-[10px] uppercase tracking-wide text-stone-300"}>
        sin foto
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={className} />;
}

function Stepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  if (qty === 0)
    return (
      <button onClick={() => onChange(1)}
        className="mt-2 w-full rounded-full bg-black text-white font-medium py-2 text-xs hover:bg-stone-800 transition">
        + Agregar curva
      </button>
    );
  return (
    <div className="mt-2 flex items-center justify-between rounded-full border border-black overflow-hidden">
      <button onClick={() => onChange(qty - 1)} className="px-3 py-2 text-sm hover:bg-stone-100">−</button>
      <div className="text-xs text-center px-2">
        <div className="font-semibold">{qty} {qty === 1 ? "curva" : "curvas"}</div>
        <div className="text-[10px] text-stone-500">{qty * CURVA_UNITS} u.</div>
      </div>
      <button onClick={() => onChange(qty + 1)} className="px-3 py-2 text-sm hover:bg-stone-100">+</button>
    </div>
  );
}

function CurvaTags() {
  return (
    <div className="flex flex-wrap gap-1 text-[11px] text-stone-500 mt-1.5">
      {CURVA.map((s, i) => (
        <span key={s.size} className="inline-flex items-baseline gap-0.5">
          <span className="font-medium text-stone-700">{s.size}</span>
          <span className="text-stone-400">×{s.units}</span>
          {i < CURVA.length - 1 && <span className="text-stone-300 ml-1">·</span>}
        </span>
      ))}
    </div>
  );
}

export default function CatalogClient({ token }: { token?: string }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [collection, setCollection] = useState("");
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [open, setOpen] = useState<Tile | null>(null);
  const [step, setStep] = useState<"catalog" | "checkout" | "done">("catalog");

  useEffect(() => {
    fetch("/catalog-data.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]));
  }, []);

  const tiles: Tile[] = useMemo(() => {
    if (!products) return [];
    const out: Tile[] = [];
    for (const p of products)
      for (const v of p.variants)
        out.push({ p, v, key: `${p.code}/${v.colorCode}` });
    return out;
  }, [products]);

  const sections = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.section))).sort(),
    [products],
  );
  const pool0 = useMemo(
    () => tiles.filter((t) => !section || t.p.section === section),
    [tiles, section],
  );
  const collections = useMemo(
    () => Array.from(new Set(pool0.map((t) => t.p.collection).filter(Boolean))).sort(),
    [pool0],
  );
  const categories = useMemo(
    () => Array.from(new Set(pool0.map((t) => t.p.category))).sort(),
    [pool0],
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pool0.filter((t) => {
      if (collection && t.p.collection !== collection) return false;
      if (category && t.p.category !== category) return false;
      if (qq && !`${t.p.name} ${t.p.code} ${t.v.colorName}`.toLowerCase().includes(qq))
        return false;
      return true;
    });
  }, [pool0, collection, category, q]);

  const groups = useMemo(() => {
    const m = new Map<string, Tile[]>();
    for (const t of filtered) {
      const k = t.p.collection || "Otros";
      (m.get(k) || m.set(k, []).get(k)!).push(t);
    }
    return Array.from(m.entries())
      .sort((a, b) => {
        // Gorras ("Cap") siempre al final → en Hombre, la ropa aparece primero.
        const ca = a[0] === "Cap" ? 1 : 0;
        const cb = b[0] === "Cap" ? 1 : 0;
        return ca - cb || a[0].localeCompare(b[0], "es");
      })
      .map(([name, items]) => ({ name, items }));
  }, [filtered]);

  const setQty = (key: string, qn: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qn <= 0) delete next[key];
      else next[key] = qn;
      return next;
    });

  const cartLines: CartLine[] = useMemo(() => {
    if (!products) return [];
    const out: CartLine[] = [];
    for (const key of Object.keys(cart)) {
      const [pcode, ccode] = key.split("/");
      const p = products.find((x) => x.code === pcode);
      const v = p?.variants.find((x) => x.colorCode === ccode);
      if (p && v) out.push({ key, p, v, qty: cart[key] });
    }
    return out;
  }, [cart, products]);

  const totalCurvas = cartLines.reduce((s, l) => s + l.qty, 0);
  const totalUsd = cartLines.reduce((s, l) => s + l.p.mayorista * CURVA_UNITS * l.qty, 0);

  if (step === "done")
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-md text-center">
          <div className="text-4xl">✓</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pedido enviado</h1>
          <p className="mt-3 text-stone-600 leading-relaxed">
            Recibimos tu pedido. El equipo de KEMSA se contacta para confirmar
            disponibilidad y coordinar el envío.
          </p>
          <button onClick={() => { setCart({}); setStep("catalog"); }}
            className="mt-8 text-[11px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700">
            ↺ Hacer otro pedido
          </button>
        </div>
      </main>
    );

  if (step === "checkout")
    return <Checkout token={token} lines={cartLines} totalCurvas={totalCurvas} totalUsd={totalUsd}
      onBack={() => setStep("catalog")} onDone={() => setStep("done")} />;

  return (
    <main className="min-h-screen bg-white text-stone-900 pb-28">
      {!token && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-center text-[12px] text-amber-800">
          Vista previa · el pedido no se envía (modo demo)
        </div>
      )}

      <header className="px-5 sm:px-10 pt-7 pb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400">Catálogo mayorista</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight">
            Mormaii Sports · Verão 27
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            Pre-pack <span className="font-medium text-stone-700">P×1 · M×2 · G×3 · GG×2</span> · precio mayorista por unidad.
          </p>
        </div>
        <button onClick={() => setCartOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 border border-stone-300 rounded-full px-4 py-2 text-sm hover:border-stone-900 transition">
          🛒 <span className="font-medium">{totalCurvas}</span>
        </button>
      </header>

      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-y border-stone-200 px-5 sm:px-10 py-3 space-y-2.5">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto, código o color"
          className="w-full border border-stone-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-stone-900" />
        <Row label="Sección" opts={sections} value={section}
          onPick={(v) => { setSection(v); setCollection(""); setCategory(""); }} allLabel="Todas" />
        <Row label="Colección" opts={collections} value={collection} onPick={setCollection} allLabel="Todas las colecciones" />
        <Row label="Categoría" opts={categories} value={category} onPick={setCategory} allLabel="Todas" />
      </div>

      <div className="px-5 sm:px-10 pt-3 text-xs text-stone-400">
        {products === null ? "Cargando catálogo…" : `${filtered.length} estilos · ${groups.length} colecciones`}
      </div>

      {products && groups.length === 0 && (
        <p className="px-5 py-16 text-center text-stone-400">No hay productos con ese filtro.</p>
      )}

      {groups.map((g) => (
        <section key={g.name}>
          <div className="px-5 sm:px-10 pt-7 pb-1 flex items-baseline justify-between">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{g.name}</h2>
            <span className="text-[11px] uppercase tracking-wide text-stone-400">{g.items.length} estilos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9 px-5 sm:px-10 py-4">
            {g.items.map((t) => {
              const qty = cart[t.key] || 0;
              return (
                <div key={t.key} className="flex flex-col">
                  <button onClick={() => setOpen(t)} className="block text-left group">
                    <div className={"overflow-hidden rounded-lg " + (qty > 0 ? "ring-1 ring-black" : "")}>
                      <Photo src={t.v.photos[0]} alt={t.p.name}
                        className="aspect-[3/4] w-full object-cover bg-stone-100 group-hover:opacity-90 transition" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.13em] text-stone-400 mt-2.5">
                      {t.p.category}{t.v.colorCode !== "-" ? ` · ${t.v.colorName}` : ""}
                    </p>
                    <p className="text-[13px] leading-snug mt-1 line-clamp-2 min-h-[2.2rem] text-stone-800">{t.p.name}</p>
                    <p className="text-[11px] text-stone-400 font-mono">
                      #{t.p.code}{t.v.colorCode !== "-" ? `  ·  color ${t.v.colorCode}` : ""}
                    </p>
                    <p className="text-sm font-semibold mt-1">{usd(t.p.mayorista)}
                      <span className="text-[11px] font-normal text-stone-400 ml-1.5">/ unid. mayorista</span>
                    </p>
                    <p className="text-[11px] text-stone-500">Curva (8u) · {usd(t.p.mayorista * CURVA_UNITS)}</p>
                  </button>
                  {t.p.variants.length > 1 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {t.p.variants.map((vr) => (
                        <button key={vr.colorCode} title={vr.colorName}
                          onClick={() => setOpen({ p: t.p, v: vr, key: `${t.p.code}/${vr.colorCode}` })}
                          className={"h-4 w-4 rounded-full border " +
                            (vr.colorCode === t.v.colorCode ? "border-black ring-1 ring-black" : "border-stone-300")}
                          style={{ backgroundColor: vr.hex }} />
                      ))}
                    </div>
                  )}
                  {t.p.category !== "Boné" && <CurvaTags />}
                  <Stepper qty={qty} onChange={(qn) => setQty(t.key, qn)} />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {open && (
        <Modal tile={open} cart={cart} setQty={setQty} onClose={() => setOpen(null)}
          onPickVariant={(vr) => setOpen({ p: open.p, v: vr, key: `${open.p.code}/${vr.colorCode}` })} />
      )}

      {cartOpen && (
        <CartDrawer lines={cartLines} totalCurvas={totalCurvas} totalUsd={totalUsd}
          setQty={setQty} onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setStep("checkout"); }} />
      )}

      {totalCurvas > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 px-5 py-4 z-30">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <span className="text-sm text-stone-600">
              🛒 <span className="font-semibold text-stone-900">{totalCurvas}</span> curvas · {usd(totalUsd)}
            </span>
            <button onClick={() => setCartOpen(true)}
              className="ml-auto bg-black text-white font-medium rounded-full px-7 py-3">Ver carrito →</button>
          </div>
        </div>
      )}
    </main>
  );
}

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

function Modal({ tile, cart, setQty, onClose, onPickVariant }: {
  tile: Tile; cart: Record<string, number>;
  setQty: (k: string, q: number) => void; onClose: () => void;
  onPickVariant: (v: Variant) => void;
}) {
  const { p, v, key } = tile;
  const [gIdx, setGIdx] = useState(0);
  useEffect(() => setGIdx(0), [key]);
  const imgs = v.photos;
  const qty = cart[key] || 0;
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl max-h-[94vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div className="min-w-0 pr-3">
            <p className="font-medium text-sm truncate">{p.name}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 font-mono">
              #{p.code}
              {v.colorCode !== "-" ? ` · ${v.colorName} (${v.colorCode})` : ""}
              {p.collection ? ` · ${p.collection}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 text-xl px-1">✕</button>
        </div>
        <div className="p-5">
          <div className="relative">
            <Photo src={imgs[gIdx]} alt={p.name}
              className="w-full object-contain bg-stone-50 max-h-[56vh] rounded-lg" />
            {imgs.length > 1 && (
              <>
                <button onClick={() => setGIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg">‹</button>
                <button onClick={() => setGIdx((i) => (i + 1) % imgs.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 border border-stone-200 rounded-full w-9 h-9 text-lg">›</button>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/85 text-stone-600 text-[11px] px-2 py-0.5 rounded-full">
                  {gIdx + 1} / {imgs.length}
                </span>
              </>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
              {imgs.map((f, i) => (
                <button key={f} onClick={() => setGIdx(i)}
                  className={"shrink-0 overflow-hidden border rounded " + (i === gIdx ? "border-black" : "border-stone-200")}>
                  <Photo src={f} alt="" className="h-16 w-16 object-cover bg-stone-50" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <span className="text-lg font-semibold">{usd(p.mayorista)}</span>
            <span className="text-[11px] uppercase tracking-wide text-stone-400 ml-2">/ unidad mayorista</span>
            <div className="text-[12px] text-stone-500 mt-0.5">
              Curva (8u) · {usd(p.mayorista * CURVA_UNITS)}
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
                Color <span className="ml-2 text-stone-900 normal-case tracking-normal">· {v.colorName}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((vr) => (
                  <button key={vr.colorCode} title={vr.colorName} onClick={() => onPickVariant(vr)}
                    className={"h-7 w-7 rounded-full border transition " +
                      (vr.colorCode === v.colorCode ? "border-black ring-2 ring-black ring-offset-2" : "border-stone-300 hover:border-stone-900")}
                    style={{ backgroundColor: vr.hex }} />
                ))}
              </div>
            </div>
          )}
          {p.category !== "Boné" && (
            <div className="mt-4">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Curva pre-pack</p>
              <CurvaTags />
            </div>
          )}

          {p.fabric && (
            <div className="mt-5 border-t border-stone-100 pt-4">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                La tela · {p.fabric.name}
              </p>
              <p className="text-sm font-medium mt-1">{p.fabric.tagline}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.fabric.features.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-1 border border-stone-300 text-stone-600 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-500 leading-relaxed mt-2">{p.fabric.desc}</p>
            </div>
          )}

          <div className="mt-4"><Stepper qty={qty} onChange={(qn) => setQty(key, qn)} /></div>
          <button onClick={onClose} className="mt-6 w-full rounded-full py-3 text-sm bg-black text-white font-medium">Listo</button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ lines, totalCurvas, totalUsd, setQty, onClose, onCheckout }: {
  lines: CartLine[]; totalCurvas: number; totalUsd: number;
  setQty: (k: string, q: number) => void; onClose: () => void; onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex justify-end">
      <div className="bg-white w-full max-w-md flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold tracking-tight">Carrito mayorista</h2>
          <button onClick={onClose} className="text-stone-400 text-xl px-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {lines.length === 0 && <p className="text-sm text-stone-400 text-center py-12">Todavía no agregaste curvas.</p>}
          {lines.map((l) => (
            <div key={l.key} className="flex gap-3 pb-4 border-b border-stone-100">
              <Photo src={l.v.photos[0]} alt={l.p.name} className="w-16 h-20 object-cover rounded bg-stone-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug line-clamp-2">{l.p.name}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">#{l.p.code} · {l.v.colorName}</p>
                <p className="text-[11px] font-semibold mt-1">{usd(l.p.mayorista * CURVA_UNITS)} / curva</p>
                <Stepper qty={l.qty} onChange={(qn) => setQty(l.key, qn)} />
              </div>
            </div>
          ))}
        </div>
        {lines.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Curvas</span>
              <span className="font-medium">{totalCurvas} · {totalCurvas * CURVA_UNITS} unidades</span>
            </div>
            <div className="flex justify-between text-base mb-3">
              <span className="text-stone-500">Total mayorista</span>
              <span className="font-semibold">{usd(totalUsd)}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-black text-white font-medium rounded-full py-3 text-sm">
              Enviar pedido →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Checkout({ token, lines, totalCurvas, totalUsd, onBack, onDone }: {
  token?: string; lines: CartLine[]; totalCurvas: number; totalUsd: number;
  onBack: () => void; onDone: () => void;
}) {
  const [empresa, setEmpresa] = useState("");
  const [contacto, setContacto] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!empresa || !contacto) { setError("Completá empresa y contacto."); return; }
    setError("");
    setSending(true);
    if (token) {
      try {
        const res = await fetch("/api/pedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token, empresa, contacto, phone: phone || null, comment: comment || null,
            items: lines.map((l) => ({
              code: l.p.code, name: l.p.name, color: l.v.colorName,
              colorCode: l.v.colorCode, curvas: l.qty, mayoristaUnit: l.p.mayorista,
            })),
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || "No se pudo enviar el pedido.");
      } catch (e: any) {
        setError(e?.message || "Error al enviar.");
        setSending(false);
        return;
      }
    }
    setSending(false);
    onDone();
  };

  return (
    <main className="min-h-screen bg-white p-5 max-w-lg mx-auto">
      <button onClick={onBack} className="text-sm text-stone-500 mb-6">← Volver al catálogo</button>
      <h1 className="text-2xl font-semibold tracking-tight">Confirmar pedido</h1>
      <p className="text-sm text-stone-500 mt-1">
        {totalCurvas} curvas · {totalCurvas * CURVA_UNITS} unidades · {usd(totalUsd)}
      </p>
      <Field label="Empresa / Local *"><input className="inp" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Razón social o nombre del local" /></Field>
      <Field label="Nombre de contacto *"><input className="inp" value={contacto} onChange={(e) => setContacto(e.target.value)} /></Field>
      <Field label="Teléfono (opcional)"><input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+595" /></Field>
      <Field label="Comentario (opcional)"><textarea className="inp" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      <button onClick={submit} disabled={sending}
        className="mt-6 w-full bg-black text-white font-medium rounded-full py-3.5 disabled:opacity-50">
        {sending ? "Enviando…" : "Enviar pedido"}
      </button>
      <style jsx global>{`
        .inp{width:100%;margin-top:8px;border:1px solid #e7e5e4;border-radius:10px;padding:11px 13px;outline:none;font-size:15px;background:#fff;}
        .inp:focus{border-color:#111;}
      `}</style>
    </main>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block mt-5"><span className="text-sm font-medium text-stone-700">{label}</span>{children}</label>;
}
