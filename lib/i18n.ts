import type { SttLang } from "./stt";
import type { DayKey } from "./storefront";

/**
 * App languages. One choice drives BOTH the UI strings and the speech
 * recognition language — for this audience they're the same decision.
 *
 * Two surfaces use this differently:
 * - App chrome (editor): the user's chosen language (persisted client-side).
 * - Public storefront pages: the SHOP's language (from storefront.language),
 *   because a Hindi shop's visitors are Hindi readers — the viewer never
 *   needs a setting there.
 */
export type UiLang = "en" | "hi" | "pa";

/**
 * The viewer's chosen language travels as a cookie so SERVER components
 * (public pages, dashboard) can read it — localStorage never leaves the
 * browser. Client writes both; server reads the cookie.
 */
export const LANG_COOKIE = "bd_lang";

export const UI_LANGS: { code: UiLang; sttLang: SttLang; label: string }[] = [
  { code: "hi", sttLang: "hi-IN", label: "हिंदी" },
  { code: "pa", sttLang: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { code: "en", sttLang: "en-IN", label: "English" },
];

export function uiToSttLang(lang: UiLang): SttLang {
  return UI_LANGS.find((l) => l.code === lang)?.sttLang ?? "hi-IN";
}

/** Normalise a storefront.language value ("hi" | "pa" | "en" | null) safely. */
export function normalizeLang(value: string | null | undefined): UiLang {
  return value === "hi" || value === "pa" || value === "en" ? value : "en";
}

export interface UiStrings {
  // hero
  titlePre: string;
  titleAccent: string;
  titlePost: string;
  subline: string;
  // voice ritual
  holdToSpeak: string;
  holdToAddMore: string;
  building: string;
  typeInstead: string;
  useVoiceInstead: string;
  typedPlaceholder: string;
  buildMyStorefront: string;
  noVoiceInBrowser: string;
  // result / publish
  yourVoice: string;
  previewTitle: string;
  partialNote: string;
  publishCta: string;
  publishing: string;
  updateCta: string;
  updating: string;
  liveAt: string;
  startOver: string;
  // errors
  errNoSpeech: string;
  errMic: string;
  errStt: string;
  errBuild: string;
  errNetwork: string;
  errPublish: string;
  // storefront card
  yourShop: string;
  hours: string;
  sells: string;
  address: string;
  callShop: string;
  openNow: string;
  closedNow: string;
  closes: (time: string) => string;
  opens: (time: string) => string;
  closedWord: string;
  dayLabels: Record<DayKey, string>;
  emptyCard: string;
  // public page
  shareOnWhatsApp: string;
  shareText: string;
  madeWith: string;
  // account nav
  navDashboard: string;
  navSignIn: string;
  navSignOut: string;
  // sign-in gate
  gateTitle: string;
  gateSub: string;
  gateSignInGoogle: string;
  gateBack: string;
  // dashboard
  dashTitle: string;
  dashSignedInAs: string;
  dashManagePlan: string;
  dashEmpty: string;
  dashEmptyCta: string;
  badgeLive: string;
  badgeUnpublished: string;
  viewsLabel: (n: number) => string;
  actView: string;
  actEdit: string;
  actPublish: string;
  actUnpublish: string;
  actDelete: string;
  confirmDelete: string;
  proThemeNotice: string;
  // billing
  billTitle: string;
  billBack: string;
  billCurrentFree: string;
  billCurrentPro: string;
  billUpgradeTitle: (price: number) => string;
  billFeaturesFree: string[];
  billFeaturesPro: string[];
  billUpgradeCta: string;
  billStarting: string;
}

const en: UiStrings = {
  titlePre: "Speak, and your ",
  titleAccent: "shop",
  titlePost: " is ready.",
  subline: "Speak — your shop page builds itself",
  holdToSpeak: "Hold and describe your shop",
  holdToAddMore: "Hold to add more",
  building: "Building your storefront…",
  typeInstead: "Type instead",
  useVoiceInstead: "Use voice instead",
  typedPlaceholder:
    "My shop is Sharma General Store in Moga, open 9am to 9pm, we sell atta, daal, chawal. Phone 98xxxxxxxx",
  buildMyStorefront: "Build my storefront",
  noVoiceInBrowser:
    "Voice input isn't available in this browser — type a description instead.",
  yourVoice: "your voice",
  previewTitle: "Your storefront preview",
  partialNote: "We saved what we heard — speak again to fill in the rest.",
  publishCta: "Publish & get shareable link",
  publishing: "Publishing…",
  updateCta: "Update published page",
  updating: "Updating…",
  liveAt: "Live at",
  startOver: "Start over",
  errNoSpeech: "I didn't catch that — hold the button and speak.",
  errMic: "Microphone permission is needed. Allow mic access and try again.",
  errStt: "Speech recognition had a problem. Try again or type instead.",
  errBuild: "Couldn't build the storefront. Try again.",
  errNetwork: "Network error. Check your connection and try again.",
  errPublish: "Couldn't publish. Try again.",
  yourShop: "Your shop",
  hours: "Hours",
  sells: "Sells",
  address: "Address",
  callShop: "Call shop",
  openNow: "Open now",
  closedNow: "Closed",
  closes: (time) => `closes ${time}`,
  opens: (time) => `opens ${time}`,
  closedWord: "Closed",
  dayLabels: {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  },
  emptyCard:
    "We couldn't pick out shop details yet. Try again and describe your shop's name, what you sell, your hours, and a phone number.",
  shareOnWhatsApp: "Share on WhatsApp",
  shareText: "check out my shop",
  madeWith: "Made with BolDukaan — speak your shop into existence",
  navDashboard: "Dashboard",
  navSignIn: "Sign in",
  navSignOut: "Sign out",
  gateTitle: "Sign in to manage your shops",
  gateSub:
    "Your storefronts, all in one place — publish, unpublish, and edit by voice.",
  gateSignInGoogle: "Sign in with Google",
  gateBack: "← Back to home",
  dashTitle: "Your shops",
  dashSignedInAs: "Signed in as",
  dashManagePlan: "Manage plan",
  dashEmpty: "You haven't created a shop yet.",
  dashEmptyCta: "Speak your first storefront →",
  badgeLive: "Live",
  badgeUnpublished: "Unpublished",
  viewsLabel: (n) => `${n} view${n === 1 ? "" : "s"}`,
  actView: "View",
  actEdit: "Edit",
  actPublish: "Publish",
  actUnpublish: "Unpublish",
  actDelete: "Delete",
  confirmDelete: "Delete this storefront? This can't be undone.",
  proThemeNotice: "Premium themes need Pro — see Manage plan.",
  billTitle: "Plan & billing",
  billBack: "← Dashboard",
  billCurrentFree: "Current: Free plan",
  billCurrentPro: "Current: Pro plan",
  billUpgradeTitle: (price) => `Upgrade to Pro — ₹${price}/mo`,
  billFeaturesFree: [
    "1 storefront",
    "Classic theme",
    "“Made with BolDukaan” badge",
  ],
  billFeaturesPro: [
    "Up to 5 storefronts",
    "Remove BolDukaan branding",
    "All themes",
    "Edit by voice",
  ],
  billUpgradeCta: "Upgrade to Pro",
  billStarting: "Starting checkout…",
};

const hi: UiStrings = {
  titlePre: "बोलो, और ",
  titleAccent: "दुकान",
  titlePost: " तैयार।",
  subline: "बोलो — दुकान अपने आप बन जाएगी",
  holdToSpeak: "दबाकर अपनी दुकान बताइए",
  holdToAddMore: "और बताने के लिए दबाएँ",
  building: "आपकी दुकान बन रही है…",
  typeInstead: "टाइप करें",
  useVoiceInstead: "आवाज़ से बोलें",
  typedPlaceholder:
    "मेरा शर्मा जनरल स्टोर है, मोगा में, सुबह 9 से रात 9 बजे तक खुला, आटा दाल चावल बेचते हैं, फ़ोन 98xxxxxxxx",
  buildMyStorefront: "मेरी दुकान बनाओ",
  noVoiceInBrowser:
    "इस ब्राउज़र में आवाज़ इनपुट नहीं है — टाइप करके बताइए।",
  yourVoice: "आपकी आवाज़",
  previewTitle: "यहाँ आपकी दुकान दिखेगी",
  partialNote: "जो सुना वह सेव कर लिया — बाक़ी के लिए फिर बोलें।",
  publishCta: "पब्लिश करें और लिंक पाएँ",
  publishing: "पब्लिश हो रहा है…",
  updateCta: "पेज अपडेट करें",
  updating: "अपडेट हो रहा है…",
  liveAt: "लाइव है यहाँ",
  startOver: "फिर से शुरू करें",
  errNoSpeech: "सुनाई नहीं दिया — बटन दबाकर बोलिए।",
  errMic: "माइक की अनुमति चाहिए — allow करके फिर कोशिश करें।",
  errStt: "आवाज़ पहचान में दिक्कत हुई। फिर कोशिश करें या टाइप करें।",
  errBuild: "दुकान नहीं बन पाई। फिर कोशिश करें।",
  errNetwork: "नेटवर्क में दिक्कत। कनेक्शन देखकर फिर कोशिश करें।",
  errPublish: "पब्लिश नहीं हो पाया। फिर कोशिश करें।",
  yourShop: "आपकी दुकान",
  hours: "समय",
  sells: "सामान",
  address: "पता",
  callShop: "कॉल करें",
  openNow: "अभी खुला है",
  closedNow: "अभी बंद है",
  closes: (time) => `बंद होगा ${time}`,
  opens: (time) => `खुलेगा ${time}`,
  closedWord: "बंद",
  dayLabels: {
    mon: "सोम",
    tue: "मंगल",
    wed: "बुध",
    thu: "गुरु",
    fri: "शुक्र",
    sat: "शनि",
    sun: "रवि",
  },
  emptyCard:
    "अभी दुकान की जानकारी नहीं मिल पाई। फिर बोलें — नाम, क्या बेचते हैं, समय और फ़ोन नंबर बताइए।",
  shareOnWhatsApp: "WhatsApp पर शेयर करें",
  shareText: "देखो मेरी दुकान",
  madeWith: "BolDukaan से बनी — बोलो, दुकान तैयार",
  navDashboard: "डैशबोर्ड",
  navSignIn: "साइन इन",
  navSignOut: "साइन आउट",
  gateTitle: "अपनी दुकानें मैनेज करने के लिए साइन इन करें",
  gateSub:
    "आपकी सभी दुकानें एक जगह — पब्लिश, अनपब्लिश और आवाज़ से एडिट करें।",
  gateSignInGoogle: "Google से साइन इन करें",
  gateBack: "← होम पर वापस",
  dashTitle: "आपकी दुकानें",
  dashSignedInAs: "साइन इन:",
  dashManagePlan: "प्लान देखें",
  dashEmpty: "अभी तक कोई दुकान नहीं बनाई।",
  dashEmptyCta: "बोलकर पहली दुकान बनाएँ →",
  badgeLive: "लाइव",
  badgeUnpublished: "अनपब्लिश्ड",
  viewsLabel: (n) => `${n} विज़िट`,
  actView: "देखें",
  actEdit: "एडिट",
  actPublish: "पब्लिश करें",
  actUnpublish: "अनपब्लिश करें",
  actDelete: "हटाएँ",
  confirmDelete: "यह दुकान हटा दें? इसे वापस नहीं लाया जा सकता।",
  proThemeNotice: "प्रीमियम थीम के लिए Pro चाहिए — प्लान देखें।",
  billTitle: "प्लान और बिलिंग",
  billBack: "← डैशबोर्ड",
  billCurrentFree: "अभी: Free प्लान",
  billCurrentPro: "अभी: Pro प्लान",
  billUpgradeTitle: (price) => `Pro लें — ₹${price}/महीना`,
  billFeaturesFree: ["1 दुकान", "Classic थीम", "“Made with BolDukaan” बैज"],
  billFeaturesPro: [
    "5 तक दुकानें",
    "BolDukaan ब्रांडिंग हटे",
    "सभी थीम",
    "आवाज़ से एडिट",
  ],
  billUpgradeCta: "Pro में अपग्रेड करें",
  billStarting: "चेकआउट शुरू हो रहा है…",
};

const pa: UiStrings = {
  titlePre: "ਬੋਲੋ, ਅਤੇ ",
  titleAccent: "ਦੁਕਾਨ",
  titlePost: " ਤਿਆਰ।",
  subline: "ਬੋਲੋ — ਦੁਕਾਨ ਆਪਣੇ ਆਪ ਬਣ ਜਾਵੇਗੀ",
  holdToSpeak: "ਦਬਾ ਕੇ ਆਪਣੀ ਦੁਕਾਨ ਬਾਰੇ ਦੱਸੋ",
  holdToAddMore: "ਹੋਰ ਦੱਸਣ ਲਈ ਦਬਾਓ",
  building: "ਤੁਹਾਡੀ ਦੁਕਾਨ ਬਣ ਰਹੀ ਹੈ…",
  typeInstead: "ਟਾਈਪ ਕਰੋ",
  useVoiceInstead: "ਆਵਾਜ਼ ਨਾਲ ਬੋਲੋ",
  typedPlaceholder:
    "ਮੇਰਾ ਸ਼ਰਮਾ ਜਨਰਲ ਸਟੋਰ ਹੈ, ਮੋਗਾ ਵਿੱਚ, ਸਵੇਰੇ 9 ਤੋਂ ਰਾਤ 9 ਵਜੇ ਤੱਕ ਖੁੱਲ੍ਹਾ, ਆਟਾ ਦਾਲ ਚੌਲ ਵੇਚਦੇ ਹਾਂ, ਫ਼ੋਨ 98xxxxxxxx",
  buildMyStorefront: "ਮੇਰੀ ਦੁਕਾਨ ਬਣਾਓ",
  noVoiceInBrowser:
    "ਇਸ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਆਵਾਜ਼ ਇਨਪੁੱਟ ਨਹੀਂ — ਟਾਈਪ ਕਰਕੇ ਦੱਸੋ।",
  yourVoice: "ਤੁਹਾਡੀ ਆਵਾਜ਼",
  previewTitle: "ਇੱਥੇ ਤੁਹਾਡੀ ਦੁਕਾਨ ਦਿਖੇਗੀ",
  partialNote: "ਜੋ ਸੁਣਿਆ ਉਹ ਸੇਵ ਕਰ ਲਿਆ — ਬਾਕੀ ਲਈ ਮੁੜ ਬੋਲੋ।",
  publishCta: "ਪਬਲਿਸ਼ ਕਰੋ ਅਤੇ ਲਿੰਕ ਲਵੋ",
  publishing: "ਪਬਲਿਸ਼ ਹੋ ਰਿਹਾ ਹੈ…",
  updateCta: "ਪੇਜ ਅੱਪਡੇਟ ਕਰੋ",
  updating: "ਅੱਪਡੇਟ ਹੋ ਰਿਹਾ ਹੈ…",
  liveAt: "ਲਾਈਵ ਹੈ ਇੱਥੇ",
  startOver: "ਮੁੜ ਸ਼ੁਰੂ ਕਰੋ",
  errNoSpeech: "ਸੁਣਿਆ ਨਹੀਂ — ਬਟਨ ਦਬਾ ਕੇ ਬੋਲੋ।",
  errMic: "ਮਾਈਕ ਦੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ — allow ਕਰਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  errStt: "ਆਵਾਜ਼ ਪਛਾਣ ਵਿੱਚ ਦਿੱਕਤ ਹੋਈ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਟਾਈਪ ਕਰੋ।",
  errBuild: "ਦੁਕਾਨ ਨਹੀਂ ਬਣ ਸਕੀ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  errNetwork: "ਨੈੱਟਵਰਕ ਵਿੱਚ ਦਿੱਕਤ। ਕਨੈਕਸ਼ਨ ਵੇਖ ਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  errPublish: "ਪਬਲਿਸ਼ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  yourShop: "ਤੁਹਾਡੀ ਦੁਕਾਨ",
  hours: "ਸਮਾਂ",
  sells: "ਸਮਾਨ",
  address: "ਪਤਾ",
  callShop: "ਕਾਲ ਕਰੋ",
  openNow: "ਹੁਣ ਖੁੱਲ੍ਹਾ ਹੈ",
  closedNow: "ਹੁਣ ਬੰਦ ਹੈ",
  closes: (time) => `ਬੰਦ ਹੋਵੇਗਾ ${time}`,
  opens: (time) => `ਖੁੱਲ੍ਹੇਗਾ ${time}`,
  closedWord: "ਬੰਦ",
  dayLabels: {
    mon: "ਸੋਮ",
    tue: "ਮੰਗਲ",
    wed: "ਬੁੱਧ",
    thu: "ਵੀਰ",
    fri: "ਸ਼ੁੱਕਰ",
    sat: "ਸ਼ਨੀ",
    sun: "ਐਤ",
  },
  emptyCard:
    "ਹਾਲੇ ਦੁਕਾਨ ਦੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਮਿਲੀ। ਮੁੜ ਬੋਲੋ — ਨਾਮ, ਕੀ ਵੇਚਦੇ ਹੋ, ਸਮਾਂ ਅਤੇ ਫ਼ੋਨ ਨੰਬਰ ਦੱਸੋ।",
  shareOnWhatsApp: "WhatsApp 'ਤੇ ਸ਼ੇਅਰ ਕਰੋ",
  shareText: "ਵੇਖੋ ਮੇਰੀ ਦੁਕਾਨ",
  madeWith: "BolDukaan ਨਾਲ ਬਣੀ — ਬੋਲੋ, ਦੁਕਾਨ ਤਿਆਰ",
  navDashboard: "ਡੈਸ਼ਬੋਰਡ",
  navSignIn: "ਸਾਈਨ ਇਨ",
  navSignOut: "ਸਾਈਨ ਆਊਟ",
  gateTitle: "ਆਪਣੀਆਂ ਦੁਕਾਨਾਂ ਮੈਨੇਜ ਕਰਨ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
  gateSub:
    "ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਦੁਕਾਨਾਂ ਇੱਕੋ ਥਾਂ — ਪਬਲਿਸ਼, ਅਨਪਬਲਿਸ਼ ਅਤੇ ਆਵਾਜ਼ ਨਾਲ ਐਡਿਟ ਕਰੋ।",
  gateSignInGoogle: "Google ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ",
  gateBack: "← ਹੋਮ 'ਤੇ ਵਾਪਸ",
  dashTitle: "ਤੁਹਾਡੀਆਂ ਦੁਕਾਨਾਂ",
  dashSignedInAs: "ਸਾਈਨ ਇਨ:",
  dashManagePlan: "ਪਲਾਨ ਵੇਖੋ",
  dashEmpty: "ਹਾਲੇ ਕੋਈ ਦੁਕਾਨ ਨਹੀਂ ਬਣਾਈ।",
  dashEmptyCta: "ਬੋਲ ਕੇ ਪਹਿਲੀ ਦੁਕਾਨ ਬਣਾਓ →",
  badgeLive: "ਲਾਈਵ",
  badgeUnpublished: "ਅਨਪਬਲਿਸ਼ਡ",
  viewsLabel: (n) => `${n} ਵਿਜ਼ਿਟ`,
  actView: "ਵੇਖੋ",
  actEdit: "ਐਡਿਟ",
  actPublish: "ਪਬਲਿਸ਼ ਕਰੋ",
  actUnpublish: "ਅਨਪਬਲਿਸ਼ ਕਰੋ",
  actDelete: "ਹਟਾਓ",
  confirmDelete: "ਇਹ ਦੁਕਾਨ ਹਟਾ ਦੇਈਏ? ਇਹ ਵਾਪਸ ਨਹੀਂ ਆਵੇਗੀ।",
  proThemeNotice: "ਪ੍ਰੀਮੀਅਮ ਥੀਮ ਲਈ Pro ਚਾਹੀਦਾ ਹੈ — ਪਲਾਨ ਵੇਖੋ।",
  billTitle: "ਪਲਾਨ ਅਤੇ ਬਿਲਿੰਗ",
  billBack: "← ਡੈਸ਼ਬੋਰਡ",
  billCurrentFree: "ਹੁਣ: Free ਪਲਾਨ",
  billCurrentPro: "ਹੁਣ: Pro ਪਲਾਨ",
  billUpgradeTitle: (price) => `Pro ਲਵੋ — ₹${price}/ਮਹੀਨਾ`,
  billFeaturesFree: ["1 ਦੁਕਾਨ", "Classic ਥੀਮ", "“Made with BolDukaan” ਬੈਜ"],
  billFeaturesPro: [
    "5 ਤੱਕ ਦੁਕਾਨਾਂ",
    "BolDukaan ਬ੍ਰਾਂਡਿੰਗ ਹਟੇ",
    "ਸਾਰੀਆਂ ਥੀਮਾਂ",
    "ਆਵਾਜ਼ ਨਾਲ ਐਡਿਟ",
  ],
  billUpgradeCta: "Pro ਵਿੱਚ ਅੱਪਗ੍ਰੇਡ ਕਰੋ",
  billStarting: "ਚੈੱਕਆਊਟ ਸ਼ੁਰੂ ਹੋ ਰਿਹਾ ਹੈ…",
};

const STRINGS: Record<UiLang, UiStrings> = { en, hi, pa };

export function t(lang: UiLang): UiStrings {
  return STRINGS[lang] ?? STRINGS.en;
}
