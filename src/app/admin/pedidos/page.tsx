"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

type Item = {
  code: string; name: string; color: string; colorCode: string;
  size?: string | null;
  curvas: number; unidades: number; mayoristaUnit: number;
};
type Pedido = {
  id: string; created_at: string; empresa: string; contacto: string;
  phone: string | null; comment: string | null;
  total_curvas: number; total_unidades: number;
  total_usd: number; total_fob: number; items: Item[];
};
type Data = {
  count: number; totalCurvas: number; totalUsd: number; totalFob: number;
  pedidos: Pedido[];
};

const usd = (n: number) => "US$ " + Number(n).toLocaleString("es-PY", { maximumFractionDigits: 2 });

export default function AdminPedidos() {
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<"loading" | "unauth" | "error" | "ok">("loading");
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    const res = await fetch("/api/admin/pedidos", { cache: "no-store" });
    if (res.status === 401) { setState("unauth"); return; }
    const d = await res.json();
    if (!res.ok) { setErr(d?.error || "Error."); setState("error"); return; }
    setData(d);
    setState("ok");
  }, []);

  useEffect(() => { load(); }, [load]);

  if (state === "loading")
    return <main className="min-h-screen flex items-center justify-center text-stone-400">Cargando…</main>;

  if (state === "unauth")
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
          <h1 className="text-xl font-bold text-brand">Pedidos mayoristas</h1>
          <p className="text-sm text-stone-500 mt-2">
            Iniciá sesión en el panel para ver los pedidos.
          </p>
          <a href="/admin" className="mt-4 inline-block bg-brand text-white font-semibold rounded-xl px-5 py-2.5">
            Ir a iniciar sesión
          </a>
        </div>
      </main>
    );

  if (state === "error")
    return <main className="min-h-screen flex items-center justify-center p-6 text-red-600">{err}</main>;

  return (
    <main className="min-h-screen p-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Pedidos mayoristas</h1>
          <p className="text-sm text-stone-500">Pedidos de locales/tiendas desde el catálogo.</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin" className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2">← Admin</a>
          <a href="/admin/muestras" className="text-sm bg-stone-900 text-white rounded-lg px-4 py-2 font-medium">Muestras KMNO →</a>
          <button onClick={load} className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2">Actualizar</button>
          <a href="/api/admin/export-pedidos"
            className="text-sm bg-brand-accent text-white rounded-lg px-4 py-2 font-medium">
            Descargar CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <Kpi label="Pedidos" value={String(data!.count)} />
        <Kpi label="Curvas totales" value={String(data!.totalCurvas)} />
        <Kpi label="Total mayorista" value={usd(data!.totalUsd)} />
        <Kpi label="Total FOB" value={usd(data!.totalFob)} />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto mt-6">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Empresa / Local</th>
              <th className="p-3">Contacto</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3 text-right">Curvas</th>
              <th className="p-3 text-right">Unidades</th>
              <th className="p-3 text-right">Mayorista</th>
              <th className="p-3 text-right">FOB</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data!.pedidos.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-t border-stone-100">
                  <td className="p-3 text-stone-500 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString("es-PY")}
                  </td>
                  <td className="p-3 font-medium">{p.empresa}</td>
                  <td className="p-3">{p.contacto}</td>
                  <td className="p-3 text-stone-500">{p.phone || "—"}</td>
                  <td className="p-3 text-right font-bold text-brand">{p.total_curvas}</td>
                  <td className="p-3 text-right">{p.total_unidades}</td>
                  <td className="p-3 text-right font-medium">{usd(p.total_usd)}</td>
                  <td className="p-3 text-right text-stone-500">{usd(p.total_fob)}</td>
                  <td className="p-3">
                    <button onClick={() => setOpenId(openId === p.id ? null : p.id)}
                      className="text-xs text-brand-accent underline">
                      {openId === p.id ? "ocultar" : "ver ítems"}
                    </button>
                  </td>
                </tr>
                {openId === p.id && (
                  <tr className="border-t border-stone-100 bg-stone-50">
                    <td colSpan={9} className="p-3">
                      {p.comment && (
                        <p className="text-xs text-stone-500 mb-2">Comentario: {p.comment}</p>
                      )}
                      <table className="w-full text-xs">
                        <thead className="text-stone-400 text-left">
                          <tr><th className="py-1">Código</th><th>Producto</th><th>Color / Talle</th>
                            <th className="text-right">Curvas</th><th className="text-right">Unid.</th>
                            <th className="text-right">Mayorista u.</th><th className="text-right">FOB u.</th></tr>
                        </thead>
                        <tbody>
                          {p.items.map((it, i) => (
                            <tr key={i} className="border-t border-stone-200">
                              <td className="py-1 font-mono">{it.code}</td>
                              <td>{it.name}</td>
                              <td>
                                {it.color}{it.colorCode && it.colorCode !== "-" ? ` (${it.colorCode})` : ""}
                                {it.size ? ` · talle ${it.size}` : ""}
                              </td>
                              <td className="text-right">{it.curvas || "—"}</td>
                              <td className="text-right">{it.unidades}</td>
                              <td className="text-right">{usd(it.mayoristaUnit)}</td>
                              <td className="text-right text-stone-500">{usd(it.mayoristaUnit / 2.3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {data!.pedidos.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-stone-400">Todavía no hay pedidos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-stone-500 mt-1">{label}</div>
    </div>
  );
}
