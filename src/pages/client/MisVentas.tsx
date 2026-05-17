import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import StepperCRM from '../../components/StepperCRM';
import AutoContractGenerator from '../../components/AutoContractGenerator';

const CRM1_STAGE_LABELS = ['Solicitud Recepcionada', 'Acuerdo Comisión', 'Firma Contrato Prestación de Servicios', 'En Mercado', 'Cierre'];

export default function MisVentas() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties, updateStage } = usePropertyStore();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzingPropertyId, setAnalyzingPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProperties({ owner_id: user.id });
      const interval = setInterval(() => {
        fetchProperties({ owner_id: user.id });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchProperties]);

  const activeProperties = properties.filter((p) => p.stage_crm1 >= 1);

  const handleAcceptCommission = async (propertyId: string) => {
    await updateStage(propertyId, { client_accepted_commission: true, stage_crm1: 3 });
    fetchProperties({ owner_id: user!.id });
  };

  const handleRejectCommission = async (propertyId: string) => {
    await updateStage(propertyId, { stage_crm1: 1 });
    fetchProperties({ owner_id: user!.id });
  };

  const handleSignContract = async (propertyId: string, filename: string) => {
    await updateStage(propertyId, {
      is_client_signed_crm1: true,
      corretaje_contract_filename: filename,
      stage_crm1: 4,
    });
    fetchProperties({ owner_id: user!.id });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-400 mt-0.5">Sigue el estado y avance de la oferta de tus propiedades</p>
      </div>

      {activeProperties.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tienes procesos de venta activos</p>
          <p className="text-gray-300 text-sm mt-1">Asigna un agente desde Mis Propiedades para iniciar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProperties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{prop.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()}
                    </p>
                  </div>
                  {prop.stage_crm1 === 5 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                      Concluida ✓
                    </span>
                  )}
                </div>
                <StepperCRM stages={CRM1_STAGE_LABELS} currentStage={prop.stage_crm1} startIndex={1} />
              </div>

              {/* Stage-specific content */}
              <div className="p-5">
                {prop.stage_crm1 === 1 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                      Esperando confirmación del agente seleccionado...
                    </p>
                  </div>
                )}

                {prop.stage_crm1 === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                      <p className="text-xs font-semibold text-violet-500 mb-1">Comisión Propuesta por el Agente</p>
                      <p className="text-2xl font-black text-violet-700">
                        {prop.commission_type === 'porcentaje'
                          ? `${prop.proposed_commission}%`
                          : `$${prop.proposed_commission?.toLocaleString()}`}
                        <span className="text-sm font-medium text-violet-400 ml-2">
                          ({prop.commission_type === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'})
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptCommission(prop.id)}
                        className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aceptar Comisión
                      </button>
                      <button
                        onClick={() => handleRejectCommission(prop.id)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {prop.stage_crm1 === 3 && (
                  <div className="space-y-4">
                    {!prop.is_client_signed_crm1 ? (
                      <>
                        <p className="text-sm text-gray-500">
                          Genera automáticamente el contrato de corretaje con las condiciones acordadas para firmarlo digitalmente.
                        </p>
                        <button
                          onClick={() => {
                            setAnalyzingPropertyId(prop.id);
                            setShowAnalyzer(true);
                          }}
                          className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
                          Generar Contrato Automáticamente
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <p className="text-sm text-emerald-700 font-medium">
                          Contrato firmado. Esperando firma del agente...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {prop.stage_crm1 === 4 && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-sm font-bold text-emerald-700 mb-1">¡Tu propiedad está en el mercado!</p>
                    <p className="text-xs text-emerald-600">
                      Los compradores pueden verla en el portal de búsqueda y en el mapa interactivo.
                    </p>
                  </div>
                )}

                {prop.stage_crm1 === 5 && (
                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-sm font-bold text-violet-700">Transacción concluida exitosamente</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto Contract Generator Modal */}
      <AutoContractGenerator
        isOpen={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
        property={analyzingPropertyId ? properties.find((p) => p.id === analyzingPropertyId) || null : null}
        ownerName={user?.name || 'Propietario'}
        aiContent={analyzingPropertyId ? properties.find((p) => p.id === analyzingPropertyId)?.corretaje_contract_content : null}
        onAccept={(filename) => {
          if (analyzingPropertyId) {
            handleSignContract(analyzingPropertyId, filename);
          }
        }}
        onCounteroffer={async (data) => {
          if (analyzingPropertyId) {
            await updateStage(analyzingPropertyId, {
              corretaje_status: 'counteroffer',
              corretaje_counteroffer_data: {
                commission_type: data.type,
                amount: data.amount ? parseFloat(data.amount) : undefined,
                exclusivity_months: data.exclusivity ? parseInt(data.exclusivity, 10) : undefined,
                message: data.message
              }
            });
            fetchProperties({ owner_id: user!.id });
            setShowAnalyzer(false);
          }
        }}
        onReject={() => setShowAnalyzer(false)}
      />
    </div>
  );
}
