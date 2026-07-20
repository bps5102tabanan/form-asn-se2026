'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

interface MapPickerProps {
  savedLat: string;
  savedLng: string;
  onLocationSelect: (lat: string, lng: string) => void;
}

// Komponen Sub-Child untuk mendengarkan event KLIK di peta
function LocationClickHandler({ setPosition }: { setPosition: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Komponen Sub-Child untuk mengontrol pergerakan kamera peta mengikuti koordinat tersimpan
function MapViewUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ savedLat, savedLng, onLocationSelect }: MapPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const markerRef = useRef<any>(null);

  // Inisialisasi Posisi: Utamakan data yang sudah pernah di-pin/tersimpan di form
  useEffect(() => {
    if (savedLat && savedLng && savedLat !== '-' && savedLng !== '-') {
      setPosition({ lat: parseFloat(savedLat), lng: parseFloat(savedLng) });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setPosition({ lat: -8.4513, lng: 115.0768 }); // Fallback Tabanan
        }
      );
    } else {
      setPosition({ lat: -8.4513, lng: 115.0768 });
    }
  }, [savedLat, savedLng]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition({ lat, lng });
        }
      },
    }),
    []
  );

  if (!position) return <p className="text-sm font-medium text-[#372902] animate-pulse">Memuat Peta...</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full rounded-lg border-2 border-[#372902]/20 overflow-hidden z-0 relative shadow-inner">
        <MapContainer center={position} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <LocationClickHandler setPosition={setPosition} />
          <MapViewUpdater center={position} />
          
          <Marker 
            draggable={true} 
            eventHandlers={eventHandlers} 
            position={position} 
            ref={markerRef}
          >
            <Popup className="font-semibold text-center">
              Geser pin atau klik area peta <br/> untuk memindahkan titik!
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      <button 
        type="button" 
        onClick={() => onLocationSelect(position.lat.toString(), position.lng.toString())}
        className="w-full bg-[#372902] text-[#FFF9E6] py-2.5 px-4 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-md focus:outline-none"
      >
        Tandai Titik Lokasi Ini
      </button>
    </div>
  );
}