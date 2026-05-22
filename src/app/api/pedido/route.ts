import { NextRequest, NextResponse } from "next/server";
import { insertPedido, PedidoItem } from "@/lib/supabase";

export const runtime = "nodejs";

const CURVA_UNITS = 8;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const expected = process.env.SURVEY_ACCESS_TOKEN;
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "Enlace no válido." }, { status: 403 });
  }

  const empresa = String(body.empresa || "").trim().slice(0, 200);
  const contacto = String(body.contacto || "").trim().slice(0, 200);
  if (!empresa || !contacto) {
    return NextResponse.json(
      { error: "Faltan empresa y/o contacto." },
      { status: 400 },
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items: PedidoItem[] = rawItems
    .map((it: any) => {
      const curvas = Math.max(0, Math.round(Number(it?.curvas) || 0));
      return {
        code: String(it?.code || "").slice(0, 20),
        name: String(it?.name || "").slice(0, 200),
        color: String(it?.color || "").slice(0, 80),
        colorCode: String(it?.colorCode || "").slice(0, 20),
        curvas,
        unidades: curvas * CURVA_UNITS,
        mayoristaUnit: Math.round((Number(it?.mayoristaUnit) || 0) * 100) / 100,
      };
    })
    .filter((it: PedidoItem) => it.code && it.curvas > 0)
    .slice(0, 400);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "El pedido no tiene curvas." },
      { status: 400 },
    );
  }

  const total_curvas = items.reduce((s, it) => s + it.curvas, 0);
  const total_unidades = total_curvas * CURVA_UNITS;
  const total_usd =
    Math.round(
      items.reduce((s, it) => s + it.mayoristaUnit * it.unidades, 0) * 100,
    ) / 100;

  try {
    await insertPedido({
      empresa,
      contacto,
      phone: body.phone ? String(body.phone).slice(0, 60) : null,
      comment: body.comment ? String(body.comment).slice(0, 1000) : null,
      total_curvas,
      total_unidades,
      total_usd,
      items,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "No se pudo guardar el pedido." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
