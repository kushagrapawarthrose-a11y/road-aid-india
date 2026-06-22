"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Map, AlertTriangle, User, Sun, Moon, Activity, Globe, Info } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('EN');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, sending, success
  const [sosIncidentId, setSosIncidentId] = useState('');

  // Initialize theme
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    const savedLang = localStorage.getItem('lang') || 'EN';
    setLang(savedLang);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'EN' ? 'HI' : 'EN';
    setLang(nextLang);
    localStorage.setItem('lang', nextLang);
    window.dispatchEvent(new Event('languageChange'));
  };

  // One-click SOS emergency submission
  const triggerSOS = async () => {
    setSosStatus('sending');
    
    // Auto detect location
    let lat = 28.5672; // Default AIIMS Delhi
    let lon = 77.2100;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await sendSOSRequest(position.coords.latitude, position.coords.longitude);
        },
        async () => {
          // Fallback to default
          await sendSOSRequest(lat, lon);
        }
      );
    } else {
      await sendSOSRequest(lat, lon);
    }
  };

  const sendSOSRequest = async (lat, lon) => {
    try {
      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: 'Quick SOS User',
          reporterPhone: '112 Helpline',
          latitude: lat,
          longitude: lon,
          locationName: 'GPS Triggered SOS Location',
          severity: 'CRITICAL',
          injuredCount: 1,
          description: 'Emergency one-click SOS button pressed by citizen.',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSosIncidentId(data.id);
        setSosStatus('success');
      } else {
        setSosStatus('error');
      }
    } catch (err) {
      setSosStatus('error');
    }
  };

  const menuItems = [
    { name: lang === 'EN' ? 'Home' : 'मुख्य पृष्ठ', path: '/', icon: Info },
    { name: lang === 'EN' ? 'Report Accident' : 'दुर्घटना रिपोर्ट', path: '/report', icon: AlertTriangle },
    { name: lang === 'EN' ? 'Live Map' : 'लाइव मैप', path: '/dashboard', icon: Map },
    { name: lang === 'EN' ? 'Hospital Portal' : 'अस्पताल पोर्टल', path: '/hospital', icon: Shield },
    { name: lang === 'EN' ? 'Admin Board' : 'एडमिन बोर्ड', path: '/admin', icon: Activity },
  ];

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-darkBg/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emergency-red text-white shadow-lg">
                <span className="text-xl font-bold font-serif">+</span>
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-200"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Road<span className="text-emergency-red">Aid</span>
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-wider -mt-1 uppercase">
                  India Emergency
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-1 lg:space-x-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-emergency-teal/10 text-emergency-teal dark:text-teal-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Utility buttons */}
            <div className="flex items-center space-x-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                title="Switch Language / भाषा बदलें"
              >
                <Globe size={16} />
                <span>{lang}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* SOS Emergency button */}
              <button
                onClick={() => {
                  setShowSOSModal(true);
                  setSosStatus('idle');
                }}
                className="pulse-sos flex items-center space-x-1.5 bg-emergency-red text-white px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase transition hover:bg-red-700 hover:scale-105 active:scale-95"
              >
                <AlertTriangle size={16} className="animate-bounce" />
                <span>SOS</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-darkCard rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 dark:border-red-950/30 transition-colors">
            <div className="flex items-center space-x-3 text-emergency-red mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-full animate-pulse">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {lang === 'EN' ? 'Instant SOS Trigger' : 'त्वरित आपातकालीन बटन'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang === 'EN' ? 'Sends exact GPS coordinates to nearest hospitals' : 'निकटतम अस्पतालों को आपके स्थान की जानकारी भेजी जाएगी'}
                </p>
              </div>
            </div>

            {sosStatus === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {lang === 'EN' 
                    ? 'Confirming will report a CRITICAL road emergency at your current location. Hospital triage services and 112 emergency services will be immediately notified.' 
                    : 'पुष्टि करने पर आपके वर्तमान स्थान पर एक गंभीर सड़क दुर्घटना की रिपोर्ट दर्ज हो जाएगी। निकटतम अस्पताल और आपातकालीन सेवाओं (112) को तुरंत सूचित किया जाएगा।'}
                </p>
                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    {lang === 'EN' ? 'Cancel' : 'रद्द करें'}
                  </button>
                  <button
                    onClick={triggerSOS}
                    className="flex-1 px-4 py-2 bg-emergency-red hover:bg-red-700 text-white rounded-lg font-bold transition shadow-lg shadow-red-500/20"
                  >
                    {lang === 'EN' ? 'CONFIRM SOS' : 'पुष्टि करें'}
                  </button>
                </div>
              </div>
            )}

            {sosStatus === 'sending' && (
              <div className="flex flex-col items-center py-6">
                <div className="w-12 h-12 border-4 border-emergency-red border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {lang === 'EN' ? 'Accessing GPS & Alerting Responders...' : 'जीपीएस लोकेशन प्राप्त कर सूचना भेजी जा रही है...'}
                </p>
              </div>
            )}

            {sosStatus === 'success' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 mb-4 font-bold text-xl">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'EN' ? 'SOS Broadcast Complete!' : 'आपातकालीन अलर्ट भेज दिया गया है!'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {lang === 'EN' ? `Incident ID: ${sosIncidentId}` : `दुर्घटना आईडी: ${sosIncidentId}`}
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/dashboard?id=${sosIncidentId}`}
                    onClick={() => setShowSOSModal(false)}
                    className="w-full px-4 py-2 bg-emergency-teal hover:bg-teal-700 text-white rounded-lg font-medium transition text-center text-sm"
                  >
                    {lang === 'EN' ? 'Track Live Dispatch' : 'लाइव डिस्पैच ट्रैक करें'}
                  </Link>
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition"
                  >
                    {lang === 'EN' ? 'Close' : 'बंद करें'}
                  </button>
                </div>
              </div>
            )}

            {sosStatus === 'error' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-emergency-red mb-4 font-bold text-xl">
                  !
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'EN' ? 'SOS Broadcast Failed' : 'अलर्ट भेजना असफल रहा'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {lang === 'EN' ? 'Could not connect to emergency servers. Please dial 112 directly.' : 'सर्वर से कनेक्ट नहीं हो सका। कृपया सीधे 112 डायल करें।'}
                </p>
                <button
                  onClick={() => setSosStatus('idle')}
                  className="w-full px-4 py-2 bg-emergency-red hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  {lang === 'EN' ? 'Try Again' : 'पुनः प्रयास करें'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
