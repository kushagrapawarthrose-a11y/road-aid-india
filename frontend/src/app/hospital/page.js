"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Award, FileText, UserCheck, Key, LogOut, CheckSquare, Plus, Minus, PhoneCall } from 'lucide-react';
import io from 'socket.io-client';

export default function HospitalPage() {
  const [lang, setLang] = useState('EN');
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [token, setToken] = useState('');

  // Hospital Dashboard data
  const [incidents, setIncidents] = useState([]);
  
  const socketRef = useRef(null);

  useEffect(() => {
    setLang(localStorage.getItem('lang') || 'EN');
    const handleLangChange = () => {
      setLang(localStorage.getItem('lang') || 'EN');
    };
    window.addEventListener('languageChange', handleLangChange);

    // Read stored token if exists
    const storedToken = localStorage.getItem('hospital_token');
    const storedInfo = localStorage.getItem('hospital_info');
    if (storedToken && storedInfo) {
      setToken(storedToken);
      setHospitalInfo(JSON.parse(storedInfo));
      setIsLoggedIn(true);
    }

    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Socket listener for assigned incidents
  useEffect(() => {
    if (isLoggedIn && hospitalInfo) {
      fetchHospitalIncidents();
      
      socketRef.current = io('http://localhost:5000');
      
      socketRef.current.emit('join_hospital', hospitalInfo.id);

      // Play beep sound when new incident arrives for this hospital
      socketRef.current.on('incoming_incident', (incident) => {
        setIncidents((prev) => [incident, ...prev]);
        playEmergencySiren();
      });

      socketRef.current.on('incident_status_changed', (updated) => {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === updated.id ? updated : inc))
        );
      });
    }
  }, [isLoggedIn, hospitalInfo]);

  const playEmergencySiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Double pitch siren
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.frequency.setValueAtTime(960, audioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
      osc1.frequency.linearRampToValueAtTime(960, audioCtx.currentTime + 0.6);
      osc1.frequency.loop = true;

      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchHospitalIncidents = async () => {
    if (!hospitalInfo) return;
    try {
      const res = await fetch(`http://localhost:5000/api/incidents?hospitalId=${hospitalInfo.id}`);
      const data = await res.json();
      if (res.ok) {
        setIncidents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'HOSPITAL' }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('hospital_token', data.token);
        localStorage.setItem('hospital_info', JSON.stringify(data.user));
        setToken(data.token);
        
        // Fetch full hospital details from /api/hospitals/me
        const detailsRes = await fetch('http://localhost:5000/api/hospitals/me', {
          headers: { 'Authorization': `Bearer ${data.token}` },
        });
        const detailsData = await detailsRes.json();
        
        localStorage.setItem('hospital_info', JSON.stringify(detailsData));
        setHospitalInfo(detailsData);
        setIsLoggedIn(true);
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setAuthError('Connection failure. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_info');
    setIsLoggedIn(false);
    setHospitalInfo(null);
    setIncidents([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const updateIncidentStatus = async (incidentId, nextStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${incidentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchHospitalIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateResource = async (field, increment) => {
    const updatedVal = Math.max(0, (hospitalInfo[field] || 0) + increment);
    const updatedPayload = {
      ...hospitalInfo,
      [field]: updatedVal
    };

    try {
      const res = await fetch('http://localhost:5000/api/hospitals/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setHospitalInfo(data);
        localStorage.setItem('hospital_info', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Login
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-darkCard rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden p-8">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-teal-50 dark:bg-teal-950/20 text-emergency-teal rounded-full mb-3">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-2xl font-extrabold">Hospital Portal</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Authorized emergency room coordinates login.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <UserCheck size={12} /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emergency@aiims.edu"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Key size={12} /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emergency-teal transition"
              />
            </div>

            {authError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-emergency-red text-xs font-semibold p-3 rounded-xl">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emergency-teal hover:bg-teal-700 text-white font-extrabold text-sm py-3.5 rounded-xl transition shadow-lg shadow-teal-500/10"
            >
              {loading ? 'Verifying Authorization...' : 'SECURE SIGN IN'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-250 dark:border-gray-800 pt-4 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase mb-2">Test Accounts (Seeded)</span>
            <div className="text-[10px] text-gray-500 font-medium font-mono space-y-1">
              <div>AIIMS: <span className="text-gray-600 dark:text-gray-300">emergency@aiims.edu</span> / password123</div>
              <div>Safdarjung: <span className="text-gray-600 dark:text-gray-300">emergency@safdarjunghospital.gov.in</span> / password123</div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Active Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <span className="text-xs font-bold text-emergency-teal tracking-widest uppercase block mb-1">
            Connected Triage Station
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {hospitalInfo.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Address: {hospitalInfo.address} | Contact: {hospitalInfo.phone}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-emergency-red rounded-xl text-sm font-bold transition"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Triage feeds */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-emergency-red animate-pulse" /> Live Trauma Queue
          </h2>

          <div className="space-y-4">
            {incidents.length === 0 ? (
              <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-850 p-12 text-center text-gray-400 font-bold">
                No active accident dispatches assigned.
              </div>
            ) : (
              incidents.map((inc) => {
                const getActionsByStatus = (status) => {
                  switch (status) {
                    case 'REPORTED':
                      return (
                        <button
                          onClick={() => updateIncidentStatus(inc.id, 'NOTIFIED')}
                          className="w-full bg-emergency-teal text-white py-2.5 rounded-lg text-xs font-extrabold hover:bg-teal-700 transition"
                        >
                          ACCEPT EMERGENCY
                        </button>
                      );
                    case 'NOTIFIED':
                      return (
                        <button
                          onClick={() => updateIncidentStatus(inc.id, 'DISPATCHED')}
                          className="w-full bg-emergency-blue text-white py-2.5 rounded-lg text-xs font-extrabold hover:bg-blue-700 transition"
                        >
                          DISPATCH AMBULANCE
                        </button>
                      );
                    case 'DISPATCHED':
                      return (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateIncidentStatus(inc.id, 'ADMITTED')}
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-xs font-extrabold hover:bg-green-700 transition"
                          >
                            PATIENT ADMITTED
                          </button>
                          <button
                            onClick={() => updateIncidentStatus(inc.id, 'RESOLVED')}
                            className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                          >
                            RESOLVED
                          </button>
                        </div>
                      );
                    case 'ADMITTED':
                      return (
                        <button
                          onClick={() => updateIncidentStatus(inc.id, 'RESOLVED')}
                          className="w-full bg-slate-700 text-white py-2.5 rounded-lg text-xs font-extrabold hover:bg-slate-800 transition"
                        >
                          CLOSE INCIDENT
                        </button>
                      );
                    default:
                      return (
                        <span className="block text-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 py-2 rounded-lg">
                          Incident Resolved & Closed
                        </span>
                      );
                  }
                };

                return (
                  <div
                    key={inc.id}
                    className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 border-red-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 border-orange-200'
                          }`}>
                            {inc.severity}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ID: {inc.id.substring(0, 8)}...
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                          {inc.locationName}
                        </h3>
                      </div>
                      
                      <span className="text-xs text-gray-400 font-mono font-bold">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4">
                      {inc.description || 'No description added.'}
                    </p>

                    {/* Image if exists */}
                    {inc.photoUrl && (
                      <div className="mb-4">
                        <img 
                          src={`http://localhost:5000${inc.photoUrl}`} 
                          alt="Accident scene" 
                          className="max-h-48 rounded-xl object-cover border border-gray-200 dark:border-gray-800"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200 dark:border-gray-800 py-3 mb-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-400 block uppercase">Reporter</span>
                        <span className="font-bold">{inc.reporterName}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400 block uppercase">Phone</span>
                        {inc.reporterPhone ? (
                          <a href={`tel:${inc.reporterPhone}`} className="text-emergency-teal font-extrabold hover:underline flex items-center gap-1">
                            <PhoneCall size={12} /> {inc.reporterPhone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </div>
                    </div>

                    {/* Dashboard controls */}
                    <div>
                      {getActionsByStatus(inc.status)}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Resource manager */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Clinical Resources</h2>

          <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            
            {/* Beds */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Emergency Beds</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Available Capacity</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateResource('availableBeds', -1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xl font-extrabold text-emergency-teal w-8 text-center">
                  {hospitalInfo.availableBeds}
                </span>
                <button
                  onClick={() => updateResource('availableBeds', 1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Ventilators */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">ICU Ventilators</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Ready for Trauma</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateResource('ventilators', -1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xl font-extrabold text-emergency-orange w-8 text-center">
                  {hospitalInfo.ventilators}
                </span>
                <button
                  onClick={() => updateResource('ventilators', 1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Ambulances */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Ambulance Fleet</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">On Call Standby</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateResource('ambulances', -1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xl font-extrabold text-emergency-blue w-8 text-center">
                  {hospitalInfo.ambulances}
                </span>
                <button
                  onClick={() => updateResource('ambulances', 1)}
                  className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-150 dark:hover:bg-slate-800"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
