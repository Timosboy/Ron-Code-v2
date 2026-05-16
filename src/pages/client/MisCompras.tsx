import { useEffect, useState } from 'react';
import { Clock, CheckCircle, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import { usePropertyStore } from '../../store/propertyStore';
import StepperCRM from '../../components/StepperCRM';
import AIDocumentAnalyzer from '../../components/AIDocumentAnalyzer';
import { PAYMENT_LABELS } from '../../types';

const CRM2_STAGE_LABELS = ['Lead Inicial', 'Contrato Compromiso', 'Cierre Legal', 'Finalizado'];

export default function MisCompras() {
  const user = useAuthStore((s) => s.user);
  const { leads, fetchLeads, updateLeadStage } = useLeadStore();
  const { properties, fetchProperties } = usePropertyStore();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzerContext, setAnalyzerContext] = useState<'compromiso' | 'final'>('compromiso');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeads({ buyer_id: user.id });
      fetchProperties();
    }
  }, [user, fetchLeads, fetchProperties]);

  const getProperty = (propertyId: string) => properties.find((p) => p.id === propertyId);

  const handleSignCompromiso = async (leadId: string, filename: string) => {
    await updateLeadStage(leadId, {
      is_buyer_signed_crm2_s2: true,
      compromiso_contract_filename: filename,
    });
    fetchLeads({ buyer_id: user!.id });
  };

  const handleSignFinal = async (leadId: string, filename: string) => {
    await updateLeadStage(leadId, {
      is_buyer_signed_crm2_s3: true,
      final_contract_filename: filename,
    });
    fetchLeads({ buyer_id: user!.id });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Mis Compras</h1>
        <p className="text-sm text-gray-400 mt-0.5">Seguimiento de tus ofertas (CRM 2)</p>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tienes ofertas de compra activas</p>
          <p className="text-gray-300 text-sm mt-1">Explora propiedades en la pestaña Buscar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => {
            const prop = getProperty(lead.property_id);
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {prop?.title || 'Propiedad'}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700">
                      Oferta: ${lead.offer_price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Método: {PAYMENT_LABELS[lead.payment_method]}
                  </p>
                  <div className="mt-3">
                    <StepperCRM stages={CRM2_STAGE_LABELS} currentStage={lead.stage_crm2} startIndex={1} />
                  </div>
                </div>

                {/* Stage content */}
                <div className="p-5">
                  {lead.stage_crm2 === 1 && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <p className="text-sm text-amber-700 font-medium">
                        Esperando contacto del Agente...
                      </p>
                    </div>
                  )}

                  {lead.stage_crm2 === 2 && (
                    <div className="space-y-3">
                      {!lead.is_buyer_signed_crm2_s2 ? (
                        <>
                          <p className="text-sm text-gray-500">
                            Carga la minuta de reserva/compromiso para análisis de IA.
                          </p>
                          <button
                            onClick={() => {
                              setActiveLeadId(lead.id);
                              setAnalyzerContext('compromiso');
                              setShowAnalyzer(true);
                            }}
                            className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all cursor-pointer"
                          >
                            📄 Cargar Minuta de Compromiso
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <p className="text-sm text-emerald-700 font-medium">
                            Reserva firmada ✓ — Esperando firma del agente y avance a cierre legal.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {lead.stage_crm2 === 3 && (
                    <div className="space-y-3">
                      {!lead.is_buyer_signed_crm2_s3 ? (
                        <>
                          <p className="text-sm text-gray-500">
                            Carga el contrato definitivo para evaluación de IA y firma final.
                          </p>
                          <button
                            onClick={() => {
                              setActiveLeadId(lead.id);
                              setAnalyzerContext('final');
                              setShowAnalyzer(true);
                            }}
                            className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all cursor-pointer"
                          >
                            📄 Cargar Contrato Definitivo
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <p className="text-sm text-emerald-700 font-medium">
                            Contrato firmado ✓ — Esperando firmas restantes.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {lead.stage_crm2 === 4 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 text-center animate-fadeIn">
                      <div className="text-5xl mb-3 animate-bounce">🎉</div>
                      <h4 className="text-lg font-black text-violet-700 mb-1">¡Felicidades!</h4>
                      <p className="text-sm text-violet-600">
                        Tu transacción ha sido completada con éxito. ¡Disfruta tu nueva propiedad!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AIDocumentAnalyzer
        isOpen={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
        context={analyzerContext}
        transactionType={
          activeLeadId
            ? getProperty(leads.find((l) => l.id === activeLeadId)?.property_id || '')?.type || 'venta'
            : 'venta'
        }
        onSign={(filename) => {
          if (!activeLeadId) return;
          if (analyzerContext === 'compromiso') {
            handleSignCompromiso(activeLeadId, filename);
          } else {
            handleSignFinal(activeLeadId, filename);
          }
        }}
      />
    </div>
  );
}
