"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, Heart, Shield, Clock, Phone, ArrowRight, Activity, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [lang, setLang] = useState('EN');

  useEffect(() => {
    setLang(localStorage.getItem('lang') || 'EN');
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'EN');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const content = {
    EN: {
      tagline: "Report Road Accidents Instantly.",
      taglineHighlight: "Save Lives Faster.",
      sub: "A state-of-the-art incident reporting & ambulance triage dashboard connecting Indian citizens with hospitals in critical seconds.",
      reportBtn: "Report an Accident",
      mapBtn: "Live Incident Map",
      helplineTitle: "National Emergency Contacts",
      statAccidents: "Accidents Reported",
      statLives: "Lives Assisted",
      statHospitals: "Partner Hospitals",
      statTime: "Avg. Dispatch Speed",
      howItWorks: "How RoadAid Works",
      howSubtitle: "A synchronized response ecosystem built to eliminate dispatch delays",
      step1: "1. Alert & GPS",
      step1Desc: "Citizens file a report with automatic GPS tracking, photos, and voice description.",
      step2: "2. Nearest Match",
      step2Desc: "Our routing system runs Haversine calculations to identify the closest active hospital.",
      step3: "3. Triage Alert",
      step3Desc: "Hospital triage rooms receive high-priority sound alerts and map-guided dispatch requests.",
      step4: "4. Live Tracking",
      step4Desc: "The reporter tracks the dispatched ambulance real-time from the incident details page.",
      callEmergency: "Emergency Helpline: Dial 112 or 102"
    },
    HI: {
      tagline: "सड़क दुर्घटना की तुरंत रिपोर्ट करें।",
      taglineHighlight: "तेजी से जीवन बचाएं।",
      sub: "एक अत्याधुनिक आपातकालीन रिपोर्टिंग और एम्बुलेंस प्रबंधन प्रणाली जो नागरिकों को महत्वपूर्ण सेकंडों में अस्पतालों से जोड़ती है।",
      reportBtn: "दुर्घटना की रिपोर्ट करें",
      mapBtn: "लाइव दुर्घटना मैप",
      helplineTitle: "राष्ट्रीय आपातकालीन नंबर",
      statAccidents: "रिपोर्ट की गई दुर्घटनाएं",
      statLives: "सहायता प्राप्त जीवन",
      statHospitals: "संबद्ध अस्पताल",
      statTime: "औसत डिस्पैच समय",
      howItWorks: "रोडएड कैसे काम करता है",
      howSubtitle: "डिस्पैच में होने वाली देरी को समाप्त करने के लिए बनाया गया तालमेल पारिस्थितिकी तंत्र",
      step1: "1. अलर्ट और जीपीएस",
      step1Desc: "नागरिक स्वचालित जीपीएस ट्रैकिंग, फोटो और वॉयस विवरण के साथ रिपोर्ट दर्ज करते हैं।",
      step2: "2. निकटतम अस्पताल चयन",
      step2Desc: "हमारा सिस्टम दूरी की गणना कर निकटतम सक्रिय अस्पताल की पहचान करता है।",
      step3: "3. तत्काल अधिसूचना",
      step3Desc: "अस्पताल के आपातकालीन कक्षों को ध्वनि चेतावनी और मानचित्र-निर्देशित डिस्पैच अनुरोध मिलते हैं।",
      step4: "4. लाइव ट्रैकिंग",
      step4Desc: "रिपोर्टर विवरण पृष्ठ से भेजी गई एम्बुलेंस को वास्तविक समय में ट्रैक करता है।",
      callEmergency: "आपातकालीन हेल्पलाइन: 112 या 102 डायल करें"
    }
  };

  const t = content[lang];

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30rem] h-[30rem] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[25rem] h-[25rem] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
        
        {/* Helpline Banner */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm">
            <Phone size={14} className="animate-pulse" />
            <span>{t.callEmergency}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {t.tagline} <span className="text-emergency-red block mt-2">{t.taglineHighlight}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-medium mb-10 max-w-2xl mx-auto">
            {t.sub}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/report"
              className="w-full sm:w-auto px-8 py-4 bg-emergency-red hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 text-lg transform transition hover:-translate-y-0.5"
            >
              <AlertOctagon size={22} className="animate-pulse" />
              <span>{t.reportBtn}</span>
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center space-x-2 text-lg transform transition hover:-translate-y-0.5"
            >
              <ArrowRight size={22} />
              <span>{t.mapBtn}</span>
            </Link>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20">
          {[
            { label: t.statAccidents, val: "1,240+", icon: AlertOctagon, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
            { label: t.statLives, val: "1,184", icon: Heart, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
            { label: t.statHospitals, val: "45", icon: Shield, color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20" },
            { label: t.statTime, val: "8.5 m", icon: Clock, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-gray-800/80 shadow-sm flex flex-col justify-between transition hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] text-green-500 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full font-mono">
                    +99.4%
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight mb-1">{item.val}</h3>
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* How It Works Section */}
        <div className="bg-white dark:bg-darkCard rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.howItWorks}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
              {t.howSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mb-4 text-emergency-red text-xl font-bold border border-red-200 dark:border-red-900">
                1
              </div>
              <h4 className="font-bold text-lg mb-2">{t.step1}</h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/50 rounded-full flex items-center justify-center mb-4 text-emergency-orange text-xl font-bold border border-orange-200 dark:border-orange-900/50">
                2
              </div>
              <h4 className="font-bold text-lg mb-2">{t.step2}</h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center mb-4 text-emergency-blue text-xl font-bold border border-blue-200 dark:border-blue-900/50">
                3
              </div>
              <h4 className="font-bold text-lg mb-2">{t.step3}</h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t.step3Desc}
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mb-4 text-emergency-green text-xl font-bold border border-green-200 dark:border-green-900/50">
                4
              </div>
              <h4 className="font-bold text-lg mb-2">{t.step4}</h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t.step4Desc}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
