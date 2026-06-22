"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle2, ShieldAlert, WifiOff, Volume2 } from 'lucide-react';
import io from 'socket.io-client';

export default function ReportPage() {
  const [lang, setLang] = useState('EN');
  
  // Form State
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [injuredCount, setInjuredCount] = useState(1);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // UI states
  const [locLoading, setLocLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [offlineCached, setOfflineCached] = useState(false);
  
  // Result state
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Report Received');

  const socketRef = useRef(null);

  useEffect(() => {
    setLang(localStorage.getItem('lang') || 'EN');
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'EN');
    };
    window.addEventListener('languageChange', handleLangChange);

    // Auto get location on load
    fetchGPS();

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Socket listener for incident updates
  useEffect(() => {
    if (submittedIncident) {
      socketRef.current = io('http://localhost:5000');
      
      socketRef.current.emit('join_incident', submittedIncident.id);
      
      socketRef.current.on('status_update', (updatedIncident) => {
        setSubmittedIncident(updatedIncident);
        
        // Translate state titles
        const stateLabels = {
          'REPORTED': 'Report Received',
          'NOTIFIED': 'Hospital Notified',
          'DISPATCHED': 'Ambulance Dispatched',
          'ADMITTED': 'Patient Reached Hospital',
          'RESOLVED': 'Emergency Resolved'
        };
        setSocketStatus(stateLabels[updatedIncident.status] || updatedIncident.status);
      });
    }
  }, [submittedIncident]);

  // GPS Trigger
  const fetchGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLon(position.coords.longitude.toFixed(6));
        setLocationName('GPS Coordinates Selected');
        setLocLoading(false);
      },
      () => {
        // Fallback to AIIMS Delhi
        setLat('28.5672');
        setLon('77.2100');
        setLocationName('AIIMS Delhi Environs (GPS Fallback)');
        setLocLoading(false);
      }
    );
  };

  // Image Upload and Simulated AI Analysis
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setAiAnalyzing(true);
    setAiAnalysisResult(null);

    // Call simulated AI analysis
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('http://localhost:5000/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAiAnalysisResult(data);
        setSeverity(data.severity);
      }
    } catch (err) {
      console.error('Image analysis failed, using fallback mock.');
      // Offline fallback mock
      setTimeout(() => {
        setAiAnalysisResult({
          severity: 'CRITICAL',
          confidence: '92.4%',
          visualFindings: ['Front bumper impact', 'Airbag deployment detected']
        });
        setSeverity('CRITICAL');
      }, 1000);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Speech Recognition (Web Speech API)
  const toggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = lang === 'EN' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setOfflineCached(false);

    const formData = new FormData();
    formData.append('reporterName', reporterName || 'Anonymous');
    formData.append('reporterPhone', reporterPhone || '');
    formData.append('latitude', lat);
    formData.append('longitude', lon);
    formData.append('locationName', locationName || 'Unknown Location');
    formData.append('severity', severity);
    formData.append('injuredCount', injuredCount);
    formData.append('description', description);
    if (imageFile) {
      formData.append('photo', imageFile);
    }

    try {
      const res = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedIncident(data);
      } else {
        throw new Error('Server returned error response');
      }
    } catch (err) {
      console.warn('Network issue detected. Caching report offline.');
      // Save report in local storage for offline synchronization
      const offlineReport = {
        id: 'OFFLINE-' + Math.round(Math.random() * 10000),
        reporterName: reporterName || 'Anonymous',
        reporterPhone: reporterPhone || '',
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        locationName: locationName || 'Cached Location (Offline)',
        severity,
        injuredCount,
        description: description + ' [Cached Offline]',
        status: 'REPORTED',
        createdAt: new Date().toISOString(),
        hospital: {
          name: 'Pending Sync...',
          phone: 'N/A'
        }
      };

      const cached = JSON.parse(localStorage.getItem('cached_reports') || '[]');
      cached.push(offlineReport);
      localStorage.setItem('cached_reports', JSON.stringify(cached));

      setOfflineCached(true);
      setSubmittedIncident(offlineReport);
    } finally {
      setSubmitting(false);
    }
  };

  const t = {
    EN: {
      title: "Report Accident Instantly",
      sub: "Enter details below to dispatch emergency vehicles. Responders will receive instant GPS notifications.",
      labelName: "Reporter Name",
      labelPhone: "Contact Number (Optional)",
      labelSeverity: "Accident Severity",
      labelInjured: "Number of Injured People",
      labelDesc: "Description (Press Mic to Speak)",
      labelLocName: "Location Details / Landmarks",
      labelCoords: "Coordinates",
      btnGPS: "Refetch GPS Location",
      btnSubmit: "SUBMIT EMERGENCY ALERT",
      submitting: "Alerting Nearest Hospitals...",
      severityMinor: "Minor (Bumper scrape, no injuries)",
      severityMod: "Moderate (Collision damage, mild injuries)",
      severityCrit: "Critical (Major damage, active trauma)",
      aiResult: "AI Image Verification Result",
      aiAnalyzing: "AI Model Analyzing Upload...",
      confidence: "Confidence",
      offlineAlert: "You are offline. Your report has been cached locally and will synchronize automatically when internet returns."
    },
    HI: {
      title: "दुर्घटना की तुरंत रिपोर्ट करें",
      sub: "आपातकालीन वाहनों को भेजने के लिए विवरण दर्ज करें। उत्तरदाताओं को त्वरित जीपीएस सूचनाएं मिलेंगी।",
      labelName: "रिपोर्टर का नाम",
      labelPhone: "संपर्क नंबर (वैकल्पिक)",
      labelSeverity: "दुर्घटना की गंभीरता",
      labelInjured: "घायल लोगों की संख्या",
      labelDesc: "विवरण (बोलने के लिए माइक दबाएं)",
      labelLocName: "स्थान का विवरण / लैंडमार्क",
      labelCoords: "निर्देशांक (Coordinates)",
      btnGPS: "जीपीएस लोकेशन दोबारा लें",
      btnSubmit: "आपातकालीन अलर्ट भेजें",
      submitting: "निकटतम अस्पतालों को सूचित किया जा रहा है...",
      severityMinor: "सामान्य (खरोंच, कोई चोट नहीं)",
      severityMod: "मध्यम (टक्कर, मामूली चोटें)",
      severityCrit: "गंभीर (बड़ा नुकसान, गंभीर चोटें)",
      aiResult: "एआई इमेज सत्यापन परिणाम",
      aiAnalyzing: "एआई इमेज का विश्लेषण किया जा रहा है...",
      confidence: "सत्यता स्तर",
      offlineAlert: "आप ऑफ़लाइन हैं। आपकी रिपोर्ट स्थानीय रूप से सुरक्षित कर ली गई है और इंटरनेट वापस आने पर स्वचालित रूप से सिंक हो जाएगी।"
    }
  }[lang];

  // Render submission success screen
  if (submittedIncident) {
    const isCritical = submittedIncident.severity === 'CRITICAL';
    const isOffline = offlineCached;

    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-darkCard rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden p-8 text-center">
          
          {isOffline ? (
            <div className="inline-flex p-4 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full mb-6">
              <WifiOff size={48} className="animate-pulse" />
            </div>
          ) : (
            <div className="inline-flex p-4 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full mb-6">
              <CheckCircle2 size={48} />
            </div>
          )}

          <h2 className="text-3xl font-extrabold mb-2">
            {isOffline ? 'Report Saved Offline' : 'EMERGENCY ALERT BROADCASTED'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono font-bold uppercase tracking-wider">
            Incident ID: {submittedIncident.id}
          </p>

          {isOffline && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 text-orange-700 dark:text-orange-400 text-sm font-medium mb-6">
              {t.offlineAlert}
            </div>
          )}

          {/* Smart Match details */}
          {!isOffline && submittedIncident.hospital && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-left mb-8 max-w-lg mx-auto">
              <h3 className="text-xs font-bold text-emergency-teal uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Nearest Hospital Assigned
              </h3>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {submittedIncident.hospital.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {submittedIncident.hospital.address}
              </p>
              
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Distance</span>
                  <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                    {submittedIncident.distance || '1.20'} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Est. Response Time</span>
                  <span className="text-lg font-extrabold text-emergency-blue">
                    {submittedIncident.travelTimeMinutes || '4'} mins
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Hospital Phone</span>
                  <a href={`tel:${submittedIncident.hospital.phone}`} className="text-sm font-bold text-emergency-teal hover:underline block truncate mt-1">
                    {submittedIncident.hospital.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Status Timeline */}
          {!isOffline && (
            <div className="mb-8 max-w-lg mx-auto">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">
                Live Dispatch Timeline
              </h3>
              <div className="relative">
                {/* Connector line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0"></div>

                <div className="relative z-10 flex justify-between">
                  {[
                    { label: 'Received', key: 'REPORTED', index: 0 },
                    { label: 'Notified', key: 'NOTIFIED', index: 1 },
                    { label: 'Dispatched', key: 'DISPATCHED', index: 2 },
                    { label: 'Admitted', key: 'ADMITTED', index: 3 },
                  ].map((step, idx) => {
                    const statusOrder = ['REPORTED', 'NOTIFIED', 'DISPATCHED', 'ADMITTED', 'RESOLVED'];
                    const currentIdx = statusOrder.indexOf(submittedIncident.status);
                    const isActive = currentIdx >= step.index;
                    const isCurrent = currentIdx === step.index;

                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all duration-300 ${
                            isActive
                              ? isCurrent
                                ? 'bg-emergency-red text-white scale-110 pulse-sos'
                                : 'bg-green-600 text-white'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {isActive && !isCurrent ? '✓' : idx + 1}
                        </div>
                        <span className="text-[10px] font-bold mt-2 text-gray-500 dark:text-gray-400 uppercase">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-emergency-red font-bold text-xs rounded-full border border-red-200 dark:border-red-900/50">
                  <span className="w-2 h-2 rounded-full bg-emergency-red animate-ping"></span>
                  Current: {socketStatus}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Link
              href="/dashboard"
              className="w-full px-6 py-3 bg-emergency-teal hover:bg-teal-700 text-white rounded-xl font-bold transition text-center shadow-lg shadow-teal-500/10 text-sm"
            >
              Open Live Emergency Map
            </Link>
            <button
              onClick={() => {
                setSubmittedIncident(null);
                setReporterName('');
                setReporterPhone('');
                setDescription('');
                setImageFile(null);
                setAiAnalysisResult(null);
                fetchGPS();
              }}
              className="w-full px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition text-sm"
            >
              Report Another Incident
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-darkCard rounded-3xl border border-gray-200 dark:border-gray-800/80 shadow-xl overflow-hidden">
        
        {/* Form Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <AlertCircle size={32} className="animate-bounce" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.title}
            </h1>
          </div>
          <p className="text-red-100 text-sm font-medium max-w-xl">
            {t.sub}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column (Inputs) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t.labelName}
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Prakhar Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t.labelPhone}
                </label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t.labelSeverity}
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emergency-teal transition font-bold"
                >
                  <option value="MINOR">{t.severityMinor}</option>
                  <option value="MODERATE">{t.severityMod}</option>
                  <option value="CRITICAL">{t.severityCrit}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  {t.labelInjured}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={injuredCount}
                  onChange={(e) => setInjuredCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
                />
              </div>
            </div>

            {/* Right Column (GPS & Photo Upload) */}
            <div className="space-y-4">
              
              {/* Geolocation Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t.labelCoords}
                  </span>
                  <button
                    type="button"
                    onClick={fetchGPS}
                    className="text-[10px] bg-emergency-teal text-white font-bold px-2 py-1 rounded hover:bg-teal-700 transition"
                  >
                    {locLoading ? 'Fetching...' : t.btnGPS}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm font-mono mb-2">
                  <div className="p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-darkCard rounded-lg">
                    Lat: {lat || '---'}
                  </div>
                  <div className="p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-darkCard rounded-lg">
                    Lon: {lon || '---'}
                  </div>
                </div>

                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t.labelLocName}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-850 bg-white dark:bg-darkCard text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emergency-teal transition"
                />
              </div>

              {/* Photo Upload with AI Scanner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl">
                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Accident Photo Upload
                </span>
                
                <div className="flex items-center space-x-3">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 dark:border-gray-700 hover:border-emergency-teal dark:hover:border-emergency-teal bg-white dark:bg-darkCard rounded-xl cursor-pointer transition">
                    <Camera size={24} className="text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-bold">
                      {imageFile ? imageFile.name : 'Select Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  
                  {aiAnalyzing && (
                    <div className="flex-1 flex flex-col items-center justify-center py-2 text-center text-xs text-emergency-teal">
                      <div className="w-5 h-5 border-2 border-emergency-teal border-t-transparent rounded-full animate-spin mb-1.5"></div>
                      <span className="font-bold">{t.aiAnalyzing}</span>
                    </div>
                  )}

                  {aiAnalysisResult && (
                    <div className="flex-1 bg-white dark:bg-darkCard border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl text-left">
                      <span className="text-[10px] font-extrabold text-emergency-orange block uppercase mb-1">
                        {t.aiResult}
                      </span>
                      <span className="text-xs font-bold block mb-0.5">
                        Predicted: <span className={aiAnalysisResult.severity === 'CRITICAL' ? 'text-emergency-red' : 'text-orange-500'}>{aiAnalysisResult.severity}</span>
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 block">
                        {t.confidence}: {aiAnalysisResult.confidence}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Description field with Mic */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t.labelDesc}
              </label>
              <button
                type="button"
                onClick={toggleSpeech}
                className={`p-2 rounded-full text-white transition ${
                  isRecording 
                    ? 'bg-emergency-red animate-pulse ring-4 ring-red-500/20' 
                    : 'bg-emergency-teal hover:bg-teal-700'
                }`}
                title="Speak to Dictate Description"
              >
                <Mic size={16} />
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide information on landmarks, number of cars involved, or injuries..."
              rows="3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
            ></textarea>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || locLoading}
            className="w-full bg-emergency-red hover:bg-red-700 disabled:bg-gray-400 text-white font-extrabold text-lg py-4 rounded-xl transition shadow-lg shadow-red-500/20 tracking-wider flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t.submitting}</span>
              </>
            ) : (
              <span>{t.btnSubmit}</span>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
