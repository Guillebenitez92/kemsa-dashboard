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
