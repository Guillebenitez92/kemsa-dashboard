"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Promocion } from "@/lib/supabase";
import {
  colorParaPromocion,
  diasParaArrancar,
  diasRestantes,
  ESTADO_COLOR,
  ESTADO_LABEL,
  estadoDePromocion,
  formatFecha,
  formatRango,
} from "@/lib/promociones-catalog";

type Tab = "vigentes" | "calendario" | "lista";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function uniqueSorted(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export default function PromocionesPublicaPage() {
  const [data, setData] = useState<Promocion[] | null>(null);
  const [err, setErr] = useState("");
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [tab, setTab] = useState<Tab>("vigentes");
  const [fBanco, setFBanco] = useState("");
  const [fShopping, setFShopping] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fTienda, setFTienda] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cursorMes, setCursorMes] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/promociones", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        setErr(d?.error || "Error al cargar.");
        return;
      }
      setData(d.promociones || []);
      setSetupNeeded(Boolean(d.setupNeeded));
    } catch (e: any) {
      setErr(e?.message || "Error de red.");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const opts = useMemo(() => {
    const all = data || [];
    return {
      bancos: uniqueSorted(all.flatMap((p) => p.bancos)),
      shoppings: uniqueSorted(all.flatMap((p) => p.shoppings)),
      marcas: uniqueSorted(all.flatMap((p) => p.marcas)),
      tiendas: uniqueSorted(all.flatMap((p) => p.tiendas)),
    };
  }, [data]);

  const filtradas = useMemo(() => {
    const all = data || [];
    return all.filter((p) => {
      if (fBanco && !p.bancos.includes(fBanco)) return false;
      if (fShopping && !p.shoppings.includes(fShopping)) return false;
      if (fMarca && !p.marcas.includes(fMarca)) return false;
      if (
        fTienda &&
        !p.tiendas.some((t) => t.toLowerCase().includes(fTienda.toLowerCase()))
      )
        return false;
      return true;
    });
  }, [data, fBanco, fShopping, fMarca, fTienda]);

  const hoy = todayISO();
  const vigentesHoy = filtradas.filter(
    (p) => estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy) === "activa",
  );
  const proximas = filtradas
    .filter((p) => estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy) === "proxima")
    .slice(0, 6);

  const limpiarFiltros = () => {
    setFBanco("");
    setFShopping("");
    setFMarca("");
    setFTienda("");
  };
  const hayFiltros = fBanco || fShopping || fMarca || fTienda;

  const promoAbierta = openId ? filtradas.find((p) => p.id === openId) || null : null;

  if (err) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-red-600">
        {err}
      </main>
    );
  }
  if (data === null) {
    return (
      <main className="min-h-screen flex items-center justify-center text-stone-400">
        Cargando promociones…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-brand text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          <p className="text-xs uppercase tracking-widest text-emerald-200 opacity-80">
            KEMSA
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-0.5">
            Promociones vigentes
          </h1>
          <p className="text-sm text-emerald-100 mt-1">
            Agenda compartida de promos con bancos, tarjetas y shoppings — para
            que las tiendas siempre sepan qué está activo hoy.
          </p>
          <p className="text-[11px] mt-2 text-emerald-200/80">
            Hoy: {new Date(hoy + "T00:00:00").toLocaleDateString("es-PY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {setupNeeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-amber-900">
              Falta crear la tabla en Supabase
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Ejecutá el bloque <code className="bg-amber-100 px-1 rounded">create table public.promociones</code> de{" "}
              <code className="bg-amber-100 px-1 rounded">supabase.sql</code> y la vista mostrará promociones.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-full sm:w-fit overflow-x-auto">
          <TabBtn active={tab === "vigentes"} onClick={() => setTab("vigentes")}>
            Vigentes hoy
            <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              {vigentesHoy.length}
            </span>
          </TabBtn>
          <TabBtn active={tab === "calendario"} onClick={() => setTab("calendario")}>
            Calendario
          </TabBtn>
          <TabBtn active={tab === "lista"} onClick={() => setTab("lista")}>
            Lista completa
            <span className="ml-2 text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full">
              {filtradas.length}
            </span>
          </TabBtn>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FiltroSel label="Banco / Tarjeta" value={fBanco} onChange={setFBanco} opts={opts.bancos} />
          <FiltroSel label="Shopping / Cadena" value={fShopping} onChange={setFShopping} opts={opts.shoppings} />
          <FiltroSel label="Marca" value={fMarca} onChange={setFMarca} opts={opts.marcas} />
          <label className="text-xs">
            <span className="block text-stone-500 mb-1">Tienda (texto)</span>
            <input
              value={fTienda}
              onChange={(e) => setFTienda(e.target.value)}
              placeholder="Ej. CDE, Mariscal…"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="col-span-2 sm:col-span-4 text-xs text-brand-accent underline self-start text-left"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Contenido por tab */}
        {tab === "vigentes" && (
          <VistaVigentes
            vigentes={vigentesHoy}
            proximas={proximas}
            onOpen={(id) => setOpenId(id)}
            hoy={hoy}
          />
        )}

        {tab === "calendario" && (
          <VistaCalendario
            promos={filtradas}
            cursor={cursorMes}
            setCursor={setCursorMes}
            onOpen={(id) => setOpenId(id)}
            hoy={hoy}
          />
        )}

        {tab === "lista" && (
          <VistaLista
            promos={filtradas}
            onOpen={(id) => setOpenId(id)}
            hoy={hoy}
          />
        )}

        <p className="text-[11px] text-stone-400 text-center mt-8 mb-4">
          Compartilo: <span className="font-mono">kemsa-dashboard.vercel.app/promociones</span>
          {" · "}
          ¿Falta una promo? Avisá al equipo de marca.
        </p>
      </div>

      {promoAbierta && (
        <PromoModal promo={promoAbierta} onClose={() => setOpenId(null)} hoy={hoy} />
      )}
    </main>
  );
}

// ── Tabs y filtros ─────────────────────────────────────────────────────

function TabBtn({
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
      className={
        "text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition " +
        (active
          ? "bg-brand text-white shadow"
          : "text-stone-600 hover:bg-stone-100")
      }
    >
      {children}
    </button>
  );
}

function FiltroSel({
  label,
  value,
  onChange,
  opts,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opts: string[];
}) {
  return (
    <label className="text-xs">
      <span className="block text-stone-500 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        <option value="">Todos</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── Vista: Vigentes hoy ────────────────────────────────────────────────

function VistaVigentes({
  vigentes,
  proximas,
  onOpen,
  hoy,
}: {
  vigentes: Promocion[];
  proximas: Promocion[];
  onOpen: (id: string) => void;
  hoy: string;
}) {
  return (
    <>
      <h2 className="text-sm font-semibold text-stone-700 mt-6 mb-2">
        Activas ahora ({vigentes.length})
      </h2>
      {vigentes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-stone-400">
          No hay promociones activas hoy con estos filtros.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vigentes.map((p) => (
            <PromoCard key={p.id} p={p} hoy={hoy} onOpen={() => onOpen(p.id)} highlight />
          ))}
        </div>
      )}

      {proximas.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-stone-700 mt-7 mb-2">
            Próximas a arrancar
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proximas.map((p) => (
              <PromoCard key={p.id} p={p} hoy={hoy} onOpen={() => onOpen(p.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function PromoCard({
  p,
  hoy,
  onOpen,
  highlight,
}: {
  p: Promocion;
  hoy: string;
  onOpen: () => void;
  highlight?: boolean;
}) {
  const estado = estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy);
  const color = colorParaPromocion(p);
  const dias =
    estado === "activa"
      ? diasRestantes(p.fecha_fin, hoy)
      : estado === "proxima"
      ? diasParaArrancar(p.fecha_inicio, hoy)
      : null;
  return (
    <button
      onClick={onOpen}
      className={
        "text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition border-l-4 " +
        (highlight ? "ring-1 ring-emerald-100" : "")
      }
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-stone-800 leading-snug">{p.titulo}</h3>
        <span className={"text-[10px] px-2 py-0.5 rounded-full border " + ESTADO_COLOR[estado]}>
          {ESTADO_LABEL[estado]}
        </span>
      </div>
      {(p.descuento_pct != null || p.cuotas != null) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {p.descuento_pct != null && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              -{p.descuento_pct}%
            </span>
          )}
          {p.cuotas != null && p.cuotas > 0 && (
            <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
              {p.cuotas} cuotas s/int
            </span>
          )}
        </div>
      )}
      <div className="text-xs text-stone-500 mt-2 space-y-0.5">
        {p.bancos.length > 0 && <div>💳 {p.bancos.join(" · ")}</div>}
        {p.shoppings.length > 0 && <div>🏬 {p.shoppings.join(" · ")}</div>}
        {p.marcas.length > 0 && <div>🏷️ {p.marcas.join(" · ")}</div>}
      </div>
      <div className="text-[11px] text-stone-500 mt-3 flex items-center justify-between">
        <span>{formatRango(p.fecha_inicio, p.fecha_fin)}</span>
        {dias != null && (
          <span className={estado === "activa" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
            {estado === "activa"
              ? dias === 0
                ? "Último día"
                : `${dias} día${dias === 1 ? "" : "s"} restantes`
              : dias === 0
              ? "Arranca mañana"
              : `En ${dias} día${dias === 1 ? "" : "s"}`}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Vista: Lista ───────────────────────────────────────────────────────

function VistaLista({
  promos,
  onOpen,
  hoy,
}: {
  promos: Promocion[];
  onOpen: (id: string) => void;
  hoy: string;
}) {
  const ordenadas = [...promos].sort((a, b) => {
    const ea = estadoDePromocion(a.fecha_inicio, a.fecha_fin, a.activa, hoy);
    const eb = estadoDePromocion(b.fecha_inicio, b.fecha_fin, b.activa, hoy);
    const rank: Record<string, number> = { activa: 0, proxima: 1, pausada: 2, finalizada: 3 };
    if (rank[ea] !== rank[eb]) return rank[ea] - rank[eb];
    return a.fecha_inicio.localeCompare(b.fecha_inicio);
  });
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-500 text-left">
          <tr>
            <th className="p-3">Estado</th>
            <th className="p-3">Promoción</th>
            <th className="p-3">Banco / Tarjeta</th>
            <th className="p-3">Shopping</th>
            <th className="p-3">Marca</th>
            <th className="p-3">Vigencia</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((p) => {
            const estado = estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy);
            return (
              <tr key={p.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="p-3">
                  <span className={"text-[10px] px-2 py-0.5 rounded-full border " + ESTADO_COLOR[estado]}>
                    {ESTADO_LABEL[estado]}
                  </span>
                </td>
                <td className="p-3">
                  <div className="font-medium text-stone-800">{p.titulo}</div>
                  {(p.descuento_pct != null || p.cuotas != null) && (
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {p.descuento_pct != null && <>-{p.descuento_pct}% </>}
                      {p.cuotas != null && p.cuotas > 0 && <>· {p.cuotas} cuotas</>}
                    </div>
                  )}
                </td>
                <td className="p-3 text-stone-600">{p.bancos.join(", ") || "—"}</td>
                <td className="p-3 text-stone-600">{p.shoppings.join(", ") || "—"}</td>
                <td className="p-3 text-stone-600">{p.marcas.join(", ") || "—"}</td>
                <td className="p-3 text-stone-500 whitespace-nowrap">
                  {formatRango(p.fecha_inicio, p.fecha_fin)}
                </td>
                <td className="p-3">
                  <button onClick={() => onOpen(p.id)} className="text-xs text-brand-accent underline">
                    detalle
                  </button>
                </td>
              </tr>
            );
          })}
          {ordenadas.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-stone-400">
                Sin promociones para estos filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Vista: Calendario mensual ──────────────────────────────────────────

function VistaCalendario({
  promos,
  cursor,
  setCursor,
  onOpen,
  hoy,
}: {
  promos: Promocion[];
  cursor: { y: number; m: number };
  setCursor: (c: { y: number; m: number }) => void;
  onOpen: (id: string) => void;
  hoy: string;
}) {
  const primero = new Date(cursor.y, cursor.m, 1);
  const ultimo = new Date(cursor.y, cursor.m + 1, 0);
  const diaSemanaInicial = (primero.getDay() + 6) % 7; // lunes=0
  const totalDias = ultimo.getDate();

  // Construyo array de celdas: padding inicial + días
  const celdas: ({ iso: string; dia: number } | null)[] = [];
  for (let i = 0; i < diaSemanaInicial; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) {
    const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    celdas.push({ iso, dia: d });
  }
  while (celdas.length % 7 !== 0) celdas.push(null);

  const promosDeDia = (iso: string) =>
    promos.filter(
      (p) => p.fecha_inicio <= iso && iso <= p.fecha_fin && (p.activa || iso === hoy),
    );

  const prevMes = () => {
    const m = cursor.m - 1;
    if (m < 0) setCursor({ y: cursor.y - 1, m: 11 });
    else setCursor({ y: cursor.y, m });
  };
  const nextMes = () => {
    const m = cursor.m + 1;
    if (m > 11) setCursor({ y: cursor.y + 1, m: 0 });
    else setCursor({ y: cursor.y, m });
  };
  const irHoy = () => {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMes} className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100">
          ←
        </button>
        <div className="text-center">
          <h2 className="font-semibold text-stone-800">
            {MESES[cursor.m]} {cursor.y}
          </h2>
          <button onClick={irHoy} className="text-[11px] text-brand-accent underline">
            Volver a hoy
          </button>
        </div>
        <button onClick={nextMes} className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-stone-400 mb-1 font-medium">
        {DIAS.map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((c, i) => {
          if (!c) return <div key={i} className="h-20 sm:h-28 rounded-lg bg-stone-50/40" />;
          const lista = promosDeDia(c.iso);
          const esHoy = c.iso === hoy;
          return (
            <div
              key={c.iso}
              className={
                "h-20 sm:h-28 rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 overflow-hidden " +
                (esHoy ? "border-brand-accent bg-emerald-50/30" : "border-stone-100 bg-white")
              }
            >
              <div className={"text-[10px] font-medium " + (esHoy ? "text-brand-accent" : "text-stone-500")}>
                {c.dia}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {lista.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpen(p.id)}
                    className="text-[10px] sm:text-[11px] px-1 py-0.5 rounded text-white text-left truncate hover:opacity-90"
                    style={{ backgroundColor: colorParaPromocion(p) }}
                    title={p.titulo}
                  >
                    {p.titulo}
                  </button>
                ))}
                {lista.length > 3 && (
                  <span className="text-[9px] text-stone-400 px-1">+{lista.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal de detalle ───────────────────────────────────────────────────

function PromoModal({
  promo,
  onClose,
  hoy,
}: {
  promo: Promocion;
  onClose: () => void;
  hoy: string;
}) {
  const estado = estadoDePromocion(promo.fecha_inicio, promo.fecha_fin, promo.activa, hoy);
  const color = colorParaPromocion(promo);
  return (
    <div
      className="fixed inset-0 bg-stone-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2" style={{ backgroundColor: color }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-stone-800 leading-snug flex-1">
              {promo.titulo}
            </h2>
            <span className={"text-xs px-2 py-1 rounded-full border " + ESTADO_COLOR[estado]}>
              {ESTADO_LABEL[estado]}
            </span>
          </div>

          {(promo.descuento_pct != null || promo.cuotas != null) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {promo.descuento_pct != null && (
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  -{promo.descuento_pct}% de descuento
                </span>
              )}
              {promo.cuotas != null && promo.cuotas > 0 && (
                <span className="text-sm font-medium text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
                  {promo.cuotas} cuotas sin interés
                </span>
              )}
              {promo.tope != null && (
                <span className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
                  Tope: {Number(promo.tope).toLocaleString("es-PY")} {promo.moneda || ""}
                </span>
              )}
            </div>
          )}

          {promo.descripcion && (
            <p className="text-sm text-stone-600 mt-4 whitespace-pre-line">{promo.descripcion}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <Bloque title="Vigencia">{formatRango(promo.fecha_inicio, promo.fecha_fin)}</Bloque>
            <Bloque title="Bancos / Tarjetas">{promo.bancos.join(", ") || "—"}</Bloque>
            <Bloque title="Shoppings / Cadenas">{promo.shoppings.join(", ") || "—"}</Bloque>
            <Bloque title="Marcas">{promo.marcas.join(", ") || "—"}</Bloque>
            <Bloque title="Tiendas" className="sm:col-span-2">
              {promo.tiendas.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {promo.tiendas.map((t) => (
                    <li key={t} className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                "Todas las tiendas"
              )}
            </Bloque>
            {promo.notas && (
              <Bloque title="Notas" className="sm:col-span-2">
                <p className="whitespace-pre-line text-stone-600">{promo.notas}</p>
              </Bloque>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-brand text-white font-semibold rounded-xl py-2.5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Bloque({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">{title}</div>
      <div className="text-sm text-stone-700 mt-0.5">{children}</div>
    </div>
  );
}
