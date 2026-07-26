export const locales = ["fr", "ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export const currencies = ["MAD", "EUR", "USD"] as const;
export type Currency = (typeof currencies)[number];

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export const messages = {
  fr: {
    brand: "DarBladi",
    tagline: "Rechercher, comprendre et sécuriser votre décision immobilière",
    nav: {
      buy: "Acheter",
      rent: "Louer",
      new: "Neuf",
      map: "Carte",
      invest: "Investir",
      ai: "DarBladi",
      professionals: "Professionnels",
    },
    search: {
      placeholder: "Ville, quartier, type de bien…",
      aiPlaceholder: "Ex : F3 à Salé proche Technopolis pour moins de 1 300 000 DH",
      search: "Rechercher",
      filters: "Filtres",
      results: "résultats",
    },
    demo: "Données de démonstration — ne constituent pas de vraies annonces.",
    auth: { login: "Connexion", register: "Inscription", logout: "Déconnexion" },
    footer: { about: "À propos", contact: "Contact", legal: "Mentions légales" },
  },
  en: {
    brand: "DarBladi",
    tagline: "Search, understand and secure your real estate decision",
    nav: {
      buy: "Buy",
      rent: "Rent",
      new: "New builds",
      map: "Map",
      invest: "Invest",
      ai: "DarBladi",
      professionals: "Professionals",
    },
    search: {
      placeholder: "City, neighborhood, property type…",
      aiPlaceholder: "E.g. 2-bed in Salé near Technopolis under 1,300,000 MAD",
      search: "Search",
      filters: "Filters",
      results: "results",
    },
    demo: "Demo data — not real property listings.",
    auth: { login: "Sign in", register: "Sign up", logout: "Sign out" },
    footer: { about: "About", contact: "Contact", legal: "Legal notice" },
  },
  ar: {
    brand: "DarBladi",
    tagline: "ابحث، افهم وقرّر بثقة في سوقك العقاري",
    nav: {
      buy: "شراء",
      rent: "كراء",
      new: "جديد",
      map: "خريطة",
      invest: "استثمار",
      ai: "DarBladi",
      professionals: "محترفون",
    },
    search: {
      placeholder: "مدينة، حي، نوع العقار…",
      aiPlaceholder: "مثال: شقة F3 في سلا قرب Technopolis بأقل من 1 300 000 درهم",
      search: "بحث",
      filters: "فلاتر",
      results: "نتائج",
    },
    demo: "بيانات تجريبية — ليست إعلانات حقيقية.",
    auth: { login: "تسجيل الدخول", register: "إنشاء حساب", logout: "خروج" },
    footer: { about: "من نحن", contact: "اتصل", legal: "إشعار قانوني" },
  },
} as const;

export type Messages = (typeof messages)[Locale];

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.fr;
}
