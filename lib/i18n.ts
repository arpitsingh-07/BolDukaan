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
  askOnWhatsApp: string;
  itemAskText: (item: string) => string;
  openNow: string;
  closedNow: string;
  closes: (time: string) => string;
  opens: (time: string) => string;
  closedWord: string;
  dayLabels: Record<DayKey, string>;
  emptyCard: string;
  getDirections: string;
  // public page
  shareOnWhatsApp: string;
  shareText: string;
  madeWith: string;
  // location + nearby discovery
  setLocation: string;
  locationSet: string;
  locationError: string;
  nearbyTitle: string;
  nearbyIntro: string;
  nearbyUseLocation: string;
  nearbyLoading: string;
  nearbyEmpty: string;
  nearbyDenied: string;
  kmAway: (km: string) => string;
  browseNearby: string;
  addPhotos: string;
  searchPlaceholder: string;
  // account nav
  navDashboard: string;
  navSignIn: string;
  navSignOut: string;
  // sign-in gate
  gateTitle: string;
  gateSub: string;
  gateSignInGoogle: string;
  gateBack: string;
  // email/password auth
  authEmail: string;
  authPassword: string;
  authName: string;
  authSignInCta: string;
  authCreateCta: string;
  authToCreate: string;
  authToSignIn: string;
  authOr: string;
  authInvalid: string;
  authGeneric: string;
  authBusy: string;
  privacyPolicy: string;
  terms: string;
  authAgree: string; // contains "{terms}" and "{privacy}" tokens for the links
  authGoogleConsent: string; // contains "{terms}" and "{privacy}"
  authMustAgree: string;
  // billing paused
  billComingSoonTitle: string;
  billComingSoonBody: string;
  // missing-field suggestions after structuring
  missingIntro: string;
  missingName: string;
  missingPhone: string;
  missingAddress: string;
  missingProducts: string;
  missingHours: string;
  invalidPhone: string;
  // nearby demand generation (no shops nearby yet)
  nearbyExpandingTitle: string;
  nearbyExpandingSub: string;
  nearbyRequestPlaceholder: string;
  nearbyRequestCta: string;
  nearbyRequestThanks: string;
  nearbyNoMatch: string;
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
  billFreeName: string;
  billProName: string;
  billFreeDesc: string;
  billProDesc: string;
  billCurrentBadge: string;
  billCurrentCta: string;
  billFreePrice: string;
  billPerMonth: string;
  // landing
  navFind: string;
  navRegister: string;
  navAbout: string;
  landingSub: string;
  findShopsCta: string;
  findShopsSub: string;
  registerShopCta: string;
  registerShopSub: string;
  trustItems: string[];
  demoTitle: string;
  demoYouSpeak: string;
  demoTranscript: string;
  demoSteps: string[];
  aboutTitle: string;
  aboutBody: string;
  // create gate
  createGateTitle: string;
  createGateSub: string;
  // builder extras
  photosProgress: (n: number, max: number) => string;
  qrScanTitle: string;
  posterDownload: string;
  posterPrint: string;
  posterScan: string;
  waShareMessage: (args: {
    name: string | null;
    address: string | null;
    products: string[];
    url: string;
  }) => string;
  // dashboard extras
  dashWelcome: string;
  dashCreateNew: string;
  actShare: string;
  // nearby extras
  catAll: string;
  actCall: string;
  actDirections: string;
  filterLabel: string;
  clearFilters: string;
  // trust badges
  badgeLocalBiz: string;
  badgePhoneAvail: string;
  badgeOnWhatsApp: string;
  // "stepped out" owner override
  actMarkClosed: string;
  actReopen: string;
  closedTemporarily: string;
}

/** Assemble the post-publish WhatsApp message from localized scaffolding. */
function waMessage(
  parts: { hello: string; visit: string },
  args: { name: string | null; address: string | null; products: string[]; url: string },
): string {
  const lines: string[] = [parts.hello, ""];
  if (args.name) lines.push(args.name);
  if (args.address) lines.push(args.address);
  const products = args.products.filter(Boolean).slice(0, 4);
  if (products.length > 0) {
    lines.push("");
    for (const p of products) lines.push(`- ${p}`);
  }
  lines.push("", `${parts.visit}: ${args.url}`);
  return lines.join("\n");
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
  publishCta: "Create my digital shop",
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
  askOnWhatsApp: "Ask on WhatsApp",
  itemAskText: (item) => `Hi, is "${item}" available?`,
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
  getDirections: "Get directions",
  shareOnWhatsApp: "Share on WhatsApp",
  shareText: "check out my shop",
  madeWith: "Made with BolDukaan — speak your shop into existence",
  setLocation: "Set shop location",
  locationSet: "Shop location set",
  locationError:
    "Couldn't get your location. Allow location access and try again.",
  nearbyTitle: "Shops near you",
  nearbyIntro: "Find local shops around you.",
  nearbyUseLocation: "Use my location",
  nearbyLoading: "Finding shops nearby…",
  nearbyEmpty: "No shops found nearby yet. Be the first — create yours!",
  nearbyDenied: "Location access is needed to find nearby shops.",
  kmAway: (km) => `${km} km away`,
  browseNearby: "Shops near you",
  addPhotos: "Add photos",
  searchPlaceholder: "What do you need? (e.g. atta)",
  navDashboard: "Dashboard",
  navSignIn: "Sign in",
  navSignOut: "Sign out",
  gateTitle: "Sign in to manage your shops",
  gateSub:
    "Your storefronts, all in one place — publish, unpublish, and edit by voice.",
  gateSignInGoogle: "Sign in with Google",
  gateBack: "← Back to home",
  authEmail: "Email",
  authPassword: "Password",
  authName: "Your name (optional)",
  authSignInCta: "Sign in",
  authCreateCta: "Create account",
  authToCreate: "New here? Create an account",
  authToSignIn: "Already have an account? Sign in",
  authOr: "or",
  authInvalid: "Wrong email or password.",
  authGeneric: "Something went wrong. Please try again.",
  authBusy: "Please wait…",
  privacyPolicy: "Privacy Policy",
  terms: "Terms & Conditions",
  authAgree: "I have read and agree to the {terms} and {privacy}.",
  authGoogleConsent: "By continuing, you agree to our {terms} and {privacy}.",
  authMustAgree:
    "Please accept the Terms and Privacy Policy to create an account.",
  billComingSoonTitle: "Paid plans are coming soon",
  billComingSoonBody:
    "You're on the Free plan — enjoy everything free for now. Pro upgrades will open shortly.",
  missingIntro: "Add these to complete your shop — just hold and speak again:",
  missingName: "shop name",
  missingPhone: "phone number",
  missingAddress: "address",
  missingProducts: "what you sell",
  missingHours: "opening hours",
  invalidPhone: "a correct 10-digit phone number",
  nearbyExpandingTitle: "We're expanding in your area!",
  nearbyExpandingSub:
    "Which local shop do you want to see here? Enter its name or phone number and we'll bring it online.",
  nearbyRequestPlaceholder: "Shop name or phone number",
  nearbyRequestCta: "Request this shop",
  nearbyRequestThanks:
    "Thanks! We've noted it and will reach out to get them online.",
  nearbyNoMatch: "No shops match that. Try a different search or category.",
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
  billFreeName: "Free",
  billProName: "Pro",
  billFreeDesc: "Get your shop online",
  billProDesc: "For shops that want more",
  billCurrentBadge: "Current plan",
  billCurrentCta: "Your current plan",
  billFreePrice: "₹0",
  billPerMonth: "/month",
  navFind: "Find shops",
  navRegister: "Register shop",
  navAbout: "About",
  landingSub:
    "Speak once. Get your digital visiting card, catalogue, QR code and online shop ready in under a minute.",
  findShopsCta: "Find shops near you",
  findShopsSub: "Browse local shops around you",
  registerShopCta: "Register your shop",
  registerShopSub: "Speak once — your page, QR and catalogue are ready",
  trustItems: [
    "Hindi",
    "Punjabi",
    "English",
    "QR code",
    "Digital catalogue",
    "Shareable shop link",
  ],
  demoTitle: "From voice to shop in under a minute",
  demoYouSpeak: "You speak",
  demoTranscript:
    "“My name is Singh Electronics in Mohali. Our phone number is 98765-43210. We repair phones and sell covers. We are open till 8 PM.”",
  demoSteps: [
    "Shop created",
    "QR generated",
    "Catalogue created",
    "Visiting card generated",
    "Shareable link created",
  ],
  aboutTitle: "About BolDukaan",
  aboutBody:
    "BolDukaan puts small Indian shops online using only voice. Describe your shop in Hindi, Punjabi, or English — we build your page, catalogue, QR code and shareable link. No typing, no apps, no computer needed.",
  createGateTitle: "Sign in to create your shop",
  createGateSub:
    "Your shop stays saved with your account — edit it anytime, from any phone.",
  photosProgress: (n, max) => `${n}/${max} photos added`,
  qrScanTitle: "Your shop QR — print it, stick it on the counter",
  posterDownload: "Download poster (PNG)",
  posterPrint: "Print poster / save as PDF",
  posterScan: "Scan to visit",
  waShareMessage: (args) =>
    waMessage({ hello: "Hello! Our shop is now online.", visit: "Visit" }, args),
  dashWelcome: "Welcome back.",
  dashCreateNew: "+ Create new shop",
  actShare: "Share",
  catAll: "All",
  actCall: "Call",
  actDirections: "Directions",
  filterLabel: "Filters",
  clearFilters: "Clear all",
  badgeLocalBiz: "Local business",
  badgePhoneAvail: "Phone available",
  badgeOnWhatsApp: "On WhatsApp",
  actMarkClosed: "Close temporarily",
  actReopen: "Reopen",
  closedTemporarily: "Temporarily closed",
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
  publishCta: "मेरी डिजिटल दुकान बनाओ",
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
  askOnWhatsApp: "WhatsApp पर पूछें",
  itemAskText: (item) => `नमस्ते, क्या "${item}" उपलब्ध है?`,
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
  getDirections: "रास्ता देखें",
  shareOnWhatsApp: "WhatsApp पर शेयर करें",
  shareText: "देखो मेरी दुकान",
  madeWith: "BolDukaan से बनी — बोलो, दुकान तैयार",
  setLocation: "दुकान की लोकेशन सेट करें",
  locationSet: "दुकान की लोकेशन सेट हो गई",
  locationError: "लोकेशन नहीं मिली। लोकेशन की अनुमति देकर फिर कोशिश करें।",
  nearbyTitle: "आपके पास की दुकानें",
  nearbyIntro: "अपने आस-पास की दुकानें ढूँढें।",
  nearbyUseLocation: "मेरी लोकेशन इस्तेमाल करें",
  nearbyLoading: "पास की दुकानें ढूँढ रहे हैं…",
  nearbyEmpty: "पास में अभी कोई दुकान नहीं मिली। पहली दुकान आप बनाइए!",
  nearbyDenied: "पास की दुकानें ढूँढने के लिए लोकेशन की अनुमति चाहिए।",
  kmAway: (km) => `${km} किमी दूर`,
  browseNearby: "आपके पास की दुकानें",
  addPhotos: "फ़ोटो जोड़ें",
  searchPlaceholder: "आपको क्या चाहिए? (जैसे आटा)",
  navDashboard: "डैशबोर्ड",
  navSignIn: "साइन इन",
  navSignOut: "साइन आउट",
  gateTitle: "अपनी दुकानें मैनेज करने के लिए साइन इन करें",
  gateSub:
    "आपकी सभी दुकानें एक जगह — पब्लिश, अनपब्लिश और आवाज़ से एडिट करें।",
  gateSignInGoogle: "Google से साइन इन करें",
  gateBack: "← होम पर वापस",
  authEmail: "ईमेल",
  authPassword: "पासवर्ड",
  authName: "आपका नाम (वैकल्पिक)",
  authSignInCta: "साइन इन करें",
  authCreateCta: "खाता बनाएँ",
  authToCreate: "नए हैं? खाता बनाएँ",
  authToSignIn: "पहले से खाता है? साइन इन करें",
  authOr: "या",
  authInvalid: "ईमेल या पासवर्ड ग़लत है।",
  authGeneric: "कुछ गड़बड़ हुई। फिर कोशिश करें।",
  authBusy: "कृपया रुकें…",
  privacyPolicy: "प्राइवेसी पॉलिसी",
  terms: "नियम व शर्तें",
  authAgree: "मैंने {terms} और {privacy} पढ़ ली हैं और उनसे सहमत हूँ।",
  authGoogleConsent: "जारी रखने पर आप हमारी {terms} और {privacy} से सहमत होते हैं।",
  authMustAgree: "खाता बनाने के लिए नियम व शर्तें और प्राइवेसी पॉलिसी स्वीकार करें।",
  billComingSoonTitle: "पेड प्लान जल्द आ रहे हैं",
  billComingSoonBody:
    "आप Free प्लान पर हैं — फ़िलहाल सब कुछ मुफ़्त। Pro अपग्रेड जल्द शुरू होगा।",
  missingIntro: "दुकान पूरी करने के लिए ये भी बताएँ — दबाकर फिर बोलें:",
  missingName: "दुकान का नाम",
  missingPhone: "फ़ोन नंबर",
  missingAddress: "पता",
  missingProducts: "आप क्या बेचते हैं",
  missingHours: "खुलने का समय",
  invalidPhone: "सही 10 अंकों का फ़ोन नंबर",
  nearbyExpandingTitle: "हम आपके इलाके में आ रहे हैं!",
  nearbyExpandingSub:
    "आप यहाँ कौन सी दुकान देखना चाहते हैं? उसका नाम या फ़ोन नंबर लिखें, हम उसे ऑनलाइन लाएँगे।",
  nearbyRequestPlaceholder: "दुकान का नाम या फ़ोन नंबर",
  nearbyRequestCta: "यह दुकान माँगें",
  nearbyRequestThanks:
    "धन्यवाद! हमने नोट कर लिया और उन्हें ऑनलाइन लाने के लिए संपर्क करेंगे।",
  nearbyNoMatch: "इससे मिलती दुकान नहीं मिली। कोई और खोज या श्रेणी आज़माएँ।",
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
  billFreeName: "Free",
  billProName: "Pro",
  billFreeDesc: "अपनी दुकान ऑनलाइन लाएँ",
  billProDesc: "जो दुकानें और चाहती हैं",
  billCurrentBadge: "मौजूदा प्लान",
  billCurrentCta: "आपका मौजूदा प्लान",
  billFreePrice: "₹0",
  billPerMonth: "/महीना",
  navFind: "दुकानें ढूँढें",
  navRegister: "दुकान रजिस्टर करें",
  navAbout: "हमारे बारे में",
  landingSub:
    "एक बार बोलिए — डिजिटल विज़िटिंग कार्ड, कैटलॉग, QR कोड और ऑनलाइन दुकान, सब एक मिनट से कम में तैयार।",
  findShopsCta: "अपने पास की दुकानें ढूँढें",
  findShopsSub: "आस-पास की लोकल दुकानें देखें",
  registerShopCta: "अपनी दुकान रजिस्टर करें",
  registerShopSub: "एक बार बोलिए — पेज, QR और कैटलॉग तैयार",
  trustItems: [
    "हिंदी",
    "पंजाबी",
    "English",
    "QR कोड",
    "डिजिटल कैटलॉग",
    "शेयर करने लायक लिंक",
  ],
  demoTitle: "आवाज़ से दुकान — एक मिनट से कम में",
  demoYouSpeak: "आप बोलते हैं",
  demoTranscript:
    "“मेरी दुकान सिंह इलेक्ट्रॉनिक्स है, मोहाली में। हमारा फ़ोन नंबर 98765-43210 है। हम फ़ोन रिपेयर करते हैं और कवर बेचते हैं। हम रात 8 बजे तक खुले रहते हैं।”",
  demoSteps: [
    "दुकान बन गई",
    "QR बन गया",
    "कैटलॉग बन गया",
    "विज़िटिंग कार्ड बन गया",
    "शेयर लिंक तैयार",
  ],
  aboutTitle: "BolDukaan के बारे में",
  aboutBody:
    "BolDukaan छोटी दुकानों को सिर्फ़ आवाज़ से ऑनलाइन लाता है। हिंदी, पंजाबी या English में अपनी दुकान के बारे में बोलिए — पेज, कैटलॉग, QR कोड और शेयर लिंक हम बना देंगे। न टाइपिंग, न ऐप, न कंप्यूटर।",
  createGateTitle: "दुकान बनाने के लिए साइन इन करें",
  createGateSub:
    "आपकी दुकान आपके अकाउंट से सेव रहती है — कभी भी, किसी भी फ़ोन से एडिट करें।",
  photosProgress: (n, max) => `${n}/${max} फ़ोटो जुड़ीं`,
  qrScanTitle: "आपकी दुकान का QR — प्रिंट करके काउंटर पर लगाएँ",
  posterDownload: "पोस्टर डाउनलोड करें (PNG)",
  posterPrint: "पोस्टर प्रिंट करें / PDF सेव करें",
  posterScan: "स्कैन करें और देखें",
  waShareMessage: (args) =>
    waMessage(
      { hello: "नमस्ते! हमारी दुकान अब ऑनलाइन है।", visit: "देखें" },
      args,
    ),
  dashWelcome: "वापसी पर स्वागत है।",
  dashCreateNew: "+ नई दुकान बनाएँ",
  actShare: "शेयर",
  catAll: "सभी",
  actCall: "कॉल",
  actDirections: "रास्ता",
  filterLabel: "फ़िल्टर",
  clearFilters: "सब हटाएँ",
  badgeLocalBiz: "लोकल दुकान",
  badgePhoneAvail: "फ़ोन उपलब्ध",
  badgeOnWhatsApp: "WhatsApp पर",
  actMarkClosed: "थोड़ी देर के लिए बंद करें",
  actReopen: "फिर से खोलें",
  closedTemporarily: "थोड़ी देर के लिए बंद है",
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
  publishCta: "ਮੇਰੀ ਡਿਜੀਟਲ ਦੁਕਾਨ ਬਣਾਓ",
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
  askOnWhatsApp: "WhatsApp 'ਤੇ ਪੁੱਛੋ",
  itemAskText: (item) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕੀ "${item}" ਉਪਲਬਧ ਹੈ?`,
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
  getDirections: "ਰਸਤਾ ਵੇਖੋ",
  shareOnWhatsApp: "WhatsApp 'ਤੇ ਸ਼ੇਅਰ ਕਰੋ",
  shareText: "ਵੇਖੋ ਮੇਰੀ ਦੁਕਾਨ",
  madeWith: "BolDukaan ਨਾਲ ਬਣੀ — ਬੋਲੋ, ਦੁਕਾਨ ਤਿਆਰ",
  setLocation: "ਦੁਕਾਨ ਦੀ ਲੋਕੇਸ਼ਨ ਸੈੱਟ ਕਰੋ",
  locationSet: "ਦੁਕਾਨ ਦੀ ਲੋਕੇਸ਼ਨ ਸੈੱਟ ਹੋ ਗਈ",
  locationError: "ਲੋਕੇਸ਼ਨ ਨਹੀਂ ਮਿਲੀ। ਲੋਕੇਸ਼ਨ ਦੀ ਇਜਾਜ਼ਤ ਦੇ ਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  nearbyTitle: "ਤੁਹਾਡੇ ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ",
  nearbyIntro: "ਆਪਣੇ ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ ਲੱਭੋ।",
  nearbyUseLocation: "ਮੇਰੀ ਲੋਕੇਸ਼ਨ ਵਰਤੋ",
  nearbyLoading: "ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ ਲੱਭ ਰਹੇ ਹਾਂ…",
  nearbyEmpty: "ਨੇੜੇ ਹਾਲੇ ਕੋਈ ਦੁਕਾਨ ਨਹੀਂ ਮਿਲੀ। ਪਹਿਲੀ ਦੁਕਾਨ ਤੁਸੀਂ ਬਣਾਓ!",
  nearbyDenied: "ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ ਲੱਭਣ ਲਈ ਲੋਕੇਸ਼ਨ ਦੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ।",
  kmAway: (km) => `${km} ਕਿਮੀ ਦੂਰ`,
  browseNearby: "ਤੁਹਾਡੇ ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ",
  addPhotos: "ਫ਼ੋਟੋ ਸ਼ਾਮਲ ਕਰੋ",
  searchPlaceholder: "ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ? (ਜਿਵੇਂ ਆਟਾ)",
  navDashboard: "ਡੈਸ਼ਬੋਰਡ",
  navSignIn: "ਸਾਈਨ ਇਨ",
  navSignOut: "ਸਾਈਨ ਆਊਟ",
  gateTitle: "ਆਪਣੀਆਂ ਦੁਕਾਨਾਂ ਮੈਨੇਜ ਕਰਨ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
  gateSub:
    "ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਦੁਕਾਨਾਂ ਇੱਕੋ ਥਾਂ — ਪਬਲਿਸ਼, ਅਨਪਬਲਿਸ਼ ਅਤੇ ਆਵਾਜ਼ ਨਾਲ ਐਡਿਟ ਕਰੋ।",
  gateSignInGoogle: "Google ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ",
  gateBack: "← ਹੋਮ 'ਤੇ ਵਾਪਸ",
  authEmail: "ਈਮੇਲ",
  authPassword: "ਪਾਸਵਰਡ",
  authName: "ਤੁਹਾਡਾ ਨਾਮ (ਵਿਕਲਪਿਕ)",
  authSignInCta: "ਸਾਈਨ ਇਨ ਕਰੋ",
  authCreateCta: "ਖਾਤਾ ਬਣਾਓ",
  authToCreate: "ਨਵੇਂ ਹੋ? ਖਾਤਾ ਬਣਾਓ",
  authToSignIn: "ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ? ਸਾਈਨ ਇਨ ਕਰੋ",
  authOr: "ਜਾਂ",
  authInvalid: "ਈਮੇਲ ਜਾਂ ਪਾਸਵਰਡ ਗ਼ਲਤ ਹੈ।",
  authGeneric: "ਕੁਝ ਗੜਬੜ ਹੋਈ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  authBusy: "ਕਿਰਪਾ ਕਰਕੇ ਰੁਕੋ…",
  privacyPolicy: "ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ",
  terms: "ਨਿਯਮ ਤੇ ਸ਼ਰਤਾਂ",
  authAgree: "ਮੈਂ {terms} ਅਤੇ {privacy} ਪੜ੍ਹੀਆਂ ਹਨ ਅਤੇ ਇਨ੍ਹਾਂ ਨਾਲ ਸਹਿਮਤ ਹਾਂ।",
  authGoogleConsent: "ਜਾਰੀ ਰੱਖਣ 'ਤੇ ਤੁਸੀਂ ਸਾਡੀਆਂ {terms} ਅਤੇ {privacy} ਨਾਲ ਸਹਿਮਤ ਹੁੰਦੇ ਹੋ।",
  authMustAgree: "ਖਾਤਾ ਬਣਾਉਣ ਲਈ ਨਿਯਮ ਤੇ ਸ਼ਰਤਾਂ ਅਤੇ ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ ਸਵੀਕਾਰ ਕਰੋ।",
  billComingSoonTitle: "ਪੇਡ ਪਲਾਨ ਜਲਦੀ ਆ ਰਹੇ ਹਨ",
  billComingSoonBody:
    "ਤੁਸੀਂ Free ਪਲਾਨ 'ਤੇ ਹੋ — ਹੁਣ ਸਭ ਕੁਝ ਮੁਫ਼ਤ। Pro ਅੱਪਗ੍ਰੇਡ ਜਲਦੀ ਸ਼ੁਰੂ ਹੋਵੇਗਾ।",
  missingIntro: "ਦੁਕਾਨ ਪੂਰੀ ਕਰਨ ਲਈ ਇਹ ਵੀ ਦੱਸੋ — ਦਬਾ ਕੇ ਮੁੜ ਬੋਲੋ:",
  missingName: "ਦੁਕਾਨ ਦਾ ਨਾਮ",
  missingPhone: "ਫ਼ੋਨ ਨੰਬਰ",
  missingAddress: "ਪਤਾ",
  missingProducts: "ਤੁਸੀਂ ਕੀ ਵੇਚਦੇ ਹੋ",
  missingHours: "ਖੁੱਲ੍ਹਣ ਦਾ ਸਮਾਂ",
  invalidPhone: "ਸਹੀ 10 ਅੰਕਾਂ ਦਾ ਫ਼ੋਨ ਨੰਬਰ",
  nearbyExpandingTitle: "ਅਸੀਂ ਤੁਹਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਆ ਰਹੇ ਹਾਂ!",
  nearbyExpandingSub:
    "ਤੁਸੀਂ ਇੱਥੇ ਕਿਹੜੀ ਦੁਕਾਨ ਵੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ? ਉਸ ਦਾ ਨਾਮ ਜਾਂ ਫ਼ੋਨ ਨੰਬਰ ਲਿਖੋ, ਅਸੀਂ ਉਸ ਨੂੰ ਆਨਲਾਈਨ ਲਿਆਵਾਂਗੇ।",
  nearbyRequestPlaceholder: "ਦੁਕਾਨ ਦਾ ਨਾਮ ਜਾਂ ਫ਼ੋਨ ਨੰਬਰ",
  nearbyRequestCta: "ਇਹ ਦੁਕਾਨ ਮੰਗੋ",
  nearbyRequestThanks:
    "ਧੰਨਵਾਦ! ਅਸੀਂ ਨੋਟ ਕਰ ਲਿਆ ਅਤੇ ਉਨ੍ਹਾਂ ਨੂੰ ਆਨਲਾਈਨ ਲਿਆਉਣ ਲਈ ਸੰਪਰਕ ਕਰਾਂਗੇ।",
  nearbyNoMatch: "ਇਸ ਨਾਲ ਮਿਲਦੀ ਦੁਕਾਨ ਨਹੀਂ ਮਿਲੀ। ਕੋਈ ਹੋਰ ਖੋਜ ਜਾਂ ਸ਼੍ਰੇਣੀ ਅਜ਼ਮਾਓ।",
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
  billFreeName: "Free",
  billProName: "Pro",
  billFreeDesc: "ਆਪਣੀ ਦੁਕਾਨ ਆਨਲਾਈਨ ਲਿਆਓ",
  billProDesc: "ਜੋ ਦੁਕਾਨਾਂ ਹੋਰ ਚਾਹੁੰਦੀਆਂ ਹਨ",
  billCurrentBadge: "ਮੌਜੂਦਾ ਪਲਾਨ",
  billCurrentCta: "ਤੁਹਾਡਾ ਮੌਜੂਦਾ ਪਲਾਨ",
  billFreePrice: "₹0",
  billPerMonth: "/ਮਹੀਨਾ",
  navFind: "ਦੁਕਾਨਾਂ ਲੱਭੋ",
  navRegister: "ਦੁਕਾਨ ਰਜਿਸਟਰ ਕਰੋ",
  navAbout: "ਸਾਡੇ ਬਾਰੇ",
  landingSub:
    "ਇੱਕ ਵਾਰ ਬੋਲੋ — ਡਿਜੀਟਲ ਵਿਜ਼ਿਟਿੰਗ ਕਾਰਡ, ਕੈਟਾਲਾਗ, QR ਕੋਡ ਅਤੇ ਆਨਲਾਈਨ ਦੁਕਾਨ, ਸਭ ਇੱਕ ਮਿੰਟ ਤੋਂ ਘੱਟ ਵਿੱਚ ਤਿਆਰ।",
  findShopsCta: "ਆਪਣੇ ਨੇੜੇ ਦੀਆਂ ਦੁਕਾਨਾਂ ਲੱਭੋ",
  findShopsSub: "ਆਲੇ-ਦੁਆਲੇ ਦੀਆਂ ਲੋਕਲ ਦੁਕਾਨਾਂ ਵੇਖੋ",
  registerShopCta: "ਆਪਣੀ ਦੁਕਾਨ ਰਜਿਸਟਰ ਕਰੋ",
  registerShopSub: "ਇੱਕ ਵਾਰ ਬੋਲੋ — ਪੇਜ, QR ਅਤੇ ਕੈਟਾਲਾਗ ਤਿਆਰ",
  trustItems: [
    "ਹਿੰਦੀ",
    "ਪੰਜਾਬੀ",
    "English",
    "QR ਕੋਡ",
    "ਡਿਜੀਟਲ ਕੈਟਾਲਾਗ",
    "ਸ਼ੇਅਰ ਕਰਨ ਯੋਗ ਲਿੰਕ",
  ],
  demoTitle: "ਆਵਾਜ਼ ਤੋਂ ਦੁਕਾਨ — ਇੱਕ ਮਿੰਟ ਤੋਂ ਘੱਟ ਵਿੱਚ",
  demoYouSpeak: "ਤੁਸੀਂ ਬੋਲਦੇ ਹੋ",
  demoTranscript:
    "“ਮੇਰੀ ਦੁਕਾਨ ਸਿੰਘ ਇਲੈਕਟ੍ਰਾਨਿਕਸ ਹੈ, ਮੋਹਾਲੀ ਵਿੱਚ। ਸਾਡਾ ਫ਼ੋਨ ਨੰਬਰ 98765-43210 ਹੈ। ਅਸੀਂ ਫ਼ੋਨ ਰਿਪੇਅਰ ਕਰਦੇ ਹਾਂ ਅਤੇ ਕਵਰ ਵੇਚਦੇ ਹਾਂ। ਅਸੀਂ ਰਾਤ 8 ਵਜੇ ਤੱਕ ਖੁੱਲ੍ਹੇ ਰਹਿੰਦੇ ਹਾਂ।”",
  demoSteps: [
    "ਦੁਕਾਨ ਬਣ ਗਈ",
    "QR ਬਣ ਗਿਆ",
    "ਕੈਟਾਲਾਗ ਬਣ ਗਿਆ",
    "ਵਿਜ਼ਿਟਿੰਗ ਕਾਰਡ ਬਣ ਗਿਆ",
    "ਸ਼ੇਅਰ ਲਿੰਕ ਤਿਆਰ",
  ],
  aboutTitle: "BolDukaan ਬਾਰੇ",
  aboutBody:
    "BolDukaan ਛੋਟੀਆਂ ਦੁਕਾਨਾਂ ਨੂੰ ਸਿਰਫ਼ ਆਵਾਜ਼ ਨਾਲ ਆਨਲਾਈਨ ਲਿਆਉਂਦਾ ਹੈ। ਹਿੰਦੀ, ਪੰਜਾਬੀ ਜਾਂ English ਵਿੱਚ ਆਪਣੀ ਦੁਕਾਨ ਬਾਰੇ ਬੋਲੋ — ਪੇਜ, ਕੈਟਾਲਾਗ, QR ਕੋਡ ਅਤੇ ਸ਼ੇਅਰ ਲਿੰਕ ਅਸੀਂ ਬਣਾ ਦਿਆਂਗੇ। ਨਾ ਟਾਈਪਿੰਗ, ਨਾ ਐਪ, ਨਾ ਕੰਪਿਊਟਰ।",
  createGateTitle: "ਦੁਕਾਨ ਬਣਾਉਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ",
  createGateSub:
    "ਤੁਹਾਡੀ ਦੁਕਾਨ ਤੁਹਾਡੇ ਅਕਾਊਂਟ ਨਾਲ ਸੇਵ ਰਹਿੰਦੀ ਹੈ — ਕਦੇ ਵੀ, ਕਿਸੇ ਵੀ ਫ਼ੋਨ ਤੋਂ ਐਡਿਟ ਕਰੋ।",
  photosProgress: (n, max) => `${n}/${max} ਫ਼ੋਟੋ ਸ਼ਾਮਲ`,
  qrScanTitle: "ਤੁਹਾਡੀ ਦੁਕਾਨ ਦਾ QR — ਪ੍ਰਿੰਟ ਕਰਕੇ ਕਾਊਂਟਰ 'ਤੇ ਲਾਓ",
  posterDownload: "ਪੋਸਟਰ ਡਾਊਨਲੋਡ ਕਰੋ (PNG)",
  posterPrint: "ਪੋਸਟਰ ਪ੍ਰਿੰਟ ਕਰੋ / PDF ਸੇਵ ਕਰੋ",
  posterScan: "ਸਕੈਨ ਕਰੋ ਅਤੇ ਵੇਖੋ",
  waShareMessage: (args) =>
    waMessage(
      { hello: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਸਾਡੀ ਦੁਕਾਨ ਹੁਣ ਆਨਲਾਈਨ ਹੈ।", visit: "ਵੇਖੋ" },
      args,
    ),
  dashWelcome: "ਵਾਪਸੀ 'ਤੇ ਸੁਆਗਤ ਹੈ।",
  dashCreateNew: "+ ਨਵੀਂ ਦੁਕਾਨ ਬਣਾਓ",
  actShare: "ਸ਼ੇਅਰ",
  catAll: "ਸਾਰੀਆਂ",
  actCall: "ਕਾਲ",
  actDirections: "ਰਸਤਾ",
  filterLabel: "ਫਿਲਟਰ",
  clearFilters: "ਸਭ ਹਟਾਓ",
  badgeLocalBiz: "ਲੋਕਲ ਦੁਕਾਨ",
  badgePhoneAvail: "ਫ਼ੋਨ ਉਪਲਬਧ",
  badgeOnWhatsApp: "WhatsApp 'ਤੇ",
  actMarkClosed: "ਥੋੜ੍ਹੀ ਦੇਰ ਲਈ ਬੰਦ ਕਰੋ",
  actReopen: "ਮੁੜ ਖੋਲ੍ਹੋ",
  closedTemporarily: "ਥੋੜ੍ਹੀ ਦੇਰ ਲਈ ਬੰਦ ਹੈ",
};

const STRINGS: Record<UiLang, UiStrings> = { en, hi, pa };

export function t(lang: UiLang): UiStrings {
  return STRINGS[lang] ?? STRINGS.en;
}
