// Info de telas — extraída de "MORMAII SPORTS - Guia de Malhas 2026.pdf".
// La clave es el `line` que calcula products.ts. Videos de malha alojados
// en Google Drive (mismo patrón que las fotos): se embeben con /preview.

export type Fabric = {
  name: string;
  tagline: string;
  features: string[];
  desc: string;
  videoId?: string; // Google Drive file id (carpeta VÍDEOS SOBRE MALHAS)
};

export const FABRIC: Record<string, Fabric> = {
  Mary: {
    name: "Mary",
    tagline: "Base encorpada y resistente",
    features: ["Zero transparencia", "Protección UV 50+", "Encorpada y resistente"],
    desc: "Base encorpada y altamente resistente, de superficie lisa y protección UV 50+. Su estructura en malla doble con elastano da confort absoluto y garantiza total cero transparencia.",
    videoId: "11puWNcTUs9kpYPTd9fc2rIxCnQ5JTEko",
  },
  "Power Comfy": {
    name: "Power Comfy",
    tagline: "Soporte muscular, toque fresco",
    features: ["Zero transparencia", "Protección UV 50+", "Toque suave y fresco"],
    desc: "Poliamida de superficie lisa con protección UV 50+. Malla doble con elastano que da excelente soporte muscular y cero transparencia, con toque suave y sensación fresca en la piel.",
    videoId: "1yK2ECzJ4ljlzhqZHFOL9Y4pMTuwbv2d8",
  },
  Cristal: {
    name: "Cristal",
    tagline: "Elasticidad y secado rápido",
    features: ["Protección UV 50+", "Secado rápido", "Elasticidad y liviandad"],
    desc: "Poliamida lisa con elastano, de superficie suave y toque macio. Ofrece óptima elasticidad y secado rápido, ideal para actividades al aire libre, con protección UV 50+.",
  },
  "Power Gloss": {
    name: "Gloss",
    tagline: "Brillo premium con performance",
    features: ["Protección UV 50+", "Mini canelado", "Brillo premium"],
    desc: "Tela con brillo premium y mini canelado que une estilo y performance, con excelente cobertura y confort durante la actividad. Protección UV 50+.",
  },
  Cirre: {
    name: "Power Cirrê",
    tagline: "Brillo elegante, alta performance",
    features: ["Protección UV 50+", "Alta cobertura", "Brillo sutil"],
    desc: "Poliamida que combina brillo elegante con alta performance. Con protección UV 50+ y excelente cobertura, ideal para quien busca estilo y seguridad en el entrenamiento.",
  },
  "Croco Mary": {
    name: "Mary Croco",
    tagline: "Base Mary con textura cocodrilo",
    features: ["Zero transparencia", "Protección UV 50+", "Textura sutil y atemporal"],
    desc: "Base encorpada y resistente con textura sofisticada inspirada en el cocodrilo. Desarrollada a partir de la base Mary, mantiene superficie estructurada, protección UV 50+ y cero transparencia.",
  },
  Madrid: {
    name: "Madri",
    tagline: "Superliviana y resistente al agua",
    features: ["Superliviana", "Textura cuadriculada", "Resistente al agua", "Alta respirabilidad"],
    desc: "Visual moderno con desempeño funcional. Tela super liviana con textura cuadriculada contemporánea; ofrece resistencia al agua y alta respirabilidad.",
  },
  "Dry Mini Point": {
    name: "Dry Mini Point",
    tagline: "Tecnológica para alta performance",
    features: ["Secado rápido", "Superliviana", "Alta respirabilidad"],
    desc: "Tela tecnológica para alta performance. Extremadamente liviana, con secado rápido y alta respirabilidad: mantiene el cuerpo confortable incluso en actividades intensas.",
  },
  "Dry Air Flow": {
    name: "Dry Fresh",
    tagline: "Liviana y respirable",
    features: ["Protección UV 50+", "Secado rápido", "Superliviana"],
    desc: "Sinónimo de liviandad y respirabilidad. Tela tecnológica con secado rápido y alta ventilación que mantiene el cuerpo seco y confortable en los entrenamientos más intensos.",
  },
  "Malha Furadinha": {
    name: "Dry Fresh",
    tagline: "Malla perforada respirable",
    features: ["Secado rápido", "Alta ventilación", "Liviana"],
    desc: "Malla perforada de la familia Dry: alta ventilación y secado rápido, pensada para mantener el cuerpo seco y confortable durante la actividad.",
  },
  "Helanca Dry": {
    name: "Helanca",
    tagline: "Confort que acompaña tu rutina",
    features: ["Toque macio", "Resistencia al uso", "Malla doble"],
    desc: "Visual deportivo con confort para tu rutina. Toque macio y estructura en malla doble que garantizan resistencia al uso y excelente durabilidad.",
  },
  Ribana: {
    name: "Malha Essence",
    tagline: "Canelada, ajuste al cuerpo",
    features: ["Estructura canelada", "Ajuste al cuerpo", "Confortable"],
    desc: "Ribana canelada que se ajusta al cuerpo con confort, aportando estructura y un acabado prolijo a la prenda.",
  },
  Cotton: {
    name: "Cotton",
    tagline: "Suavidad y confort en cada detalle",
    features: ["Toque macio", "Ajuste al cuerpo", "Super confortable"],
    desc: "Tela que entrega suavidad y confort en cada detalle. Con óptimo ajuste al cuerpo, da libertad de movimiento y una sensación agradable durante el uso.",
  },
  "Malha Cotton": {
    name: "Meia Malha Penteada",
    tagline: "100% algodón, día a día",
    features: ["100% algodón", "Toque macio", "Confortable"],
    desc: "Perfecta para el día a día, combinando simplicidad y confort. Producida en 100% algodón, con toque macio y agradable en cualquier ocasión.",
  },
  Demicompression: {
    name: "Movement",
    tagline: "Compresión en la medida justa",
    features: ["Alta cobertura", "Toque sedoso premium", "Performance y confort", "Protección UV 50+"],
    desc: "Tela desarrollada para ofrecer compresión en la medida justa, valorizando el cuerpo con confort y seguridad. Alta cobertura y toque sedoso premium para un excelente desempeño en el entrenamiento.",
  },
};

export function fabricFor(line: string | undefined): Fabric | undefined {
  if (!line) return undefined;
  return FABRIC[line];
}
