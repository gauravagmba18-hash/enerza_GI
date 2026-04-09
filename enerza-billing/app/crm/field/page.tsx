"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { MapContainerProps, MarkerProps, TileLayerProps, PopupProps } from 'react-leaflet';
import {
  Users,
  MapPin,
  ChevronRight,
  Search,
  Wrench,
  Clock,
  Phone
} from "lucide-react";
import { CRMStatusPill } from "@/components/crm/CRMStatusPill";

// Dynamic import for Leaflet (SSR fix) — typed to avoid @ts-ignore on props
const MapContainer = dynamic<MapContainerProps>(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic<TileLayerProps>(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic<MarkerProps>(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic<PopupProps>(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

type Technician = { id: number; name: string; status: string; pos: [number, number]; orders: number; phone: string };

export default function FieldTracking() {
  const [isClient, setIsClient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
    // Fix default Leaflet marker icons
    import('leaflet').then(mod => {
      delete (mod.Icon.Default.prototype as any)._getIconUrl;
      mod.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, [refreshKey]);

  const technicians: Technician[] = [
    { id: 1, name: "Manoj Kumar", status: "ON_SITE", pos: [23.0225, 72.5714], orders: 3, phone: "+91 99011 22334" },
    { id: 2, name: "Dinesh Patel", status: "EN_ROUTE", pos: [23.0338, 72.5850], orders: 2, phone: "+91 99011 55667" },
    { id: 3, name: "Sundar Rao", status: "ACTIVE", pos: [23.0120, 72.5100], orders: 4, phone: "+91 98722 00112" },
    { id: 4, name: "Ramesh Sharma", status: "OFF_DUTY", pos: [23.0450, 72.6000], orders: 0, phone: "+91 98233 44556" },
  ];

  if (!isClient) {
    return <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Loading Field Operations Map...</div>;
  }

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Field Operations Tracking</h1>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Live technician locations and service request dispatch board</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setRefreshKey(k => k + 1)} style={{ background: "var(--bg-lighter)", border: "1px solid var(--card-border)", padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Refresh Data
          </button>
          <button style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Dispatch WO
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, minHeight: 600 }}>
        {/* Left Sidebar: Technician List */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--card-border)" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input 
                placeholder="Search technicians..." 
                style={{ width: "100%", background: "var(--bg-lighter)", border: "1px solid var(--card-border)", borderRadius: 6, padding: "6px 10px 6px 30px", fontSize: 12 }} 
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {technicians.map(tech => (
              <div key={tech.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{tech.name}</div>
                  <CRMStatusPill status={tech.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Wrench size={10} /> {tech.orders} WOs</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={10} /> {tech.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Functional Map */}
        <div style={{ 
          background: "var(--card-bg)", 
          border: "1px solid var(--card-border)", 
          borderRadius: 12, 
          overflow: "hidden",
          position: "relative"
        }}>
          <MapContainer center={[23.0225, 72.5714]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {technicians.map(tech => (
              <Marker key={tech.id} position={tech.pos}>
                <Popup>
                  <div style={{ padding: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{tech.name}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Status: {tech.status}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Orders: {tech.orders}</div>
                    <div style={{ marginTop: "8px" }}>
                       <button style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", cursor: "pointer" }}>
                         Show Details
                       </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
