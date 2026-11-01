// Fictional demo catalog shared by the server seed and the browser-only demo.
export interface CategoryDef { slug: string; name: string; tagline: string }
export interface ProductDef {
  slug: string; name: string; category: string; price: number; compareAt?: number; stock: number;
  rating: number; tags: string[]; description: string; features: string[]; image: string;
}

export const CATEGORIES: CategoryDef[] = [
  { slug: "electronics", name: "Electronics", tagline: "Smart tech for everyday life" },
  { slug: "fashion", name: "Fashion", tagline: "Timeless pieces, modern fits" },
  { slug: "home", name: "Home & Living", tagline: "Make your space feel like you" },
  { slug: "sports", name: "Sports & Outdoors", tagline: "Gear that keeps up with you" },
];

const p = (slug: string, name: string, category: string, price: number, compareAt: number | undefined, stock: number, rating: number, tags: string[], description: string, features: string[]): ProductDef =>
  ({ slug, name, category, price, compareAt, stock, rating, tags, description, features, image: `images/products/${slug}.jpg` });

export const PRODUCTS: ProductDef[] = [
  p("aurasound-pro-headphones", "AuraSound Pro Wireless Headphones", "electronics", 149, 199, 42, 4.7, ["wireless", "noise cancelling", "bluetooth", "audio", "travel", "gift"],
    "Over-ear wireless headphones with adaptive noise cancelling, 40-hour battery life and plush memory-foam cushions for all-day comfort.",
    ["Adaptive active noise cancelling", "40 h battery, 10 min charge = 5 h", "Bluetooth 5.3 multipoint", "Foldable travel design"]),
  p("pulse-s2-smartwatch", "Pulse S2 Smartwatch", "electronics", 229, undefined, 18, 4.5, ["fitness", "health", "gps", "wearable", "sleep tracking", "waterproof"],
    "A sleek fitness smartwatch with built-in GPS, heart-rate and sleep tracking, and a bright always-on display that lasts a full week.",
    ["Built-in GPS & 100+ workout modes", "Heart-rate, SpO₂ and sleep tracking", "7-day battery", "5 ATM water resistance"]),
  p("nimbus-portable-speaker", "Nimbus Portable Speaker", "electronics", 89, 109, 64, 4.4, ["bluetooth", "waterproof", "outdoor", "party", "audio", "portable"],
    "Rugged, waterproof Bluetooth speaker with deep bass and 360° sound — made for beaches, hikes and backyard parties.",
    ["IP67 waterproof & dustproof", "360° sound with passive bass radiator", "20 h playtime", "Pair two for stereo"]),
  p("vertex-mechanical-keyboard", "Vertex Mechanical Keyboard", "electronics", 119, undefined, 27, 4.8, ["keyboard", "gaming", "office", "rgb", "mechanical", "productivity"],
    "Hot-swappable 75% mechanical keyboard with tactile switches, PBT keycaps and per-key RGB — built for coders and gamers.",
    ["Hot-swappable tactile switches", "Double-shot PBT keycaps", "USB-C + 2.4 GHz wireless", "Aluminium top plate"]),
  p("retro-vinyl-turntable", "Retro Vinyl Turntable", "electronics", 169, 199, 9, 4.5, ["vinyl", "music", "audio", "retro", "gift", "bluetooth"],
    "A belt-driven turntable with a built-in preamp and Bluetooth output — rediscover your record collection in warm analogue sound.",
    ["Belt drive, 33⅓ & 45 RPM", "Built-in phono preamp", "Bluetooth output to speakers", "Solid wood plinth"]),
  p("classic-leather-jacket", "Classic Leather Jacket", "fashion", 249, 320, 15, 4.6, ["leather", "jacket", "winter", "outerwear", "men", "women", "classic"],
    "A timeless zip-up biker jacket in buttery full-grain leather with a quilted lining that keeps you warm on cold evenings.",
    ["Full-grain lambskin leather", "Quilted warm lining", "YKK zips", "Unisex regular fit"]),
  p("classic-chelsea-boots", "Classic Chelsea Boots", "fashion", 159, 189, 26, 4.6, ["boots", "leather", "shoes", "winter", "men", "women", "classic"],
    "Sleek full-grain leather Chelsea boots with elastic side panels and a cushioned, grippy sole — dress them up or down.",
    ["Full-grain leather upper", "Elastic side panels & pull tab", "Cushioned insole", "Durable rubber sole"]),
  p("minimalist-analog-watch", "Minimalist Analog Watch", "fashion", 139, 169, 33, 4.6, ["watch", "accessories", "gift", "leather", "classic", "men", "women"],
    "A clean-dial analog watch with a sapphire-coated crystal and a genuine leather strap — understated and elegant.",
    ["Japanese quartz movement", "Scratch-resistant crystal", "Genuine leather strap", "5 ATM water resistant"]),
  p("heritage-leather-backpack", "Heritage Leather Backpack", "fashion", 189, undefined, 12, 4.7, ["backpack", "leather", "travel", "laptop", "work", "bag"],
    "A handcrafted leather backpack with a padded 15\" laptop sleeve, brass hardware and a patina that gets better with age.",
    ["Fits 15\" laptops", "Vegetable-tanned leather", "Brass hardware", "Water-resistant lining"]),
  p("gold-round-sunglasses", "Gold Round Sunglasses", "fashion", 59, 79, 55, 4.2, ["sunglasses", "summer", "accessories", "uv protection", "travel"],
    "Retro round sunglasses with lightweight gold metal frames and polarised UV400 lenses.",
    ["Polarised UV400 lenses", "Lightweight metal frame", "Spring hinges", "Includes hard case"]),
  p("terracotta-vase-trio", "Terracotta Vase Trio", "home", 69, undefined, 24, 4.6, ["decor", "vase", "ceramic", "minimal", "gift", "living room"],
    "A set of three hand-thrown terracotta vases in earthy tones — beautiful on their own or with dried flowers.",
    ["Set of 3 sizes", "Hand-thrown terracotta", "Matte natural finish", "Water-tight glaze inside"]),
  p("arc-desk-lamp", "Arc Desk Lamp", "home", 74, 95, 38, 4.4, ["lamp", "lighting", "office", "desk", "minimal", "study"],
    "An adjustable desk lamp with a weighted base and warm, flicker-free LED light that's easy on the eyes.",
    ["Adjustable arm & head", "Warm 2700 K LED", "Touch dimmer", "Weighted steel base"]),
  p("pour-over-coffee-kit", "Pour-Over Coffee Kit", "home", 54, undefined, 46, 4.8, ["coffee", "kitchen", "gift", "brewing", "morning"],
    "Everything you need for café-quality pour-over at home: glass dripper, carafe, gooseneck kettle and reusable filter.",
    ["Borosilicate glass carafe", "Gooseneck kettle for precise pouring", "Reusable stainless filter", "Brewing guide included"]),
  p("linen-throw-pillow", "Linen Throw Pillow", "home", 39, 49, 70, 4.3, ["pillow", "cushion", "living room", "linen", "decor", "cozy"],
    "A soft stonewashed linen cushion with a feather-blend insert — instantly makes your sofa cosier.",
    ["100% stonewashed linen cover", "Feather-blend insert", "Hidden zip", "50 × 50 cm"]),
  p("monstera-deliciosa-plant", "Monstera Deliciosa Plant", "home", 49, undefined, 20, 4.7, ["plant", "indoor", "decor", "green", "gift", "living room"],
    "A lush, easy-care Monstera in a nursery pot — a statement plant that loves bright, indirect light.",
    ["60–70 cm tall", "Easy care, pet-safe pot", "Care card included", "Ships in eco packaging"]),
  p("pro-grip-yoga-mat", "Pro Grip Yoga Mat", "sports", 69, 89, 58, 4.6, ["yoga", "fitness", "home workout", "pilates", "eco", "non slip"],
    "A 5 mm natural-rubber yoga mat with a sweat-resistant grip surface and alignment markings.",
    ["Natural rubber, non-slip", "5 mm cushioning", "Alignment lines", "Carry strap included"]),
  p("hex-dumbbell-pair", "Hex Dumbbell Pair (2 × 10 kg)", "sports", 99, undefined, 22, 4.5, ["weights", "strength", "home gym", "fitness", "dumbbells"],
    "Rubber-coated hex dumbbells with knurled chrome handles that won't roll away mid-set.",
    ["2 × 10 kg", "Anti-roll hex heads", "Knurled ergonomic handles", "Floor-friendly rubber coating"]),
  p("insulated-steel-bottle", "Insulated Steel Bottle (750 ml)", "sports", 29, 35, 120, 4.7, ["bottle", "hydration", "gym", "travel", "eco", "outdoor"],
    "Double-wall insulated bottle that keeps drinks cold for 24 hours or hot for 12 — leak-proof and BPA-free.",
    ["24 h cold / 12 h hot", "Leak-proof lid", "BPA-free stainless steel", "Fits most cup holders"]),
  p("cloudstride-running-shoes", "CloudStride Running Shoes", "sports", 119, 139, 36, 4.6, ["running", "shoes", "marathon", "training", "lightweight", "comfort"],
    "Lightweight daily trainers with responsive foam and a breathable knit upper for easy miles and race days.",
    ["Responsive foam midsole", "Breathable engineered knit", "8 mm drop", "Reflective details"]),
  p("trailhead-2-person-tent", "Trailhead 2-Person Tent", "sports", 199, 249, 8, 4.5, ["camping", "tent", "outdoor", "hiking", "travel", "waterproof"],
    "A freestanding 3-season backpacking tent that sets up in minutes and keeps you dry in heavy rain.",
    ["2.1 kg packed weight", "3,000 mm waterproof rainfly", "Two doors, two vestibules", "Colour-coded quick setup"]),
];

// Unsplash photo ids (free Unsplash License) fetched by scripts/fetch-images.mjs in CI.
export const PRODUCT_PHOTOS: Record<string, string> = {
  "aurasound-pro-headphones": "photo-1505740420928-5e560c06d30e", "pulse-s2-smartwatch": "photo-1660844817855-3ecc7ef21f12",
  "nimbus-portable-speaker": "photo-1582978571763-2d039e56f0c3", "vertex-mechanical-keyboard": "photo-1618384887929-16ec33fab9ef",
  "retro-vinyl-turntable": "photo-1496293455970-f8581aae0e3b", "classic-leather-jacket": "photo-1551028719-00167b16eac5",
  "classic-chelsea-boots": "photo-1534233812932-59b8fa1b780c", "minimalist-analog-watch": "photo-1524592094714-0f0654e20314",
  "heritage-leather-backpack": "photo-1622560480605-d83c853bc5c3", "gold-round-sunglasses": "photo-1511499767150-a48a237f0083",
  "terracotta-vase-trio": "photo-1631125915902-d8abe9225ff2", "arc-desk-lamp": "photo-1507473885765-e6ed057f782c",
  "pour-over-coffee-kit": "photo-1758221052634-33f352d1318b", "linen-throw-pillow": "photo-1629949009765-40fc74c9ec21",
  "monstera-deliciosa-plant": "photo-1653404809389-f370ea4310dd", "pro-grip-yoga-mat": "photo-1763004871583-4183d64096b1",
  "hex-dumbbell-pair": "photo-1638536532686-d610adfc8e5c", "insulated-steel-bottle": "photo-1625708458528-802ec79b1ed8",
  "cloudstride-running-shoes": "photo-1560769629-975ec94e6a86", "trailhead-2-person-tent": "photo-1504280390367-361c6d9f38f4",
};

// Sample review snippets (fictional demo data) used to exercise the AI review summary.
export const REVIEW_TEMPLATES: { rating: number; title: string; body: string }[] = [
  { rating: 5, title: "Exceeded expectations", body: "Great quality for the price and it arrived quickly. Exactly as described." },
  { rating: 5, title: "Love it", body: "Beautiful design and very well made. I use it every day." },
  { rating: 4, title: "Very good", body: "Solid build and comfortable. Packaging could be more eco-friendly." },
  { rating: 4, title: "Good value", body: "Works well and looks premium. Took a few days longer to ship than expected." },
  { rating: 3, title: "Decent", body: "It does the job, but the colour is slightly different from the photos." },
  { rating: 2, title: "Not for me", body: "Quality is fine but it was smaller than I expected. Returns were easy though." },
];
