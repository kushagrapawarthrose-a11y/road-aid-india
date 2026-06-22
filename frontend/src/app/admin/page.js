"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Key, UserCheck, Download, Trash, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  // Admin stats
  const [analytics, setAnalytics] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // Read stored token if exists
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAdminData();
    }
  }, [isLoggedIn]);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, hospRes, incRes] = await Promise.all([
        fetch('http://localhost:5000/api/analytics'),
        fetch('http://localhost:5000/api/hospitals'),
        fetch('http://localhost:5000/api/incidents')
      ]);

      const analyticsData = await analyticsRes.json();
      const hospData = await hospRes.json();
      const incData = await incRes.json();

      if (analyticsRes.ok) setAnalytics(analyticsData);
      if (hospRes.ok) setHospitals(hospData);
      if (incRes.ok) setIncidents(incData);
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
        body: JSON.stringify({ email, password, role: 'ADMIN' }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
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
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setAnalytics(null);
    setHospitals([]);
    setIncidents([]);
  };

  // Client-side CSV Download builder
  const downloadCSVReport = () => {
    if (incidents.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Incident ID,Reporter,Phone,Location,Severity,Injured Count,Status,Assigned Hospital,Date\n";

    incidents.forEach((inc) => {
      const row = [
        inc.id,
        inc.reporterName,
        inc.reporterPhone || "N/A",
        `"${inc.locationName.replace(/"/g, '""')}"`,
        inc.severity,
        inc.injuredCount,
        inc.status,
        inc.hospital ? `"${inc.hospital.name.replace(/"/g, '""')}"` : "None",
        new Date(inc.createdAt).toLocaleString()
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roadaid_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-darkCard rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden p-8">
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-red-50 dark:bg-red-950/20 text-emergency-red rounded-full mb-3">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-2xl font-extrabold">Administrator Login</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Authorized personnel only. Central coordination access.
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
                placeholder="admin@roadaid.in"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emergency-red transition"
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emergency-red transition"
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
              className="w-full bg-emergency-red hover:bg-red-700 text-white font-extrabold text-sm py-3.5 rounded-xl transition shadow-lg shadow-red-500/10"
            >
              {loading ? 'Verifying Credentials...' : 'SECURE SIGN IN'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-250 dark:border-gray-800 pt-4 text-center">
            <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Default Seed Account</span>
            <div className="text-[10px] text-gray-500 font-mono">
              admin@roadaid.in / admin123
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <span className="text-xs font-bold text-emergency-red tracking-widest uppercase block mb-1">
            Central Command Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            RoadAid India Administration
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            National logistics dispatch & hospital status aggregator.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchAdminData}
            className="p-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={downloadCSVReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emergency-teal hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-teal-500/10"
          >
            <Download size={16} /> Download CSV
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-emergency-red rounded-xl text-sm font-bold transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Accidents Registered</span>
            <h3 className="text-3xl font-extrabold">{analytics.totalIncidents}</h3>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Critical Traumas</span>
            <h3 className="text-3xl font-extrabold text-emergency-red">{analytics.bySeverity.CRITICAL}</h3>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Avg response speed</span>
            <h3 className="text-3xl font-extrabold text-emergency-blue">{analytics.avgResponseTimeMinutes} mins</h3>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Hospitals Connected</span>
            <h3 className="text-3xl font-extrabold text-emergency-teal">{hospitals.length}</h3>
          </div>
        </div>
      )}

      {/* Severity charts & zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Severity Breakdown graph */}
        <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400">
            Severity Breakdown
          </h3>
          {analytics && (
            <div className="space-y-4">
              {[
                { name: 'Critical Trauma', count: analytics.bySeverity.CRITICAL, color: 'bg-emergency-red', percent: analytics.totalIncidents ? (analytics.bySeverity.CRITICAL / analytics.totalIncidents * 100).toFixed(0) : 0 },
                { name: 'Moderate Collision', count: analytics.bySeverity.MODERATE, color: 'bg-emergency-orange', percent: analytics.totalIncidents ? (analytics.bySeverity.MODERATE / analytics.totalIncidents * 100).toFixed(0) : 0 },
                { name: 'Minor Scrape', count: analytics.bySeverity.MINOR, color: 'bg-emergency-yellow', percent: analytics.totalIncidents ? (analytics.bySeverity.MINOR / analytics.totalIncidents * 100).toFixed(0) : 0 }
              ].map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{c.name}</span>
                    <span className="font-mono">{c.count} ({c.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                    <div className={`${c.color} h-full rounded-full transition-all duration-500`} style={{ width: `${c.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch response-time target meters */}
        <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400">
            Dispatch Targets met
          </h3>
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span>Under 10 Mins (Golden Hour)</span>
              <span className="text-green-500 font-bold">92% Met</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span>Under 15 Mins</span>
              <span className="text-green-500 font-bold">98% Met</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: '98%' }}></div>
            </div>
          </div>
        </div>

        {/* Zones breakdown */}
        <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-gray-500 dark:text-gray-400">
            High Accident Zones (NCR)
          </h3>
          <div className="space-y-2 text-xs font-medium">
            <div className="flex justify-between border-b border-gray-150 dark:border-gray-850 pb-2">
              <span>Ring Road (Near Safdarjung)</span>
              <span className="text-emergency-red font-bold font-mono">High Density</span>
            </div>
            <div className="flex justify-between border-b border-gray-150 dark:border-gray-850 pb-2">
              <span>Saket Press Enclave Rd</span>
              <span className="text-emergency-orange font-bold font-mono">Medium Density</span>
            </div>
            <div className="flex justify-between pb-2">
              <span>Vasant Kunj Sect B</span>
              <span className="text-emergency-yellow font-bold font-mono">Low Density</span>
            </div>
          </div>
        </div>

      </div>

      {/* Connected Hospitals table */}
      <div className="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/40">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Connected Healthcare Institutions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-900/60 font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="p-4">Hospital Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Available Beds</th>
                <th className="p-4">Ventilators</th>
                <th className="p-4">Ambulances</th>
                <th className="p-4">Contact Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-850">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">{h.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      h.status === 'ACTIVE' ? 'bg-green-150 text-green-700 dark:bg-green-950/20' : 'bg-red-150 text-red-700 dark:bg-red-950/20'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-350">{h.availableBeds} / {h.totalBeds}</td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-350">{h.ventilators}</td>
                  <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-350">{h.ambulances}</td>
                  <td className="p-4 font-mono font-semibold text-emergency-teal">{h.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
