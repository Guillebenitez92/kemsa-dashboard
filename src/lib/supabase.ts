// Acceso a Supabase SOLO desde el servidor, usando la service role key.
// El navegador nunca recibe credenciales: por eso aunque reenvíen el enlace,
// nadie puede leer las respuestas de los demás ni el consolidado.

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(URL && SERVICE_KEY);
}

function headers() {
  return {
    apikey: SERVICE_KEY as string,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

export type StoredResponse = {
  id: string;
  created_at: string;
  name: string | null;
  gender: string;
  age_range: string;
  train_frequency: string;
  buys_where: string | null;
  comment: string | null;
  selections: { code: string; size: string; favImg?: string | null }[];
};

export async function insertResponse(payload: {
  name: string | null;
  gender: string;
  age_range: string;
  train_frequency: string;
  buys_where: string | null;
  comment: string | null;
  selections: { code: string; size: string; favImg?: string | null }[];
}): Promise<void> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(`${URL}/rest/v1/survey_responses`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al guardar (${res.status}): ${text}`);
  }
}

export type PedidoItem = {
  code: string;
  name: string;
  color: string;
  colorCode: string;
  size: string | null; // talle (Jiu-Jitsu); null en productos por curva
  curvas: number;
  unidades: number;
  mayoristaUnit: number;
};
export type Pedido = {
  empresa: string;
  contacto: string;
  phone: string | null;
  comment: string | null;
  total_curvas: number;
  total_unidades: number;
  total_usd: number;
  items: PedidoItem[];
};
export type StoredPedido = Pedido & { id: string; created_at: string };

export async function insertPedido(payload: Pedido): Promise<void> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(`${URL}/rest/v1/pedidos`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al guardar el pedido (${res.status}): ${text}`);
  }
}

export async function fetchPedidos(): Promise<StoredPedido[]> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(
    `${URL}/rest/v1/pedidos?select=*&order=created_at.desc`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al leer pedidos (${res.status}): ${text}`);
  }
  return (await res.json()) as StoredPedido[];
}

// ── Promociones ────────────────────────────────────────────────────────
export type Promocion = {
  id: string;
  created_at: string;
  updated_at: string;
  titulo: string;
  descripcion: string | null;
  bancos: string[];
  shoppings: string[];
  tiendas: string[];
  marcas: string[];
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
  descuento_pct: number | null;
  cuotas: number | null;
  tope: number | null;
  moneda: string | null;
  notas: string | null;
  activa: boolean;
  color: string | null;
  created_by: string | null;
};

export type PromocionInput = Omit<Promocion, "id" | "created_at" | "updated_at">;

export async function fetchPromociones(opts?: { onlyVisibles?: boolean }): Promise<Promocion[]> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  // Pública: solo activas y no finalizadas hace más de 30 días.
  const params = new URLSearchParams({
    select: "*",
    order: "fecha_inicio.asc",
  });
  if (opts?.onlyVisibles) {
    // ocultar pausadas, y ocultar las que terminaron hace >30 días
    params.append("activa", "eq.true");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const iso = cutoff.toISOString().slice(0, 10);
    params.append("fecha_fin", `gte.${iso}`);
  }
  const res = await fetch(`${URL}/rest/v1/promociones?${params.toString()}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al leer promociones (${res.status}): ${text}`);
  }
  return (await res.json()) as Promocion[];
}

export async function insertPromocion(payload: PromocionInput): Promise<Promocion> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(`${URL}/rest/v1/promociones`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al guardar promoción (${res.status}): ${text}`);
  }
  const arr = (await res.json()) as Promocion[];
  return arr[0];
}

export async function updatePromocion(id: string, patch: Partial<PromocionInput>): Promise<Promocion> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const body = { ...patch, updated_at: new Date().toISOString() };
  const res = await fetch(`${URL}/rest/v1/promociones?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al actualizar promoción (${res.status}): ${text}`);
  }
  const arr = (await res.json()) as Promocion[];
  if (!arr[0]) throw new Error("Promoción no encontrada.");
  return arr[0];
}

export async function deletePromocion(id: string): Promise<void> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(`${URL}/rest/v1/promociones?id=eq.${id}`, {
    method: "DELETE",
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al borrar promoción (${res.status}): ${text}`);
  }
}

export async function fetchResponses(): Promise<StoredResponse[]> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase no está configurado (faltan variables de entorno).");
  }
  const res = await fetch(
    `${URL}/rest/v1/survey_responses?select=*&order=created_at.desc`,
    { headers: headers(), cache: "no-store" },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al leer respuestas (${res.status}): ${text}`);
  }
  return (await res.json()) as StoredResponse[];
}
