// Catálogo sugerido para los selects del admin.
// Sirve como autocompletado; el usuario puede tipear valores nuevos.

export const MARCAS_KEMSA = [
  "American Look",
  "Kenneth Cole",
  "Scalpers",
  "Hollister",
  "Abercrombie",
  "Mormaii",
  "Aeropostale",
  "Santa Monica Polo",
  "HangTen",
  "US Polo",
  "Brooksfield",
  "Calvin Klein",
];

export const BANCOS_PY = [
  "Itaú",
  "Banco Continental",
  "Banco Familiar",
  "Banco Nacional de Fomento",
  "Banco Atlas",
  "Banco BASA",
  "Sudameris",
  "Banco Río",
  "Solar",
  "GNB",
  "Ueno",
  "Visión Banco",
  "Bancop",
  "Interfisa",
];

export const TARJETAS = [
  "Visa",
  "Mastercard",
  "American Express",
  "Cabal",
  "Credicard",
  "Panal",
];

export const SHOPPINGS_PY = [
  "Shopping del Sol",
  "Shopping Mariscal",
  "Paseo La Galería",
  "Shopping Multiplaza",
  "Pinedo Shopping",
  "Shopping Villa Morra",
  "Mariano Roque Alonso Shopping",
  "Shopping San Lorenzo",
  "Shopping París",
  "Ciudad del Este Shopping",
  "Paseo San Lorenzo",
];

export const CADENAS = [
  "Stock",
  "Real",
  "Superseis",
  "Casa Rica",
  "Biggie",
  "Salemma",
  "Nicolás",
];

// Estado calculado al vuelo a partir de fechas + flag activa.
export type EstadoPromocion = "activa" | "proxima" | "finalizada" | "pausada";

export function estadoDePromocion(
  fechaInicio: string,
  fechaFin: string,
  activa: boolean,
  hoyISO?: string,
): EstadoPromocion {
  if (!activa) return "pausada";
  const hoy = hoyISO ?? new Date().toISOString().slice(0, 10);
  if (hoy < fechaInicio) return "proxima";
  if (hoy > fechaFin) return "finalizada";
  return "activa";
}

export const ESTADO_COLOR: Record<EstadoPromocion, string> = {
  activa: "bg-emerald-100 text-emerald-800 border-emerald-200",
  proxima: "bg-amber-100 text-amber-800 border-amber-200",
  finalizada: "bg-stone-100 text-stone-500 border-stone-200",
  pausada: "bg-rose-100 text-rose-700 border-rose-200",
};

export const ESTADO_LABEL: Record<EstadoPromocion, string> = {
  activa: "Vigente",
  proxima: "Próxima",
  finalizada: "Finalizada",
  pausada: "Pausada",
};

// Paleta para colorear chips de promo en el calendario.
export const COLOR_PALETTE = [
  "#0b3d2e", // brand
  "#16a34a", // brand-accent
  "#0ea5e9", // sky
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function colorParaPromocion(p: { id: string; color: string | null }): string {
  if (p.color) return p.color;
  // hash determinista por id para mantener el mismo color entre renders
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) | 0;
  return COLOR_PALETTE[Math.abs(h) % COLOR_PALETTE.length];
}

export function formatFecha(iso: string): string {
  // YYYY-MM-DD → DD/MM/YYYY (es-PY)
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatRango(inicio: string, fin: string): string {
  return inicio === fin ? formatFecha(inicio) : `${formatFecha(inicio)} → ${formatFecha(fin)}`;
}

export function diasParaArrancar(fechaInicio: string, hoyISO?: string): number {
  const hoy = new Date((hoyISO ?? new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const ini = new Date(fechaInicio + "T00:00:00");
  return Math.round((ini.getTime() - hoy.getTime()) / 86400000);
}

export function diasRestantes(fechaFin: string, hoyISO?: string): number {
  const hoy = new Date((hoyISO ?? new Date().toISOString().slice(0, 10)) + "T00:00:00");
  const fin = new Date(fechaFin + "T00:00:00");
  return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
}
