import type { UiLang } from "./i18n";

/**
 * Discovery categories for the nearby browser. Shop `category` is free text
 * written by the model in whatever language the owner spoke, so each category
 * carries match terms across all three scripts and is tested against the
 * shop's category + name + products text (case-insensitive substring).
 */
export interface ShopCategory {
  id: string;
  labels: Record<UiLang, string>;
  match: string[];
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "electronics",
    labels: { en: "Electronics", hi: "इलेक्ट्रॉनिक्स", pa: "ਇਲੈਕਟ੍ਰਾਨਿਕਸ" },
    match: [
      "electronic",
      "mobile",
      "phone",
      "इलेक्ट",
      "मोबाइल",
      "फ़ोन",
      "फोन",
      "ਇਲੈਕਟ",
      "ਮੋਬਾਈਲ",
      "ਫ਼ੋਨ",
      "ਫੋਨ",
    ],
  },
  {
    id: "grocery",
    labels: { en: "Grocery", hi: "किराना", pa: "ਕਰਿਆਨਾ" },
    match: [
      "grocery",
      "kirana",
      "general store",
      "dairy",
      "किराना",
      "जनरल",
      "राशन",
      "डेयरी",
      "ਕਰਿਆਨਾ",
      "ਜਨਰਲ",
      "ਰਾਸ਼ਨ",
      "ਡੇਅਰੀ",
    ],
  },
  {
    id: "repair",
    labels: { en: "Repair", hi: "रिपेयर", pa: "ਰਿਪੇਅਰ" },
    match: ["repair", "रिपेयर", "मरम्मत", "ਰਿਪੇਅਰ", "ਮੁਰੰਮਤ"],
  },
  {
    id: "salon",
    labels: { en: "Salon", hi: "सैलून", pa: "ਸੈਲੂਨ" },
    match: [
      "salon",
      "saloon",
      "barber",
      "parlour",
      "parlor",
      "सैलून",
      "नाई",
      "पार्लर",
      "ਸੈਲੂਨ",
      "ਨਾਈ",
      "ਪਾਰਲਰ",
    ],
  },
  {
    id: "restaurant",
    labels: { en: "Restaurant", hi: "रेस्टोरेंट", pa: "ਰੈਸਟੋਰੈਂਟ" },
    match: [
      "restaurant",
      "dhaba",
      "cafe",
      "food",
      "sweet",
      "रेस्टोरेंट",
      "ढाबा",
      "कैफ़े",
      "खाना",
      "मिठाई",
      "ਰੈਸਟੋਰੈਂਟ",
      "ਢਾਬਾ",
      "ਕੈਫੇ",
      "ਖਾਣਾ",
      "ਮਿਠਾਈ",
    ],
  },
  {
    id: "clinic",
    labels: { en: "Clinic", hi: "क्लिनिक", pa: "ਕਲੀਨਿਕ" },
    match: [
      "clinic",
      "doctor",
      "medical",
      "pharmacy",
      "chemist",
      "क्लिनिक",
      "डॉक्टर",
      "दवा",
      "मेडिकल",
      "ਕਲੀਨਿਕ",
      "ਡਾਕਟਰ",
      "ਦਵਾਈ",
      "ਮੈਡੀਕਲ",
    ],
  },
  {
    id: "tuition",
    labels: { en: "Tuition", hi: "ट्यूशन", pa: "ਟਿਊਸ਼ਨ" },
    match: [
      "tuition",
      "coaching",
      "classes",
      "academy",
      "ट्यूशन",
      "कोचिंग",
      "क्लास",
      "ਟਿਊਸ਼ਨ",
      "ਕੋਚਿੰਗ",
      "ਕਲਾਸ",
    ],
  },
];

export function matchesCategory(cat: ShopCategory, haystack: string): boolean {
  const h = haystack.toLowerCase();
  return cat.match.some((term) => h.includes(term));
}
