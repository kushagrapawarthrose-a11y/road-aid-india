"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, ShieldAlert, Activity, Wifi, WifiOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import io from 'socket.io-client';

// Load Leaflet Map Component dynamically to bypass Server Side Rendering crash
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-bold text-gray-500">
      Loading OpenStreetMap Interface...
    </div>
  )
});

export default function DashboardPage() {
  const [incidents, setIncidents] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [activeIncidentId, setActiveIncidentId] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.5800, 77.2300]); // Delhi NCR center
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  const socketRef = useRef(null);

  // Synthesize warning beep using Web Audio API (cross-browser compatible, no external files)
  const playAlertSound = (severity) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(severity === 'CRITICAL' ? 880 : 440, audioCtx.currentTime); // A5 or A4
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
      
      // If critical, trigger a double beep
      if (severity === 'CRITICAL') {
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(1000, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 200);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Fetch initial datasets
  const fetchData = async () => {
    try {
      const [incRes, hospRes] = await Promise.all([
        fetch('http://localhost:5000/api/incidents'),
        fetch('http://localhost:5000/api/hospitals')
      ]);
      const incData = await incRes.json();
      const hospData = await hospRes.json();
      
      if (incRes.ok) setIncidents(incData);
      if (hospRes.ok) setHospitals(hospData);
    } catch (e) {
      console.error("Failed to load initial map data", e);
    }
  };

  useEffect(() => {
    fetchData();
    checkOfflineReports();

    // Listen to global network online event to trigger auto-sync
    const handleOnline = () => {
      syncOfflineReports();
    };
    window.addEventListener('online', handleOnline);

    // Socket.io initialization
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_admin');

    socketRef.current.on('new_incident', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      playAlertSound(incident.severity);
      // Auto center on new reports
      setMapCenter([incident.latitude, incident.longitude]);
      setActiveIncidentId(incident.id);
    });

    socketRef.current.on('incident_status_changed', (updated) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === updated.id ? updated : inc))
      );
    });

    socketRef.current.on('hospital_updated', (updated) => {
      setHospitals((prev) =>
        prev.map((h) => (h.id === updated.id ? updated : h))
      );
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const checkOfflineReports = () => {
    const cached = JSON.parse(localStorage.getItem('cached_reports') || '[]');
    setOfflineCount(cached.length);
  };

  // Synchronize reports saved locally during outages
  const syncOfflineReports = async () => {
    const cached = JSON.parse(localStorage.getItem('cached_reports') || '[]');
    if (cached.length === 0) return;

    setSyncingOffline(true);
    let successCount = 0;

    for (const report of cached) {
      try {
        const res = await fetch('http://localhost:5000/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reporterName: report.reporterName,
            reporterPhone: report.reporterPhone,
            latitude: report.latitude,
            longitude: report.longitude,
            locationName: report.locationName,
            severity: report.severity,
            injuredCount: report.injuredCount,
            description: report.description,
          }),
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Failed to sync offline item:", err);
      }
    }

    if (successCount > 0) {
      // Remove successfully synced items
      const updatedCache = cached.slice(successCount);
      localStorage.setItem('cached_reports', JSON.stringify(updatedCache));
      setOfflineCount(updatedCache.length);
      fetchData();
      alert(`Synchronized ${successCount} offline report(s) successfully!`);
    }

    setSyncingOffline(false);
  };

  const getSeverityBadgeColor = (severity) => {
    if (severity === 'CRITICAL') return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40';
    if (severity === 'MODERATE') return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/40';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'REPORTED') return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (status === 'NOTIFIED') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
    if (status === 'DISPATCHED') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-300 dark:border-blue-800/40 animate-pulse';
    if (status === 'ADMITTED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Dashboard Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="text-emergency-teal animate-pulse" /> Live Incident Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Real-time emergency telemetry for Indian public responders.
            {hospitals.length > 0 && (
              <span className="ml-2 text-xs font-bold bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full">
                🏥 {hospitals.length} hospitals mapped
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border border-gray-250 dark:border-gray-800 transition ${
              soundEnabled 
                ? 'bg-emergency-teal/15 border-emergency-teal text-emergency-teal' 
                : 'bg-white dark:bg-darkCard text-gray-400'
            }`}
            title="Toggle Audio Notifications"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Sync indicator */}
          {offlineCount > 0 && (
            <button
              onClick={syncOfflineReports}
              disabled={syncingOffline}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition shadow-lg shadow-orange-500/20"
            >
              <RefreshCw size={14} className={syncingOffline ? 'animate-spin' : ''} />
              <span>Sync Offline ({offlineCount})</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
        
        {/* Left Column - Active Incident Feed */}
        <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-gray-250 dark:border-gray-800 bg-gray-50/55 dark:bg-slate-900/35">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Emergency Dispatch Feed ({incidents.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-150 dark:divide-gray-800/80">
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm font-semibold">
                No active incidents reported.
              </div>
            ) : (
              incidents.map((inc) => {
                const isActive = activeIncidentId === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => {
                      setActiveIncidentId(inc.id);
                      setMapCenter([inc.latitude, inc.longitude]);
                    }}
                    className={`p-4 cursor-pointer transition text-left ${
                      isActive 
                        ? 'bg-slate-50 dark:bg-slate-900 border-l-4 border-l-emergency-teal' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getSeverityBadgeColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono font-medium">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1 truncate">
                      {inc.locationName}
                    </h4>

                    {inc.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 font-medium">
                        {inc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase">
                        Injured: {inc.injuredCount}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getStatusBadgeColor(inc.status)}`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Columns - OSM Leaflet Map */}
        <div className="lg:col-span-2 bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-full p-2.5 relative">
          <MapComponent
            incidents={incidents}
            hospitals={hospitals}
            center={mapCenter}
            activeIncidentId={activeIncidentId}
          />
        </div>

      </div>

    </div>
  );
}
