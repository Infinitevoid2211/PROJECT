export const LANGS = [
  { code: "en", label: "English", native: "English" },
  { code: "lus", label: "Mizo", native: "Mizo Ṭawng" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
];

const dict = {
  appName: { en: "BHU-RAKSHAK AI", lus: "BHU-RAKSHAK AI", hi: "भू-रक्षक AI", bn: "ভূ-রক্ষক AI" },
  subtitle: {
    en: "AI Landslide Early Warning · Aizawl, Mizoram",
    lus: "AI Lei Inbo Hriattirna · Aizawl, Mizoram",
    hi: "एआई भूस्खलन पूर्व चेतावनी · आइज़ोल, मिज़ोरम",
    bn: "এআই ভূমিধস আগাম সতর্কতা · আইজল, মিজোরাম",
  },
  peopleAtRisk: { en: "People in risk zones", lus: "Hlauhawm khawvela mi", hi: "जोखिम क्षेत्र में लोग", bn: "ঝুঁকিপূর্ণ এলাকায় মানুষ" },
  checkin: { en: "Emergency Check-In", lus: "Inentirna", hi: "आपातकालीन चेक-इन", bn: "জরুরি চেক-ইন" },
  imSafe: { en: "I am safe", lus: "Ka him", hi: "मैं सुरक्षित हूँ", bn: "আমি নিরাপদ" },
  needEvac: { en: "Need evacuation", lus: "Pemkhawh a ngai", hi: "निकासी चाहिए", bn: "উদ্ধার প্রয়োজন" },
  triggerWarning: { en: "Dispatch Early Warning", lus: "Hriattirna thawn", hi: "पूर्व चेतावनी भेजें", bn: "আগাম সতর্কতা পাঠান" },
};

export const t = (key, lang) => (dict[key] && (dict[key][lang] || dict[key].en)) || key;
