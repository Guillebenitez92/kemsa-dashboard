"use client";

import { useCallback, useEffect, useState } from "react";

type Ranking = {
  code: string;
  name: string;
  category: string;
  gender: string;
  cost: number;
  retail: number;
  count: number;
  pct: number;
  sizes: Record<string, number>;
  favs: Record<string, number>;
};

function FavThumbs({ favs }: { favs: Record<string, number> }) {
  const top = Object.entries(favs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (top.length === 0) return <span className="text-stone-300">—</span>;
  return (
    <div className="flex gap-1.5">
      {top.map(([id, n]) => (
        <div key={id} className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://drive.google.com/thumbnail?id=${id}&sz=w120`}
            alt="fav"
            className="h-12 w-12 object-cover rounded border border-stone-200 bg-stone-100"
          />
          <span className="text-[10px] text-stone-500">{n}</span>
        </div>
      ))}
    </div>
  );
}

type Data = {
  total: number;
  totalSelections: number;
  avgPerPerson: number;
  ranking: Ranking[];
  demographics: {
    gender: Record<string, number>;
    age: Record<string, number>;
    frequency: Record<string, number>;
  };
  recent: {
    created_at: string;
    name: string | null;
    gender: string;
    age_range: string;
    train_frequency: string;
    buys_where: string | null;
    comment: string | null;
    count: number;
  }[];
};

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [fGender, setFGender] = useState("");
  const [fAge, setFAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    const qs = new URLSearchParams();
    if (fGender) qs.set("gender", fGender);
    if (fAge) qs.set("age", fAge);
    const res = await fetch(`/api/admin/data?${qs.toString()}`, { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const d = await res.json();
    if (!res.ok) {
      setErr(d?.error || "Error al cargar.");
      setLoading(false);
      return;
    }
    setAuthed(true);
    setData(d);
    setLoading(false);
  }, [fGender, fAge]);

  useEffect(() => {
    load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await res.json();
    if (!res.ok) {
      setLoginErr(d?.error || "Error.");
      return;
    }
    setPassword("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setData(null);
  }

  if (authed === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400">Cargando...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={login} className="bg-white rounded-2xl shadow p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-brand">Panel privado</h1>
          <p className="text-sm text-stone-500 mt-1">
            Acceso solo para administración.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="mt-4 w-full border border-stone-300 rounded-xl px-3 py-2.5"
            autoFocus
          />
          {loginErr && <p className="text-red-600 text-sm mt-2">{loginErr}</p>}
          <button className="mt-4 w-full bg-brand text-white font-semibold rounded-xl py-2.5">
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Consolidado de la encuesta</h1>
          <p className="text-sm text-stone-500">
            Qué productos coinciden más entre las personas que respondieron.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/pedidos"
            className="text-sm bg-brand text-white rounded-lg px-4 py-2 font-medium"
          >
            Pedidos mayoristas →
          </a>
          <a
            href="/admin/muestras"
            className="text-sm bg-stone-900 text-white rounded-lg px-4 py-2 font-medium"
          >
            Muestras KMNO →
          </a>
          <a
            href="/api/admin/export"
            className="text-sm bg-brand-accent text-white rounded-lg px-4 py-2 font-medium"
          >
            Descargar CSV
          </a>
          <button
            onClick={logout}
            className="text-sm bg-stone-200 text-stone-700 rounded-lg px-4 py-2"
          >
            Salir
          </button>
        </div>
      </div>

      {err && <p className="text-red-600 mt-4">{err}</p>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <Kpi label="Personas que respondieron" value={data.total} />
            <Kpi label="Total de marcas de interés" value={data.totalSelections} />
            <Kpi label="Promedio por persona" value={data.avgPerPerson} />
          </div>

          <div className="bg-white rounded-2xl shadow p-4 mt-5 flex flex-wrap gap-4">
            <FilterSel
              label="Filtrar por género"
              value={fGender}
              onChange={setFGender}
              opts={["Femenino", "Masculino", "Otro", "Prefiero no decir"]}
            />
            <FilterSel
              label="Filtrar por edad"
              value={fAge}
              onChange={setFAge}
              opts={["Menos de 18", "18-24", "25-34", "35-44", "45-54", "55+"]}
            />
            {loading && <span className="text-sm text-stone-400 self-end">Actualizando...</span>}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-5">
            <DemoCard title="Género" map={data.demographics.gender} />
            <DemoCard title="Edad" map={data.demographics.age} />
            <DemoCard title="Frecuencia de entreno" map={data.demographics.frequency} />
          </div>

          <h2 className="text-lg font-bold text-brand mt-7 mb-2">
            Ranking de productos más deseados
          </h2>
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-left">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-right">Interesados</th>
                  <th className="p-3 text-right">%</th>
                  <th className="p-3">Talles pedidos</th>
                  <th className="p-3">Color/foto preferida</th>
                  <th className="p-3 text-right">Costo</th>
                  <th className="p-3 text-right">Retail</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking
                  .filter((r) => r.count > 0)
                  .map((r, i) => (
                    <tr key={r.code} className="border-t border-stone-100">
                      <td className="p-3 text-stone-400">{i + 1}</td>
                      <td className="p-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-[11px] text-stone-400">
                          #{r.code} · {r.gender}
                        </div>
                      </td>
                      <td className="p-3 text-stone-500">{r.category}</td>
                      <td className="p-3 text-right font-bold text-brand">{r.count}</td>
                      <td className="p-3 text-right">{r.pct}%</td>
                      <td className="p-3 text-xs text-stone-500">
                        {Object.entries(r.sizes)
                          .sort((a, b) => b[1] - a[1])
                          .map(([s, n]) => `${s}:${n}`)
                          .join("  ") || "—"}
                      </td>
                      <td className="p-3">
                        <FavThumbs favs={r.favs} />
                      </td>
                      <td className="p-3 text-right text-stone-500">
                        US$ {r.cost.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        US$ {r.retail.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                {data.ranking.filter((r) => r.count > 0).length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-stone-400">
                      Todavía no hay respuestas con este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-brand mt-7 mb-2">
            Últimas respuestas
          </h2>
          <div className="bg-white rounded-2xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500 text-left">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Género</th>
                  <th className="p-3">Edad</th>
                  <th className="p-3">Frecuencia</th>
                  <th className="p-3">Compra en</th>
                  <th className="p-3 text-right">Ítems</th>
                  <th className="p-3">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="p-3 text-stone-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("es-PY")}
                    </td>
                    <td className="p-3">{r.name || "—"}</td>
                    <td className="p-3">{r.gender}</td>
                    <td className="p-3">{r.age_range}</td>
                    <td className="p-3">{r.train_frequency}</td>
                    <td className="p-3 text-stone-500">{r.buys_where || "—"}</td>
                    <td className="p-3 text-right font-medium">{r.count}</td>
                    <td className="p-3 text-stone-500 max-w-[220px] truncate">
                      {r.comment || "—"}
                    </td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      Sin respuestas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-3xl font-bold text-brand">{value}</div>
      <div className="text-xs text-stone-500 mt-1">{label}</div>
    </div>
  );
}

function DemoCard({ title, map }: { title: string; map: Record<string, number> }) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-semibold text-stone-700 mb-3">{title}</h3>
      {entries.length === 0 && <p className="text-sm text-stone-400">Sin datos</p>}
      {entries.map(([k, v]) => (
        <div key={k} className="mb-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>{k}</span>
            <span>{v}</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full mt-1">
            <div
              className="h-2 bg-brand-accent rounded-full"
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSel({
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
    <label className="text-sm">
      <span className="block text-stone-500 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-stone-300 rounded-lg px-3 py-2"
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
