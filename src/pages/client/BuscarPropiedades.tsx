import { useEffect, useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { useLeadStore } from '../../store/leadStore';
import { TRANSACTION_LABELS } from '../../types';
import type { Property, TransactionType } from '../../types';
import BottomSheet from '../../components/BottomSheet';
import LeadFormModal from '../../components/LeadFormModal';
import PanoramaViewer from '../../components/PanoramaViewer';

const COCHABAMBA_CENTER = { lat: -17.3935, lng: -66.1570 };
const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function BuscarPropiedades() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties } = usePropertyStore();
  const { createLead } = useLeadStore();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchProperties({ published_to_map: 'true' });
    const interval = setInterval(() => {
      fetchProperties({ published_to_map: 'true' });
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchProperties]);

  const filteredProperties = properties.filter((p) => {
    if (p.stage_crm1 !== 4 || !p.published_to_map) return false;
    if (filter !== 'all' && p.type !== filter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Assign pseudo-random coordinates around Cochabamba for properties without lat/lng
  const propertiesWithCoords = useMemo(() => {
    return filteredProperties.map((prop, index) => {
      // Deterministic offset based on index so they don't jump around on re-renders
      const latOffset = (index % 5 - 2) * 0.01;
      const lngOffset = (Math.floor(index / 5) % 5 - 2) * 0.01;
      return {
        ...prop,
        lat: prop.lat || COCHABAMBA_CENTER.lat + latOffset,
        lng: prop.lng || COCHABAMBA_CENTER.lng + lngOffset,
      };
    });
  }, [filteredProperties]);

  const handleSubmitInterest = async (data: {
    buyer_name: string;
    buyer_phone: string;
    buyer_email: string;
  }) => {
    if (!selectedProperty || !user) return;
    await createLead({
      property_id: selectedProperty.id,
      buyer_id: user.id,
      ...data,
    });
    setSelectedProperty(null);
  };

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full pb-16 overflow-hidden bg-gray-100">
      {/* Fullscreen Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={COCHABAMBA_CENTER}
        zoom={13}
        options={MAP_OPTIONS}
        onClick={() => setSelectedProperty(null)}
      >
        {propertiesWithCoords.map((prop) => {
          const isSelected = selectedProperty?.id === prop.id;
          const formattedPrice = prop.price >= 1000 
            ? `${(prop.price / 1000).toFixed(0)}k` 
            : prop.price.toString();
          const labelText = `${prop.currency === 'USD' ? '$' : 'Bs'}${formattedPrice}`;

          return (
            <Marker
              key={prop.id}
              position={{ lat: prop.lat, lng: prop.lng }}
              onClick={() => setSelectedProperty(prop)}
              label={{
                text: labelText,
                color: isSelected ? '#F9F9F6' : '#4A5D7E',
                fontWeight: '800',
                fontSize: '12px',
                className: 'mt-5 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-gray-200 shadow-sm'
              }}
              icon={{
                url: isSelected 
                  ? 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
                  : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />
          );
        })}
      </GoogleMap>

      {/* Floating Panel (Apple Maps Style) */}
      <div className="absolute top-4 left-4 sm:w-96 w-[calc(100%-2rem)] max-h-[calc(100dvh-6rem)] flex flex-col bg-white/70 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden z-10 pointer-events-auto border border-white/50">
        {/* Search & Filters Header */}
        <div className="p-5 border-b border-gray-200/50 bg-white/50">
          <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Buscar Propiedades</h1>
          
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ubicación o nombre..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 border border-gray-200/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'venta', 'alquiler', 'anticretico'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === f
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200/50'
                }`}
              >
                {f === 'all' ? 'Todos' : TRANSACTION_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Property List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">No se encontraron propiedades en esta área.</p>
              <p className="text-xs text-gray-400 mt-1">Intenta ajustando tus filtros de búsqueda.</p>
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer ${
                  selectedProperty?.id === prop.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-white/60 border border-transparent hover:bg-white/90 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                    selectedProperty?.id === prop.id ? 'bg-white/20' : 'bg-gradient-to-br from-gray-100 to-gray-50'
                  }`}>
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className={`text-sm font-bold truncate mb-0.5 ${selectedProperty?.id === prop.id ? 'text-white' : 'text-gray-900'}`}>
                      {prop.title}
                    </h3>
                    <p className={`text-sm font-black mb-1 ${selectedProperty?.id === prop.id ? 'text-violet-100' : 'text-violet-600'}`}>
                      {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        selectedProperty?.id === prop.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {TRANSACTION_LABELS[prop.type]}
                      </span>
                      {prop.status_documents === 'saneado' ? (
                        <div className={`w-2 h-2 rounded-full ${selectedProperty?.id === prop.id ? 'bg-emerald-300' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} title="Saneado" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${selectedProperty?.id === prop.id ? 'bg-rose-300' : 'bg-rose-500'} shadow-[0_0_8px_rgba(244,63,94,0.5)]`} title="Alerta Legal" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Bottom Sheet */}
      <BottomSheet
        isOpen={selectedProperty !== null && !showLeadForm}
        onClose={() => setSelectedProperty(null)}
        title={selectedProperty?.title}
      >
        {selectedProperty && (
          <div className="space-y-4">
            {selectedProperty.panorama_url && (
              <PanoramaViewer
                panoramaUrl={selectedProperty.panorama_url}
                label={selectedProperty.panorama_label || 'Tour 360'}
              />
            )}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold">
                {TRANSACTION_LABELS[selectedProperty.type]}
              </span>
              {selectedProperty.status_documents === 'saneado' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Saneado Garantizado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 text-xs font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Alerta Legal: Papeles Pendientes
                </span>
              )}
            </div>

            <p className="text-2xl font-black text-violet-600">
              {selectedProperty.currency === 'USD' ? '$' : 'Bs.'}{selectedProperty.price.toLocaleString()}
              <span className="text-sm font-medium text-gray-400 ml-2">{selectedProperty.currency}</span>
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">{selectedProperty.description}</p>

            <button
              onClick={() => setShowLeadForm(true)}
              className="w-full py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:bg-violet-700 transition-all cursor-pointer"
            >
              📋 Contactar Agente
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={showLeadForm}
        onClose={() => {
          setShowLeadForm(false);
          setSelectedProperty(null);
        }}
        property={selectedProperty}
        onSubmit={handleSubmitInterest}
      />
    </div>
  );
}
