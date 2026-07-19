import type { Locale } from "./config";

export interface Dictionary {
  brandTag: string;
  eyebrow: string;
  slogan: string;       // may contain a single <span class="accent">...</span>
  live: string;
  lede: string;
  ctaPrimary: string;
  ctaSecondary: string;
  starterCard: string;  // "Auditoria mensal POS" etc.
}

const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": {
    brandTag: "Food & Tourism Marketing · Cinema",
    eyebrow: "Barcelona · Espanha · Portugal · Brasil · LATAM",
    slogan: 'Quando os dados <span class="accent">cheiram a café</span> e os números têm sabor.',
    live: "Fluxo de dados ao vivo",
    lede: "Filmamos os protagonistas reais e cruzamos com os dados do seu caixa (POS).",
    ctaPrimary: "Solicitar Auditoria de Vendas de 48h ➔",
    ctaSecondary: "Ver os 7 vetores",
    starterCard: "Auditoria mensal POS",
  },
  es: {
    brandTag: "Food & Tourism Marketing · Cinema",
    eyebrow: "Barcelona · España · Portugal · Brasil · LATAM",
    slogan: 'Cuando los datos <span class="accent">huelen a café</span> y los números tienen sabor.',
    live: "Flujo de datos en vivo",
    lede: "Filmamos a los protagonistas reales y los cruzamos con los datos de tu caja (TPV).",
    ctaPrimary: "Solicitar Auditoría de Ventas de 48h ➔",
    ctaSecondary: "Ver los 7 vectores",
    starterCard: "Auditoría mensual TPV",
  },
  en: {
    brandTag: "Food & Tourism Marketing · Cinema",
    eyebrow: "Barcelona · Spain · Portugal · Brazil · LATAM",
    slogan: 'When data <span class="accent">smells of coffee</span> and numbers have flavour.',
    live: "Live data stream",
    lede: "We film the real protagonists and cross it with your point-of-sale data.",
    ctaPrimary: "Request 48h Sales Audit ➔",
    ctaSecondary: "See the 7 vectors",
    starterCard: "Monthly POS Audit",
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
