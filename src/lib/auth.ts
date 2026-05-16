import { createHash } from "crypto";

export const ADMIN_COOKIE = "kemsa_admin";

function appSecret(): string {
  return process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "kemsa-secret";
}

// Token determinista derivado de la contraseña + secreto del servidor.
// No guarda la contraseña en el cliente; solo un hash que el servidor revalida.
export function adminToken(): string {
  const pass = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update(`${pass}::${appSecret()}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  // Comparación de longitud constante.
  const a = createHash("sha256").update(input).digest("hex");
  const b = createHash("sha256").update(expected).digest("hex");
  return a === b;
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!value) return false;
  return value === adminToken();
}
