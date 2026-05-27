import { NextResponse } from "next/server";
import { fetchPromociones, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET público: lista visible (activas, no vencidas hace más de 30 días).
// No requiere autenticación — las tiendas abren este endpoint via /promociones.
//
// Es deliberadamente tolerante: si la tabla todavía no existe o Supabase no
// está configurado, devuelve lista vacía con un flag `setupNeeded` para que
// el UI lo informe sin romper la página.
export async function GET() {
  if (!supabaseConfigured()) {
    return NextResponse.json({ promociones: [], setupNeeded: true });
  }
  try {
    const promociones = await fetchPromociones({ onlyVisibles: true });
    return NextResponse.json({ promociones });
  } catch (e: any) {
    // Cualquier error (tabla faltante, network, config) se trata como setupNeeded
    // para que la vista pública nunca rompa.
    const msg = String(e?.message || "");
    return NextResponse.json({ promociones: [], setupNeeded: true, debug: msg });
  }
}
