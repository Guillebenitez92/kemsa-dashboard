import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import { fetchPedidos, supabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

const MARKUP = 2.3; // mayorista = FOB × 2.3

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 500 });
  }

  const pedidos = await fetchPedidos();

  const rows: string[] = [];
  rows.push(
    [
      "Fecha", "Empresa / Local", "Contacto", "Telefono", "Comentario",
      "Codigo", "Producto", "Color", "Codigo color",
      "Curvas", "Unidades",
      "Mayorista unitario USD", "FOB unitario USD",
      "Subtotal mayorista USD", "Subtotal FOB USD",
    ].join(","),
  );

  for (const p of pedidos) {
    for (const it of p.items || []) {
      const fobUnit = Math.round((it.mayoristaUnit / MARKUP) * 100) / 100;
      rows.push(
        [
          csvCell(p.created_at),
          csvCell(p.empresa),
          csvCell(p.contacto),
          csvCell(p.phone),
          csvCell(p.comment),
          csvCell(it.code),
          csvCell(it.name),
          csvCell(it.color),
          csvCell(it.colorCode),
          csvCell(it.curvas),
          csvCell(it.unidades),
          csvCell(it.mayoristaUnit),
          csvCell(fobUnit),
          csvCell(Math.round(it.mayoristaUnit * it.unidades * 100) / 100),
          csvCell(Math.round(fobUnit * it.unidades * 100) / 100),
        ].join(","),
      );
    }
  }

  const csv = "﻿" + rows.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-mayoristas-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
