import { useEffect, useState } from 'react';
import { Plus, MapPin, CheckSquare, Square, FileText, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import { TRANSACTION_LABELS } from '../../types';
import PropertyFormModal from '../../components/PropertyFormModal';
import AIRecommenderModal from '../../components/AIRecommenderModal';
import type { Property } from '../../types';

export default function MisPropiedades() {
  const user = useAuthStore((s) => s.user);
  const { properties, agents, fetchProperties, fetchAgents, createProperty, assignAgent } = usePropertyStore();
  const [showForm, setShowForm] = useState(false);
  const [showRecommender, setShowRecommender] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (user) {
      fetchProperties({ owner_id: user.id });
      fetchAgents();
    }
  }, [user, fetchProperties, fetchAgents]);

  const handleCreateProperty = async (data: Parameters<typeof createProperty>[0]) => {
    if (user) {
      await createProperty(data, user.id);
      fetchProperties({ owner_id: user.id });
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (selectedProperty) {
      await assignAgent(selectedProperty.id, agentId);
      fetchProperties({ owner_id: user!.id });
    }
  };

  const LegalCheck = ({ label, checked }: { label: string; checked: boolean }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Square className="w-3.5 h-3.5 text-gray-300" />
      )}
      <span className={`text-xs ${checked ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mis Propiedades</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona tu portafolio inmobiliario</p>
        </div>
      </div>

      {/* Property Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-gray-400 font-medium">No tienes propiedades registradas</p>
          <p className="text-gray-300 text-sm mt-1">Presiona + para agregar una</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-violet-500/5 transition-all group"
            >
              {/* Image placeholder */}
              <div className="h-36 bg-gradient-to-br from-violet-100 to-purple-50 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-violet-300" />
                </div>
                {/* Type badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-semibold text-violet-700">
                    {TRANSACTION_LABELS[prop.type]}
                  </span>
                </div>
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  {prop.status_documents === 'saneado' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 backdrop-blur-sm text-emerald-700 text-xs font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Saneado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 backdrop-blur-sm text-rose-700 text-xs font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Alerta Legal
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{prop.title}</h3>
                <p className="text-lg font-black text-violet-600 mb-3">
                  {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
                </p>

                {/* Legal checklist */}
                <div className="space-y-1 mb-3">
                  <LegalCheck label="Título de Propiedad" checked={prop.has_titulo} />
                  <LegalCheck label="Folio Real" checked={prop.has_folio} />
                  <LegalCheck label="Impuestos al Día" checked={prop.has_impuestos} />
                </div>

                {/* CRM Status / Actions */}
                {prop.agent_id ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50">
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-medium text-violet-600">Agente asignado • Etapa {prop.stage_crm1}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedProperty(prop);
                      setShowRecommender(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Buscar Agente Recomendado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-600/30 hover:bg-violet-700 hover:scale-105 transition-all flex items-center justify-center z-30 cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <PropertyFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateProperty}
      />
      <AIRecommenderModal
        isOpen={showRecommender}
        onClose={() => setShowRecommender(false)}
        property={selectedProperty}
        agents={agents}
        onSelectAgent={handleAssignAgent}
      />
    </div>
  );
}
