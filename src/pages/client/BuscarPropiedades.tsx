import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { useLeadStore } from '../../store/leadStore';
import { TRANSACTION_LABELS } from '../../types';
import type { Property, TransactionType } from '../../types';
import SimulatedMap from '../../components/SimulatedMap';
import BottomSheet from '../../components/BottomSheet';
import LeadFormModal from '../../components/LeadFormModal';

export default function BuscarPropiedades() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties } = usePropertyStore();
  const { createLead } = useLeadStore();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProperties({ published_to_map: 'true' });
  }, [fetchProperties]);

  const filteredProperties = properties.filter((p) => {
    if (p.stage_crm1 !== 4 || !p.published_to_map) return false;
    if (filter !== 'all' && p.type !== filter) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSubmitInterest = async (data: {
    offer_price: number;
    payment_method: 'efectivo' | 'credito_bancario' | 'fondos_propios';
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Buscar Propiedades</h1>
        <p className="text-sm text-gray-400 mt-0.5">Encuentra tu próximo hogar o inversión</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 items-center">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          {(['all', 'venta', 'alquiler', 'anticretico'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Todos' : TRANSACTION_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Property List */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-medium">No se encontraron propiedades</p>
            </div>
          ) : (
            filteredProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedProperty?.id === prop.id
                    ? 'bg-violet-50 border-violet-200 shadow-md shadow-violet-500/5'
                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{prop.title}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700 flex-shrink-0 ml-2">
                        {TRANSACTION_LABELS[prop.type]}
                      </span>
                    </div>
                    <p className="text-lg font-black text-violet-600">
                      {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {prop.status_documents === 'saneado' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
                          <div className="w-1 h-1 rounded-full bg-emerald-500" />
                          Saneado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[10px] font-semibold">
                          <div className="w-1 h-1 rounded-full bg-rose-500" />
                          Alerta Legal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right: Simulated Map */}
        <div className="hidden lg:block">
          <SimulatedMap
            properties={filteredProperties}
            onPinClick={(prop) => setSelectedProperty(prop)}
            selectedId={selectedProperty?.id}
          />
        </div>
      </div>

      {/* Bottom Sheet (Property Details) */}
      <BottomSheet
        isOpen={selectedProperty !== null && !showLeadForm}
        onClose={() => setSelectedProperty(null)}
        title={selectedProperty?.title}
      >
        {selectedProperty && (
          <div className="space-y-4">
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
              💬 Me Interesa / Contactar Agente
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
