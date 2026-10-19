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
  tagline: {
    en: "Real-time geotechnical disaster monitoring, geospatial intelligence and emergency response for Aizawl District.",
    lus: "Aizawl District tana lei tlahawm laka invenna leh chhawmdawlna AI platform.",
    hi: "आइज़ोल जिले के लिए वास्तविक समय भू-तकनीकी आपदा निगरानी और आपातकालीन प्रतिक्रिया।",
    bn: "আইজল জেলার জন্য বাস্তব-সময়ের ভূ-প্রযুক্তিগত দুর্যোগ পর্যবেক্ষণ এবং জরুরি প্রতিক্রিয়া।",
  },
  openGis: { en: "Open Live GIS", lus: "3D GIS Enna", hi: "लाइव जीआईएस देखें", bn: "লাইভ জিআইএস দেখুন" },
  peopleAtRisk: { en: "People in risk zones", lus: "Hlauhawm hmuna mi cheng", hi: "जोखिम क्षेत्र में लोग", bn: "ঝুঁকিপূর্ণ এলাকায় মানুষ" },
  checkin: { en: "Emergency Check-In", lus: "Hriattirna / Inentirna", hi: "आपातकालीन चेक-इन", bn: "জরুরি চেক-ইন" },
  imSafe: { en: "I am safe", lus: "Ka him e", hi: "मैं सुरक्षित हूँ", bn: "আমি নিরাপদ" },
  needEvac: { en: "Need evacuation", lus: "Chhanhim ka ngai", hi: "निकासी चाहिए", bn: "উদ্ধার প্রয়োজন" },
  triggerWarning: { en: "Dispatch Early Warning", lus: "Hriattirna thawn rawh", hi: "पूर्व चेतावनी भेजें", bn: "আগাম সতর্কতা পাঠান" },
  tabGis: { en: "3D Live GIS & InSAR", lus: "3D GIS & InSAR", hi: "3D लाइव जीआईएस व इनसार", bn: "3D লাইভ জিআইএস ও ইনসার" },
  tabSensor: { en: "Sensor & Terzaghi Fs", lus: "Sensor & Terzaghi Fs", hi: "सेंसर व भू-स्थिरता Fs", bn: "সেন্সর ও ভূ-স্থিতি Fs" },
  tabReport: { en: "Citizen Crack AI", lus: "Lei Khi AI Enna", hi: "नागरिक दरार विश्लेषण AI", bn: "নাগরিক ফাটল বিশ্লেষণ AI" },
  tabEvac: { en: "Evacuation & Routing", lus: "Inthiarfihlimna Kawng", hi: "निकासी एवं सुरक्षित मार्ग", bn: "উদ্ধার ও নিরাপদ রুট" },
  tabHistory: { en: "History & ML Model", lus: "Chanchin & ML Model", hi: "इतिहास व एमएल मॉडल", bn: "ইতিহাস ও এমএল মডেল" },
  tabAi: { en: "AI Assistant", lus: "AI Ṭanpuitu", hi: "एआई सहायक", bn: "এআই সহকারী" },
  safeShelter: { en: "Designated Safe Shelter", lus: "Himna Hmun", hi: "नामित सुरक्षित आश्रय", bn: "নির্ধারিত নিরাপদ আশ্রয়" },
  avoidRoad: { en: "Hazardous Corridor", lus: "Kawng Hlauhawm", hi: "खतरनाक सड़क गलियारा", bn: "ঝুঁকিপূর্ণ রাস্তা" },
};

export const t = (key, lang) => (dict[key] && (dict[key][lang] || dict[key].en)) || key;
