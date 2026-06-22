"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet marker icon issues in React
const customIcon = (color) => {
  return new L.DivIcon({
    html: `<div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2" style="background-color: ${color};">
            <span class="w-2.5 h-2.5 rounded-full bg-white opacity-80 pulse-map-marker"></span>
           </div>`,
    className: 'custom-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [0, 0]
  });
};

const hospitalIcon = new L.DivIcon({
  html: `<div class="w-7 h-7 rounded-lg border border-teal-500 bg-white dark:bg-darkCard flex items-center justify-center shadow-md transform -translate-x-1/2 -translate-y-1/2 text-emergency-teal font-extrabold text-sm">
          🏥
         </div>`,
  className: 'hospital-marker-icon',
  iconSize: [28, 28],
  iconAnchor: [0, 0]
});

// Component to dynamically animate map panning
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14, { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({ incidents, hospitals, center, activeIncidentId }) {
  const defaultCenter = [28.5672, 77.2100]; // New Delhi

  return (
    <MapContainer
      center={center || defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {/* Hospital Markers */}
      {hospitals.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={hospitalIcon}
        >
          <Popup>
            <div className="text-slate-900 font-sans p-1">
              <h4 className="font-extrabold text-sm mb-1">{h.name}</h4>
              <p className="text-xs text-gray-500 mb-2">{h.address}</p>
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs">
                <div>
                  <span className="font-medium text-gray-400 block uppercase">Beds Available</span>
                  <span className="font-extrabold text-emergency-teal">{h.availableBeds} / {h.totalBeds}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-400 block uppercase">Ambulances</span>
                  <span className="font-extrabold text-emergency-blue">{h.ambulances} active</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Incident Markers */}
      {incidents.map((inc) => {
        let color = '#dc2626'; // Default Critical
        if (inc.severity === 'MODERATE') color = '#f97316';
        if (inc.severity === 'MINOR') color = '#eab308';
        if (inc.status === 'RESOLVED') color = '#22c55e';

        return (
          <Marker
            key={inc.id}
            position={[inc.latitude, inc.longitude]}
            icon={customIcon(color)}
          >
            <Popup>
              <div className="text-slate-900 font-sans p-1">
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block`} style={{ backgroundColor: color }}></span>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-gray-600">
                    {inc.severity} Emergency
                  </span>
                </div>
                <h4 className="font-extrabold text-sm mb-1">{inc.locationName}</h4>
                <p className="text-xs text-gray-500 mb-2 truncate max-w-[200px]">
                  {inc.description || 'No description provided.'}
                </p>
                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-400 block">Injured Count</span>
                    <span className="font-extrabold">{inc.injuredCount}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-400 block">Status</span>
                    <span className="font-extrabold text-emergency-blue uppercase">{inc.status}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Simulated dispatch route lines if an incident is active and has a hospital assigned */}
      {incidents.map((inc) => {
        if (inc.id === activeIncidentId && inc.hospital && inc.status === 'DISPATCHED') {
          return (
            <Polyline
              key={`route-${inc.id}`}
              positions={[
                [inc.hospital.latitude, inc.hospital.longitude],
                [inc.latitude, inc.longitude]
              ]}
              pathOptions={{
                color: '#2563eb',
                weight: 4,
                dashArray: '8, 8',
                lineCap: 'round',
                className: 'ambulance-route-line'
              }}
            />
          );
        }
        return null;
      })}
    </MapContainer>
  );
}
