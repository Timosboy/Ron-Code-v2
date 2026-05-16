import { MapPin } from 'lucide-react';
import type { Property } from '../types';

interface SimulatedMapProps {
  properties: Property[];
  onPinClick: (property: Property) => void;
  selectedId?: string;
}

// Predefined city-like pin positions on the SVG map
const PIN_POSITIONS = [
  { x: 25, y: 35 },
  { x: 45, y: 55 },
  { x: 70, y: 30 },
  { x: 55, y: 70 },
  { x: 30, y: 65 },
  { x: 80, y: 55 },
  { x: 15, y: 50 },
  { x: 60, y: 40 },
];

export default function SimulatedMap({ properties, onPinClick, selectedId }: SimulatedMapProps) {
  return (
    <div className="relative w-full h-full min-h-0 bg-gradient-to-br from-violet-50 via-gray-50 to-violet-50 overflow-hidden">
      {/* Simulated street grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        {/* Horizontal streets */}
        {[20, 35, 50, 65, 80].map((y) => (
          <line key={`h-${y}`} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="8 4" />
        ))}
        {/* Vertical streets */}
        {[15, 30, 50, 70, 85].map((x) => (
          <line key={`v-${x}`} x1={`${x}%`} y1="0%" x2={`${x}%`} y2="100%" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="8 4" />
        ))}
        {/* Some diagonal avenues */}
        <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#7c3aed" strokeWidth="1" strokeDasharray="12 6" opacity="0.5" />
        <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="#7c3aed" strokeWidth="1" strokeDasharray="12 6" opacity="0.5" />
        {/* City blocks */}
        <rect x="20%" y="25%" width="15%" height="10%" rx="4" fill="#7c3aed" opacity="0.06" />
        <rect x="55%" y="45%" width="20%" height="12%" rx="4" fill="#7c3aed" opacity="0.06" />
        <rect x="35%" y="60%" width="12%" height="15%" rx="4" fill="#7c3aed" opacity="0.06" />
        <rect x="65%" y="20%" width="10%" height="8%" rx="4" fill="#7c3aed" opacity="0.08" />
      </svg>

      {/* Map label */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
        <span className="text-xs font-semibold text-violet-700">🗺️ Mapa Interactivo</span>
      </div>

      {/* Property pins */}
      {properties.map((prop, i) => {
        const pos = PIN_POSITIONS[i % PIN_POSITIONS.length];
        const isSelected = selectedId === prop.id;
        return (
          <button
            key={prop.id}
            onClick={() => onPinClick(prop)}
            className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 cursor-pointer group ${
              isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div className="relative">
              <MapPin
                className={`w-8 h-8 drop-shadow-lg transition-colors ${
                  isSelected ? 'text-violet-600 fill-violet-600' : 'text-violet-500 fill-violet-500'
                }`}
              />
              {/* Price bubble */}
              <div
                className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-violet-600 text-white scale-110'
                    : 'bg-white text-violet-700 opacity-0 group-hover:opacity-100'
                }`}
              >
                {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
              </div>
            </div>
          </button>
        );
      })}

      {/* Zoom controls (decorative) */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg shadow-sm flex items-center justify-center text-gray-500 text-sm font-bold hover:bg-white transition-colors">+</button>
        <button className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-lg shadow-sm flex items-center justify-center text-gray-500 text-sm font-bold hover:bg-white transition-colors">−</button>
      </div>
    </div>
  );
}
