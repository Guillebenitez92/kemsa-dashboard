import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import { fetchResponses, supabaseConfigured } from "@/lib/supabase";
import { productByCode } from "@/lib/products";

export const runtime = "nodejs";

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

  const responses = await fetchResponses();

  const rows: string[] = [];
  rows.push(
    [
      "Fecha",
      "Nombre",
      "Genero",
      "Edad",
      "Frecuencia",
      "Compra habitualmente en",
      "Comentario",
      "Codigo",
      "Producto",
      "Categoria",
      "Talle",
      "Foto preferida (Drive id)",
      "Costo USD",
      "Retail USD",
    ].join(","),
  );

  for (const r of responses) {
    for (const s of r.selections || []) {
      const p = productByCode(s.code);
      rows.push(
        [
          csvCell(r.created_at),
          csvCell(r.name),
          csvCell(r.gender),
          csvCell(r.age_range),
          csvCell(r.train_frequency),
          csvCell(r.buys_where),
          csvCell(r.comment),
          csvCell(s.code),
          csvCell(p?.name || ""),
          csvCell(p?.category || ""),
          csvCell(s.size),
          csvCell((s as any).favImg || ""),
          csvCell(p?.cost ?? ""),
          csvCell(p?.retail ?? ""),
        ].join(","),
      );
    }
  }

  const csv = "﻿" + rows.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="encuesta-mormaii-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
