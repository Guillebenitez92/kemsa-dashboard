import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

// Verifica la sesión admin sin tocar Supabase — para gatear páginas
// de admin que no necesitan datos (ej. /admin/muestras).
export async function GET() {
  if (!isValidAdminCookie(cookies().get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
