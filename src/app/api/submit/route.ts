import { NextRequest, NextResponse } from "next/server";
import { insertResponse } from "@/lib/supabase";
import { productByCode } from "@/lib/products";

export const runtime = "nodejs";

const GENDERS = ["Femenino", "Masculino", "Otro", "Prefiero no decir"];
const AGES = ["Menos de 18", "18-24", "25-34", "35-44", "45-54", "55+"];
const FREQ = [
  "No entreno",
  "1-2 veces por semana",
  "3-4 veces por semana",
  "5 o más veces por semana",
];

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

  const gender = String(body.gender || "");
  const age_range = String(body.age_range || "");
  const train_frequency = String(body.train_frequency || "");
  if (!GENDERS.includes(gender) || !AGES.includes(age_range) || !FREQ.includes(train_frequency)) {
    return NextResponse.json(
      { error: "Faltan datos de la encuesta (género, edad o frecuencia)." },
      { status: 400 },
    );
  }

  const rawSel = Array.isArray(body.selections) ? body.selections : [];
  const selections = rawSel
    .map((s: any) => ({
      code: String(s?.code || ""),
      size: String(s?.size || ""),
      favImg: s?.favImg ? String(s.favImg).slice(0, 80) : null,
    }))
    .filter((s: { code: string }) => Boolean(productByCode(s.code)))
    .slice(0, 300);

  if (selections.length === 0) {
    return NextResponse.json(
      { error: "Seleccioná al menos un producto antes de enviar." },
      { status: 400 },
    );
  }

  const name = body.name ? String(body.name).slice(0, 120) : null;
  const buys_where = body.buys_where ? String(body.buys_where).slice(0, 200) : null;
  const comment = body.comment ? String(body.comment).slice(0, 1000) : null;

  try {
    await insertResponse({
      name,
      gender,
      age_range,
      train_frequency,
      buys_where,
      comment,
      selections,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "No se pudo guardar la respuesta." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
