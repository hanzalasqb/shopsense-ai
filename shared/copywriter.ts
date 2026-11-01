// Deterministic product copywriter used when no LLM is configured (and by the browser demo).
// Benefits are chosen from what each feature actually says, so bullets stay specific and never repeat.

export type Tone = "premium" | "friendly" | "technical";
export interface CopyInput { name: string; category: string; features: string[]; tone: Tone | string }
export interface GeneratedCopy { engine: "template"; description: string; bullets: string[]; seoKeywords: string[] }

const BENEFITS: [RegExp, string][] = [
  [/battery|\bhours?\b|charg|\d+\s?mah\b/i, "lasts all day without hunting for a charger"],
  [/waterproof|water-resistant|\bip\d{2}\b|weather|\brain/i, "ready for rain, spills and the outdoors"],
  [/compartment|pocket|storage|organi[sz]|slot|drawer/i, "keeps the essentials in their place"],
  [/non-slip|anti-slip|grip|rubber/i, "stays put while you work or train"],
  [/sustainab|recycled|bamboo|organic|\beco\b|\beco-|\bfsc\b/i, "a choice that feels good, too"],
  [/lightweight|portable|compact|foldable|\b\d+\s?g\b/i, "easy to carry wherever the day goes"],
  [/noise|\banc\b|sound|audio|\bbass\b|speaker|driver/i, "rich sound with fewer distractions"],
  [/wireless|bluetooth|usb-c|magsafe|wi-?fi/i, "fewer cables and a faster setup"],
  [/leather|\bwool|cotton|linen|steel|alumin|ceramic|\boak\b|walnut|\bglass\b/i, "materials that age well and feel great"],
  [/warranty|guarantee|lifetime/i, "backed for years to come"],
  [/adjustable|custom|\bsizes?\b|\bfit\b/i, "dialled in to fit you"],
  [/clean|wash|dishwasher|wipe/i, "simple to keep looking new"],
];
const FALLBACK = ["built for everyday use", "a detail you'll notice every time", "designed around how you actually live", "made to last"];

const SPACE: Record<string, string> = { electronics: "tech setup", fashion: "wardrobe", home: "home", sports: "training", outdoors: "adventures" };
const OPENER: Record<Tone, string> = {
  premium: "Crafted for those who expect more,",
  friendly: "Meet your new favourite:",
  technical: "Engineered for dependable performance,",
};
const CLOSER: Record<Tone, string> = {
  premium: "Quietly refined and made to last.",
  friendly: "Built to last and designed to make every day a little easier.",
  technical: "Specified for reliability and long-term use.",
};
const STOP = new Set(["with", "and", "for", "the", "that", "this", "from", "your", "into", "made", "base"]);

export function templateCopy(input: CopyInput): GeneratedCopy {
  const tone: Tone = input.tone === "premium" || input.tone === "technical" ? input.tone : "friendly";
  const features = input.features.map((f) => f.trim()).filter(Boolean).slice(0, 6);
  const used = new Set<string>();
  let fallback = 0;
  const benefitFor = (feature: string) => {
    const hit = BENEFITS.find(([re, b]) => re.test(feature) && !used.has(b));
    const benefit = hit ? hit[1] : FALLBACK[fallback++ % FALLBACK.length];
    used.add(benefit);
    return benefit;
  };
  const bullets = features.slice(0, 4).map((f) => {
    const b = benefitFor(f);
    return tone === "technical" ? `${f}: ${b}.` : tone === "premium" ? `${f}, ${b}.` : `${f} — ${b}`;
  });
  const highlights = features.slice(0, 2).map((f) => f.toLowerCase()).join(" and ") || "thoughtful design";
  const space = SPACE[input.category.toLowerCase()] ?? input.category.toLowerCase();
  const seoKeywords = [...new Set([
    input.name.toLowerCase(),
    input.category.toLowerCase(),
    ...features.flatMap((f) => f.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 3 && !STOP.has(w))),
  ])].slice(0, 6);
  return {
    engine: "template",
    description: `${OPENER[tone]} the ${input.name} brings ${highlights} to your ${space}. ${CLOSER[tone]}`,
    bullets,
    seoKeywords,
  };
}
