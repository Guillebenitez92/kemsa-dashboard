"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Promocion } from "@/lib/supabase";
import {
  BANCOS_PY,
  CADENAS,
  COLOR_PALETTE,
  ESTADO_COLOR,
  ESTADO_LABEL,
  estadoDePromocion,
  formatRango,
  MARCAS_KEMSA,
  SHOPPINGS_PY,
  TARJETAS,
} from "@/lib/promociones-catalog";

type EstadoUI = "loading" | "unauth" | "error" | "ok";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): DraftPromocion {
  const hoy = todayISO();
  return {
    id: null,
    titulo: "",
    descripcion: "",
    bancos: [],
    shoppings: [],
    tiendas: [],
    marcas: [],
    fecha_inicio: hoy,
    fecha_fin: hoy,
    descuento_pct: "",
    cuotas: "",
    tope: "",
    moneda: "PYG",
    notas: "",
    activa: true,
    color: "",
  };
}

type DraftPromocion = {
  id: string | null;
  titulo: string;
  descripcion: string;
  bancos: string[];
  shoppings: string[];
  tiendas: string[];
  marcas: string[];
  fecha_inicio: string;
  fecha_fin: string;
  descuento_pct: string;
  cuotas: string;
  tope: string;
  moneda: string;
  notas: string;
  activa: boolean;
  color: string;
};

export default function AdminPromocionesPage() {
  const [data, setData] = useState<Promocion[] | null>(null);
  const [state, setState] = useState<EstadoUI>("loading");
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState<DraftPromocion | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("");

  const cargar = useCallback(async () => {
    setState("loading");
    setErr("");
    const res = await fetch("/api/admin/promociones", { cache: "no-store" });
    if (res.status === 401) {
      setState("unauth");
      return;
    }
    const d = await res.json();
    if (!res.ok) {
      setErr(d?.error || "Error.");
      setState("error");
      return;
    }
    setData(d.promociones || []);
    setState("ok");
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const hoy = todayISO();

  const filtradas = useMemo(() => {
    const all = data || [];
    if (!filtroEstado) return all;
    return all.filter(
      (p) => estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy) === filtroEstado,
    );
  }, [data, filtroEstado, hoy]);

  const conteoEstado = useMemo(() => {
    const c = { activa: 0, proxima: 0, finalizada: 0, pausada: 0 };
    (data || []).forEach((p) => {
      const e = estadoDePromocion(p.fecha_inicio, p.fecha_fin, p.activa, hoy);
      c[e]++;
    });
    return c;
  }, [data, hoy]);

  async function guardar() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    const payload = {
      titulo: draft.titulo.trim(),
      descripcion: draft.descripcion || null,
      bancos: draft.bancos,
      shoppings: draft.shoppings,
      tiendas: draft.tiendas,
      marcas: draft.marcas,
      fecha_inicio: draft.fecha_inicio,
      fecha_fin: draft.fecha_fin,
      descuento_pct: draft.descuento_pct === "" ? null : Number(draft.descuento_pct),
      cuotas: draft.cuotas === "" ? null : Number(draft.cuotas),
      tope: draft.tope === "" ? null : Number(draft.tope),
      moneda: draft.moneda || "PYG",
      notas: draft.notas || null,
      activa: draft.activa,
      color: draft.color || null,
    };
    const url = draft.id ? `/api/admin/promociones/${draft.id}` : "/api/admin/promociones";
    const method = draft.id ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(d?.error || "Error al guardar.");
      return;
    }
    setDraft(null);
    cargar();
  }

  async function togglePausa(p: Promocion) {
    setBusy(true);
    await fetch(`/api/admin/promociones/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !p.activa }),
    });
    setBusy(false);
    cargar();
  }

  async function eliminar(p: Promocion) {
    if (!confirm(`¿Eliminar la promoción "${p.titulo}"? Esto no se puede deshacer.`)) return;
    setBusy(true);
    await fetch(`/api/admin/promociones/${p.id}`, { method: "DELETE" });
    setBusy(false);
    cargar();
  }

  function duplicar(p: Promocion) {
    setDraft({
      id: null,
      titulo: p.titulo + " (copia)",
      descripcion: p.descripcion || "",
      bancos: [...p.bancos],
      shoppings: [...p.shoppings],
      tiendas: [...p.tiendas],
      marcas: [...p.marcas],
      fecha_inicio: hoy,
      fecha_fin: hoy,
      descuento_pct: p.descuento_pct?.toString() ?? "",
      cuotas: p.cuotas?.toString() ?? "",
      tope: p.tope?.toString() ?? "",
      moneda: p.moneda || "PYG",
      notas: p.notas || "",
      activa: true,
      color: p.color || "",
    });
  }

  function editar(p: Promocion) {
    setDraft({
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion || "",
      bancos: [...p.bancos],
      shoppings: [...p.shoppings],
      tiendas: [...p.tiendas],
      marcas: [...p.marcas],
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      descuento_pct: p.descuento_pct?.toString() ?? "",
      cuotas: p.cuotas?.toString() ?? "",
      tope: p.tope?.toString() ?? "",
      moneda: p.moneda || "PYG",
      notas: p.notas || "",
      activa: p.activa,
      color: p.color || "",
    });
  }

  if (state === "loading") {
    return <main className="min-h-screen flex items-center justify-center text-stone-400">Cargando…</main>;
  }
  if (state === "unauth") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-brand">Promociones — Admin</h1>
          <p className="text-sm text-stone-500 mt-2">Iniciá sesión para gestionar promociones.</p>
          <a href="/admin" className="mt-4 inline-block bg-brand text-white font-semibold rounded-xl px-5 py-2.5">
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );
  }
  if (state === "error") {
    return <main className="min-h-screen flex items-center justify-center p-6 text-red-600">{err}</main>;
  }

  return (
    <main className="min-h-screen bg-stone-50 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand">Promociones</h1>
            <p className="text-sm text-stone-500">
              Agenda compartida — las tiendas la ven en{" "}
              <a href="/promociones" className="text-brand-accent underline">/promociones</a>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/admin" className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2">← Admin</a>
            <a
              href="/promociones"
              target="_blank"
              rel="noreferrer"
              className="text-sm bg-stone-900 text-white rounded-lg px-4 py-2 font-medium"
            >
              Ver vista pública →
            </a>
            <button
              onClick={() => setDraft(emptyDraft())}
              className="text-sm bg-brand-accent text-white rounded-lg px-4 py-2 font-semibold"
            >
              + Nueva promoción
            </button>
          </div>
        </div>

        {err && <p className="text-red-600 mt-3">{err}</p>}

        {/* KPIs por estado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <KpiBtn
            label="Vigentes"
            value={conteoEstado.activa}
            active={filtroEstado === "activa"}
            onClick={() => setFiltroEstado(filtroEstado === "activa" ? "" : "activa")}
            tone="emerald"
          />
          <KpiBtn
            label="Próximas"
            value={conteoEstado.proxima}
            active={filtroEstado === "proxima"}
            onClick={() => setFiltroEstado(filtroEstado === "proxima" ? "" : "proxima")}
            tone="amber"
          />
          <KpiBtn
            label="Pausadas"
            value={conteoEstado.pausada}
            active={filtroEstado === "pausada"}
            onClick={() => setFiltroEstado(filtroEstado === "pausada" ? "" : "pausada")}
            tone="rose"
          />
          <KpiBtn
            label="Finalizadas"
            value={conteoEstado.finalizada}
            active={filtroEstado === "finalizada"}
            onClick={() => setFiltroEstado(filtroEstado === "finalizada" ? "" : "finalizada")}
            tone="stone"
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto mt-5">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-left">
              <tr>
                <th className="p-3">Estado</th>
                <th className="p-3">Promoción</th>
                <th className="p-3">Banco</th>
                <th className="p-3">Shopping</th>
                <th className="p-3">Marca</th>
                <th className="p-3">Vigencia</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => {
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
                    <td className="p-3 text-stone-600 max-w-[160px]">{p.bancos.join(", ") || "—"}</td>
                    <td className="p-3 text-stone-600 max-w-[160px]">{p.shoppings.join(", ") || "—"}</td>
                    <td className="p-3 text-stone-600 max-w-[140px]">{p.marcas.join(", ") || "—"}</td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {formatRango(p.fecha_inicio, p.fecha_fin)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => editar(p)}
                        className="text-xs text-brand-accent underline mr-2"
                        disabled={busy}
                      >
                        editar
                      </button>
                      <button
                        onClick={() => duplicar(p)}
                        className="text-xs text-stone-500 underline mr-2"
                        disabled={busy}
                      >
                        duplicar
                      </button>
                      <button
                        onClick={() => togglePausa(p)}
                        className="text-xs text-amber-700 underline mr-2"
                        disabled={busy}
                      >
                        {p.activa ? "pausar" : "reactivar"}
                      </button>
                      <button
                        onClick={() => eliminar(p)}
                        className="text-xs text-red-600 underline"
                        disabled={busy}
                      >
                        eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-stone-400">
                    {data?.length === 0
                      ? 'Todavía no hay promociones. Tocá "+ Nueva promoción" para empezar.'
                      : "Sin promociones para este filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <FormModal
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setDraft(null)}
          onSave={guardar}
          busy={busy}
        />
      )}
    </main>
  );
}

function KpiBtn({
  label,
  value,
  active,
  onClick,
  tone,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  tone: "emerald" | "amber" | "rose" | "stone";
}) {
  const toneCls: Record<typeof tone, string> = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
    stone: "text-stone-600",
  };
  return (
    <button
      onClick={onClick}
      className={
        "bg-white rounded-2xl shadow-sm p-4 text-left transition border-2 " +
        (active ? "border-brand" : "border-transparent hover:border-stone-200")
      }
    >
      <div className={"text-3xl font-bold " + toneCls[tone]}>{value}</div>
      <div className="text-xs text-stone-500 mt-1">{label}</div>
    </button>
  );
}

// ── Form modal: crear / editar ────────────────────────────────────────

function FormModal({
  draft,
  setDraft,
  onCancel,
  onSave,
  busy,
}: {
  draft: DraftPromocion;
  setDraft: (d: DraftPromocion) => void;
  onCancel: () => void;
  onSave: () => void;
  busy: boolean;
}) {
  function patch<K extends keyof DraftPromocion>(key: K, value: DraftPromocion[K]) {
    setDraft({ ...draft, [key]: value });
  }
  const isEdit = !!draft.id;

  const bancosOpts = uniqueMerge(BANCOS_PY, TARJETAS);
  const shoppingsOpts = uniqueMerge(SHOPPINGS_PY, CADENAS);

  const puedeGuardar = draft.titulo.trim() && draft.fecha_inicio && draft.fecha_fin;

  return (
    <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl my-0 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand">
            {isEdit ? "Editar promoción" : "Nueva promoción"}
          </h2>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <Field label="Título *">
            <input
              type="text"
              value={draft.titulo}
              onChange={(e) => patch("titulo", e.target.value)}
              placeholder='Ej. "30% off + 3 cuotas sin interés con Itaú"'
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={draft.descripcion}
              onChange={(e) => patch("descripcion", e.target.value)}
              rows={2}
              placeholder="Detalle adicional que las tiendas deberían saber"
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio *">
              <input
                type="date"
                value={draft.fecha_inicio}
                onChange={(e) => patch("fecha_inicio", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
              />
            </Field>
            <Field label="Fecha fin *">
              <input
                type="date"
                value={draft.fecha_fin}
                onChange={(e) => patch("fecha_fin", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="% Descuento">
              <input
                type="number"
                value={draft.descuento_pct}
                onChange={(e) => patch("descuento_pct", e.target.value)}
                step="0.1"
                min="0"
                max="100"
                placeholder="30"
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
              />
            </Field>
            <Field label="Cuotas s/int">
              <input
                type="number"
                value={draft.cuotas}
                onChange={(e) => patch("cuotas", e.target.value)}
                min="0"
                placeholder="3"
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
              />
            </Field>
            <Field label="Tope">
              <input
                type="number"
                value={draft.tope}
                onChange={(e) => patch("tope", e.target.value)}
                min="0"
                placeholder="500000"
                className="w-full border border-stone-300 rounded-lg px-3 py-2"
              />
            </Field>
          </div>

          <ChipMultiInput
            label="Bancos / Tarjetas"
            placeholder="Ej. Itaú, Visa…"
            values={draft.bancos}
            onChange={(v) => patch("bancos", v)}
            sugerencias={bancosOpts}
          />

          <ChipMultiInput
            label="Shoppings / Cadenas"
            placeholder="Ej. Shopping del Sol…"
            values={draft.shoppings}
            onChange={(v) => patch("shoppings", v)}
            sugerencias={shoppingsOpts}
          />

          <ChipMultiInput
            label="Marcas"
            placeholder="Ej. American Look…"
            values={draft.marcas}
            onChange={(v) => patch("marcas", v)}
            sugerencias={MARCAS_KEMSA}
          />

          <ChipMultiInput
            label="Tiendas específicas (opcional)"
            placeholder="Si aplica solo a algunas, escribilas. Si no, dejá vacío."
            values={draft.tiendas}
            onChange={(v) => patch("tiendas", v)}
            sugerencias={[]}
          />

          <Field label="Color en el calendario">
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => patch("color", c)}
                  className={
                    "w-8 h-8 rounded-full border-2 " +
                    (draft.color === c ? "border-stone-900" : "border-white shadow")
                  }
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <button
                type="button"
                onClick={() => patch("color", "")}
                className={
                  "px-2 py-1 text-xs rounded-lg border " +
                  (!draft.color ? "border-stone-900 bg-stone-100" : "border-stone-200")
                }
              >
                Auto
              </button>
            </div>
          </Field>

          <Field label="Notas internas">
            <textarea
              value={draft.notas}
              onChange={(e) => patch("notas", e.target.value)}
              rows={2}
              placeholder="Ej. 'Excluye outlet', 'Aplica solo sábados'…"
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={draft.activa}
              onChange={(e) => patch("activa", e.target.checked)}
            />
            Promoción activa (si desactivás, no se muestra en la vista pública)
          </label>
        </div>

        <div className="p-5 sm:p-6 border-t border-stone-100 flex gap-2 justify-end sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-stone-600 rounded-lg"
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!puedeGuardar || busy}
            className="px-5 py-2 bg-brand-accent text-white font-semibold rounded-lg disabled:opacity-40"
          >
            {busy ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear promoción"}
          </button>
        </div>
      </div>
    </div>
  );
}

function uniqueMerge(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b])).sort((x, y) => x.localeCompare(y, "es"));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

// ── Multi-input con chips + sugerencias ──────────────────────────────

function ChipMultiInput({
  label,
  placeholder,
  values,
  onChange,
  sugerencias,
}: {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (v: string[]) => void;
  sugerencias: string[];
}) {
  const [text, setText] = useState("");

  function add(v: string) {
    const clean = v.trim();
    if (!clean) return;
    if (values.includes(clean)) return;
    onChange([...values, clean]);
    setText("");
  }
  function remove(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  const filtradas = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return sugerencias.filter((s) => !values.includes(s)).slice(0, 6);
    return sugerencias
      .filter((s) => s.toLowerCase().includes(q) && !values.includes(s))
      .slice(0, 6);
  }, [text, sugerencias, values]);

  return (
    <Field label={label}>
      <div className="border border-stone-300 rounded-lg px-2 py-1.5 bg-white">
        <div className="flex flex-wrap gap-1.5 items-center">
          {values.map((v) => (
            <span
              key={v}
              className="bg-brand text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="text-emerald-200 hover:text-white"
                aria-label="quitar"
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(text);
              } else if (e.key === "Backspace" && !text && values.length > 0) {
                remove(values[values.length - 1]);
              }
            }}
            placeholder={values.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] px-1 py-1 text-sm outline-none"
          />
        </div>
        {filtradas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pb-1">
            {filtradas.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => add(s)}
                className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}
