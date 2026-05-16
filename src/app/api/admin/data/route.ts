import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";
import { fetchResponses, supabaseConfigured } from "@/lib/supabase";
import { PRODUCTS, productByCode } from "@/lib/products";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado en el servidor." },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const fGender = url.searchParams.get("gender") || "";
  const fAge = url.searchParams.get("age") || "";

  let responses;
  try {
    responses = await fetchResponses();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error al leer datos." }, { status: 500 });
  }

  const filtered = responses.filter(
    (r) => (!fGender || r.gender === fGender) && (!fAge || r.age_range === fAge),
  );

  const total = filtered.length;

  const byProduct = new Map<
    string,
    {
      count: number;
      respondents: Set<string>;
      sizes: Record<string, number>;
      favs: Record<string, number>;
    }
  >();
  let totalSelections = 0;

  for (const r of filtered) {
    const seen = new Set<string>();
    for (const s of r.selections || []) {
      if (!productByCode(s.code)) continue;
      totalSelections++;
      let agg = byProduct.get(s.code);
      if (!agg) {
        agg = { count: 0, respondents: new Set(), sizes: {}, favs: {} };
        byProduct.set(s.code, agg);
      }
      if (!seen.has(s.code)) {
        agg.count++;
        seen.add(s.code);
      }
      agg.respondents.add(r.id);
      const size = s.size || "—";
      agg.sizes[size] = (agg.sizes[size] || 0) + 1;
      const fav = (s as any).favImg as string | null | undefined;
      if (fav) agg.favs[fav] = (agg.favs[fav] || 0) + 1;
    }
  }

  const ranking = PRODUCTS.map((p) => {
    const agg = byProduct.get(p.code);
    const count = agg ? agg.count : 0;
    return {
      code: p.code,
      name: p.name,
      category: p.category,
      gender: p.gender,
      cost: p.cost,
      retail: p.retail,
      count,
      pct: total ? Math.round((count / total) * 1000) / 10 : 0,
      sizes: agg ? agg.sizes : {},
      favs: agg ? agg.favs : {},
    };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const tally = (key: "gender" | "age_range" | "train_frequency") => {
    const m: Record<string, number> = {};
    for (const r of filtered) {
      const v = (r as any)[key] || "—";
      m[v] = (m[v] || 0) + 1;
    }
    return m;
  };

  const recent = filtered.slice(0, 50).map((r) => ({
    created_at: r.created_at,
    name: r.name,
    gender: r.gender,
    age_range: r.age_range,
    train_frequency: r.train_frequency,
    buys_where: r.buys_where,
    comment: r.comment,
    count: (r.selections || []).length,
  }));

  return NextResponse.json({
    total,
    totalSelections,
    avgPerPerson: total ? Math.round((totalSelections / total) * 10) / 10 : 0,
    ranking,
    demographics: {
      gender: tally("gender"),
      age: tally("age_range"),
      frequency: tally("train_frequency"),
    },
    recent,
  });
}
