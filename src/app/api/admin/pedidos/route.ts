import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import { fetchPedidos, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const MARKUP = 2.3; // mayorista = FOB × 2.3

export async function GET() {
  if (!isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado en el servidor." },
      { status: 500 },
    );
  }

  let pedidos;
  try {
    pedidos = await fetchPedidos();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error al leer pedidos." }, { status: 500 });
  }

  const rows = pedidos.map((p) => {
    const totalFob =
      Math.round(
        (p.items || []).reduce(
          (s, it) => s + (it.mayoristaUnit / MARKUP) * it.unidades,
          0,
        ) * 100,
      ) / 100;
    return { ...p, total_fob: totalFob };
  });

  return NextResponse.json({
    count: rows.length,
    totalCurvas: rows.reduce((s, p) => s + (p.total_curvas || 0), 0),
    totalUsd: Math.round(rows.reduce((s, p) => s + Number(p.total_usd || 0), 0) * 100) / 100,
    totalFob: Math.round(rows.reduce((s, p) => s + p.total_fob, 0) * 100) / 100,
    pedidos: rows,
  });
}
