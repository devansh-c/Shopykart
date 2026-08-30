
'use client';

import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  useMapEvents, 
  CircleMarker 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Eraser, Trash2 } from 'lucide-react';

type ZoneMapDrawingProps = {
  points: [number, number][];
  onUpdate: (points: [number, number][]) => void;
};

// Internal component to handle map click events
function MapClickHandler({ onClick }: { onClick: (latlng: any) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function ZoneMapDrawing({ points, onUpdate }: ZoneMapDrawingProps) {
  const handleMapClick = (latlng: any) => {
    onUpdate([...points, [latlng.lat, latlng.lng]]);
  };

  const clearLastPoint = () => {
    onUpdate(points.slice(0, -1));
  };

  const clearAllPoints = () => {
    onUpdate([]);
  };

  return (
    <div className="h-full w-full relative">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); clearLastPoint(); }}
          className="bg-white p-2.5 rounded-xl shadow-lg border border-border text-amber-600 hover:bg-amber-50 active:scale-95 transition-all"
          title="Undo Last Point"
        >
          <Eraser className="h-4 w-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); clearAllPoints(); }}
          className="bg-white p-2.5 rounded-xl shadow-lg border border-border text-red-600 hover:bg-red-50 active:scale-95 transition-all"
          title="Clear All"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <MapContainer 
        center={[25.2443, 79.0838]} // Ranipur area center
        zoom={14} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Truly Free OpenStreetMap Tiles - No Watermark */}
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        <MapClickHandler onClick={handleMapClick} />

        {/* Render Points (Dots) for immediate feedback */}
        {points.map((point, i) => (
          <CircleMarker 
            key={i}
            center={point} 
            radius={5} 
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1 }} 
          />
        ))}

        {/* Render Polygon once we have 3 or more points */}
        {points.length >= 3 && (
          <Polygon 
            positions={points} 
            pathOptions={{ 
              color: '#EF4444', 
              fillColor: '#EF4444', 
              fillOpacity: 0.3,
              weight: 3
            }} 
          />
        )}
      </MapContainer>

      {/* Guide Overlay */}
      {points.length < 3 && (
         <div className="absolute inset-0 z-[10] bg-black/40 flex items-center justify-center pointer-events-none">
            <p className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/20">
               Tap {3 - points.length} more spots to mark area
            </p>
         </div>
      )}
    </div>
  );
}
