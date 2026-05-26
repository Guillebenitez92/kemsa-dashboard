import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import {
  fetchPromociones,
  insertPromocion,
  supabaseConfigured,
  type PromocionInput,
} from "@/lib/supabase";

export const runtime = "nodejs";

function unauth() {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}

function gate(): boolean {
  return isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value);
}

// GET admin: TODAS las promociones (incluyendo pausadas y vencidas).
export async function GET() {
  if (!gate()) return unauth();
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 500 });
  }
  try {
    const promociones = await fetchPromociones();
    return NextResponse.json({ promociones });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}

// POST admin: crear nueva promoción.
export async function POST(req: NextRequest) {
  if (!gate()) return unauth();
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 500 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const titulo = String(body?.titulo || "").trim();
  const fecha_inicio = String(body?.fecha_inicio || "").trim();
  const fecha_fin = String(body?.fecha_fin || "").trim();
  if (!titulo) return NextResponse.json({ error: "Falta el título." }, { status: 400 });
  if (!fecha_inicio || !fecha_fin) {
    return NextResponse.json({ error: "Faltan fechas." }, { status: 400 });
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json(
      { error: "La fecha fin no puede ser anterior a la fecha inicio." },
      { status: 400 },
    );
  }

  const payload: PromocionInput = {
    titulo,
    descripcion: body?.descripcion ? String(body.descripcion) : null,
    bancos: Array.isArray(body?.bancos) ? body.bancos.map(String) : [],
    shoppings: Array.isArray(body?.shoppings) ? body.shoppings.map(String) : [],
    tiendas: Array.isArray(body?.tiendas) ? body.tiendas.map(String) : [],
    marcas: Array.isArray(body?.marcas) ? body.marcas.map(String) : [],
    fecha_inicio,
    fecha_fin,
    descuento_pct: body?.descuento_pct != null ? Number(body.descuento_pct) : null,
    cuotas: body?.cuotas != null ? Number(body.cuotas) : null,
    tope: body?.tope != null ? Number(body.tope) : null,
    moneda: body?.moneda ? String(body.moneda) : "PYG",
    notas: body?.notas ? String(body.notas) : null,
    activa: body?.activa === false ? false : true,
    color: body?.color ? String(body.color) : null,
    created_by: body?.created_by ? String(body.created_by) : null,
  };

  try {
    const promocion = await insertPromocion(payload);
    return NextResponse.json({ promocion });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error al guardar." }, { status: 500 });
  }
}
