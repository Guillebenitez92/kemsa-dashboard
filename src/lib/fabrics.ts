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

// --- Casual / WEAR -------------------------------------------------------
// El "line" de Casual es la categoría, no la tela. La tela está en el nombre
// del producto. Info de "MORMAII - Guia de Malhas 2026.pdf" (la mayoría del
// PDF es imagen/fuente incrustada; sólo "Malha Porto" salió como texto, va
// textual) + propiedades estándar de cada tejido. Sin videos: en Drive sólo
// hay videos de malha de Sports (Mary y Power Comfy).

const F_PORTO: Fabric = {
  name: "Malha Porto",
  tagline: "Modernidad y sofisticación",
  features: ["Textura cuadriculada en relieve", "Toque agradable", "Caída estructurada"],
  desc: "Traduce modernidad y sofisticación, con su construcción en relieve y textura cuadriculada. Desarrollada en telar circular, presenta un toque agradable, uniendo resistencia, confort y caída estructurada. Base versátil que valoriza el diseño de las prendas.",
};
const F_ESTRUCTURADA: Fabric = {
  name: "Malha estructurada",
  tagline: "Tejido jacquard con relieve",
  features: ["Textura en relieve", "Telar circular", "Caída prolija", "Look premium"],
  desc: "Familia de mallas estructuradas tipo jacquard tejidas en telar circular, con textura en relieve y toque agradable. Aportan personalidad, caída prolija y un acabado premium a la prenda.",
};
const F_MALHAO: Fabric = {
  name: "Malhão",
  tagline: "Punto grueso, caída premium",
  features: ["Encorpado", "Caída estructurada", "Look over"],
  desc: "Punto más grueso y encorpado que da cuerpo y una caída premium a la prenda, ideal para un look estructurado u oversized con mucho confort.",
};
const F_PELETIZADA: Fabric = {
  name: "Malha peletizada",
  tagline: "Micro-textura, toque seco",
  features: ["Superficie micro-texturada", "Toque seco", "Acabado sofisticado"],
  desc: "Meia malha peinada con acabado peletizado: una micro-textura en la superficie que aporta toque seco y un acabado más sofisticado que el algodón liso.",
};
const F_DUPLA_FACE: Fabric = {
  name: "Doble faz",
  tagline: "Dos caras, más cuerpo",
  features: ["Doble cara", "Más estructura", "Abrigo liviano"],
  desc: "Malla de doble faz (dos caras), que aporta más cuerpo, estructura y un abrigo liviano, manteniendo el confort.",
};
const F_RAJADA: Fabric = {
  name: "Malha Rajada Dry",
  tagline: "Jaspeada con tecnología dry",
  features: ["Secado rápido", "Transpirable", "Aspecto jaspeado"],
  desc: "Malla con aspecto jaspeado (rajado) y tecnología Dry: secado rápido y buena transpirabilidad para mantener el cuerpo seco y confortable.",
};
const F_HELANCA_DIAG: Fabric = {
  name: "Helanca Diagonal",
  tagline: "Textura diagonal, dry",
  features: ["Textura diagonal", "Secado rápido", "Resistente al uso"],
  desc: "Variante de la helanca con textura en diagonal y tecnología dry: visual deportivo, resistencia al uso y secado rápido.",
};
const F_SUEDINE: Fabric = {
  name: "Suedine",
  tagline: "Toque durazno aterciopelado",
  features: ["Tacto peach skin", "Suave", "Confortable"],
  desc: "Tejido con acabado tipo durazno (peach skin): superficie aterciopelada, muy suave al tacto y confortable, con buena caída.",
};
const F_MODAL: Fabric = {
  name: "Modal",
  tagline: "Suavidad fluida y fresca",
  features: ["Fibra de celulosa", "Muy suave", "Fresco y fluido"],
  desc: "Fibra de celulosa de tacto súper suave, con caída fluida y sensación fresca en la piel. Más sedoso y liviano que el algodón común.",
};
const F_PIQUET: Fabric = {
  name: "Piquet",
  tagline: "Clásico de la polo",
  features: ["Tejido panal", "Fresco", "Estructurado"],
  desc: "Tejido con textura tipo panal/pico, clásico de la camisa polo. Estructurado y fresco, mantiene la forma y aporta un acabado prolijo.",
};
const F_SARJA: Fabric = {
  name: "Sarja",
  tagline: "Resistente y estructurada",
  features: ["Tejido plano diagonal", "Resistente", "Caída con cuerpo"],
  desc: "Tejido plano con trama diagonal (gabardina/sarga), resistente y con cuerpo. Ideal para pantalón y bermuda: estructura, durabilidad y caída prolija.",
};
const F_JEANS: Fabric = {
  name: "Jeans / Denim",
  tagline: "Atemporal y resistente",
  features: ["Algodón sarga índigo", "Resistente", "Versátil"],
  desc: "Denim de algodón en sarga índigo: resistente, durable y atemporal. La base versátil que combina con todo.",
};
const F_LINHO: Fabric = {
  name: "Linho",
  tagline: "Fresco y natural",
  features: ["Muy transpirable", "Caída natural", "Look alfaiataria"],
  desc: "Lino (o mezcla con lino): tejido fresco y altamente transpirable, de caída natural y aspecto noble, ideal para un look alfaiataria de verano.",
};
const F_MOLETINHO: Fabric = {
  name: "Moletinho",
  tagline: "Friza liviana y suave",
  features: ["Friza liviana", "Toque suave", "Confort diario"],
  desc: "Moletón liviano (moletinho): friza fina y suave, abrigo ligero y mucho confort para el día a día.",
};
const F_MOLETOM: Fabric = {
  name: "Moletom",
  tagline: "Abrigo suave y cómodo",
  features: ["Friza interna", "Abrigo", "Confortable"],
  desc: "Moletón con friza interna: abrigo suave, comodidad y caída con cuerpo. Ideal para bermudas y prendas de descanso/urbanas.",
};
const F_TACTEL: Fabric = {
  name: "Tactel Hydronatic",
  tagline: "Liviano y secado ultrarrápido",
  features: ["Hidrofóbico", "Secado ultrarrápido", "Súper liviano"],
  desc: "Nylon tactel con tecnología Hydronatic: súper liviano, hidrofóbico y de secado ultrarrápido. Pensado para boardshorts y volley shorts: del agua a la calle sin esfuerzo.",
};
const F_NEOPRENE: Fabric = {
  name: "Neoprene",
  tagline: "Cuerpo que modela",
  features: ["Estructura y cuerpo", "Modela la silueta", "Abrigo"],
  desc: "Tejido con cuerpo tipo neoprene: estructura que modela la silueta y aporta un abrigo liviano, manteniendo la forma de la prenda.",
};
const F_LORCA: Fabric = {
  name: "Malha Lorca",
  tagline: "Caída fluida con estructura",
  features: ["Caída fluida", "Estructura sutil", "Look moderno"],
  desc: "Malla Lorca: combina caída fluida con una estructura sutil que valoriza la silueta, para un look moderno y confortable.",
};
const F_SUPLEX: Fabric = {
  name: "Suplex",
  tagline: "Elástico y resistente",
  features: ["Buena elasticidad", "Recuperación", "Toque liso"],
  desc: "Poliéster texturizado tipo suplex: buena elasticidad y recuperación, superficie lisa y resistente, con cobertura y confort en el uso.",
};
const F_MEIA_MALHA: Fabric = {
  name: "Meia Malha Penteada",
  tagline: "Algodón peinado del día a día",
  features: ["Algodón peinado", "Toque macio", "Versátil"],
  desc: "Meia malha de algodón peinado: el básico del día a día. Toque suave y agradable, confortable y versátil para cualquier ocasión.",
};

const CASUAL_FABRIC_RULES: [RegExp, Fabric][] = [
  [/MALHA PORTO/, F_PORTO],
  [
    /(DUBLIN|COREIA|ARUBA|NANTES|INDIA|EGITO|POSITANO|VENEZA|NORONHA|VIENA|TOQUIO|IBIZA|FLORIDA|POLILINHO|WAFFLE|LINHO COLOR)/,
    F_ESTRUCTURADA,
  ],
  [/MALHAO/, F_MALHAO],
  [/PELETIZADA/, F_PELETIZADA],
  [/DUPLA FACE/, F_DUPLA_FACE],
  [/RAJADA/, F_RAJADA],
  [/MALHA FURADINHA|FURADINHA DRY/, FABRIC["Malha Furadinha"]],
  [/HELANCA DIAGONAL/, F_HELANCA_DIAG],
  [/HELANCA/, FABRIC["Helanca Dry"]],
  [/SUEDINE/, F_SUEDINE],
  [/MODAL/, F_MODAL],
  [/PIQUET/, F_PIQUET],
  [/SARJA|CARGO|CHINO/, F_SARJA],
  [/JEANS|DENIM/, F_JEANS],
  [/LINHO/, F_LINHO],
  [/MOLETINHO/, F_MOLETINHO],
  [/MOLETOM/, F_MOLETOM],
  [/TACTEL|HYDRONATIC|HIDRONATIC|RIPSTOP|CUPRO|BOARD/, F_TACTEL],
  [/NEOPRENE/, F_NEOPRENE],
  [/LORCA/, F_LORCA],
  [/SUPLEX/, F_SUPLEX],
  [/RIBANA/, FABRIC["Ribana"]],
  [/COTTON/, FABRIC["Malha Cotton"]],
  [/M\/M|MEIA MALHA|\bPENT\b/, F_MEIA_MALHA],
];

export function casualFabricFor(rawName: string | undefined): Fabric | undefined {
  if (!rawName) return undefined;
  const d = rawName.toUpperCase();
  for (const [re, f] of CASUAL_FABRIC_RULES) if (re.test(d)) return f;
  return undefined;
}
