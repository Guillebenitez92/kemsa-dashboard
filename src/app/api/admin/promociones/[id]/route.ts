import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import {
  deletePromocion,
  supabaseConfigured,
  updatePromocion,
  type PromocionInput,
} from "@/lib/supabase";

export const runtime = "nodejs";

function unauth() {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}
function gate(): boolean {
  return isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const patch: Partial<PromocionInput> = {};
  if (body?.titulo !== undefined) patch.titulo = String(body.titulo);
  if (body?.descripcion !== undefined)
    patch.descripcion = body.descripcion ? String(body.descripcion) : null;
  if (Array.isArray(body?.bancos)) patch.bancos = body.bancos.map(String);
  if (Array.isArray(body?.shoppings)) patch.shoppings = body.shoppings.map(String);
  if (Array.isArray(body?.tiendas)) patch.tiendas = body.tiendas.map(String);
  if (Array.isArray(body?.marcas)) patch.marcas = body.marcas.map(String);
  if (body?.fecha_inicio !== undefined) patch.fecha_inicio = String(body.fecha_inicio);
  if (body?.fecha_fin !== undefined) patch.fecha_fin = String(body.fecha_fin);
  if (body?.descuento_pct !== undefined)
    patch.descuento_pct = body.descuento_pct === null ? null : Number(body.descuento_pct);
  if (body?.cuotas !== undefined)
    patch.cuotas = body.cuotas === null ? null : Number(body.cuotas);
  if (body?.tope !== undefined)
    patch.tope = body.tope === null ? null : Number(body.tope);
  if (body?.moneda !== undefined) patch.moneda = String(body.moneda);
  if (body?.notas !== undefined) patch.notas = body.notas ? String(body.notas) : null;
  if (body?.activa !== undefined) patch.activa = Boolean(body.activa);
  if (body?.color !== undefined) patch.color = body.color ? String(body.color) : null;

  if (patch.fecha_inicio && patch.fecha_fin && patch.fecha_fin < patch.fecha_inicio) {
    return NextResponse.json(
      { error: "La fecha fin no puede ser anterior a la fecha inicio." },
      { status: 400 },
    );
  }

  try {
    const promocion = await updatePromocion(params.id, patch);
    return NextResponse.json({ promocion });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!gate()) return unauth();
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 500 });
  }
  try {
    await deletePromocion(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error." }, { status: 500 });
  }
}
