import { useEffect, useState } from 'react';
import { Clock, CheckCircle, ShoppingBag, Star, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import { usePropertyStore } from '../../store/propertyStore';
import StepperCRM from '../../components/StepperCRM';
import AIDocumentAnalyzer from '../../components/AIDocumentAnalyzer';

const CRM2_STAGE_LABELS = ['Contacto', 'Interés', 'Contrato', 'Pago', 'Venta'];

export default function MisCompras() {
  const user = useAuthStore((s) => s.user);
  const { leads, fetchLeads, updateLeadStage } = useLeadStore();
  const { properties, fetchProperties } = usePropertyStore();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLeads({ buyer_id: user.id });
      fetchProperties();
      const interval = setInterval(() => {
        fetchLeads({ buyer_id: user.id });
        fetchProperties();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchLeads, fetchProperties]);

  const getProperty = (propertyId: string) => properties.find((p) => p.id === propertyId);

  const handleShowInterest = async (leadId: string) => {
    await updateLeadStage(leadId, { buyer_showed_interest: true });
    fetchLeads({ buyer_id: user!.id });
  };

  const handleConfirmReservationPayment = async (leadId: string) => {
    await updateLeadStage(leadId, { buyer_confirmed_reservation_payment: true });
    fetchLeads({ buyer_id: user!.id });
  };

  const handleSignContract = async (leadId: string, filename: string) => {
    await updateLeadStage(leadId, { is_buyer_signed: true, contract_filename: filename });
    fetchLeads({ buyer_id: user!.id });
  };

  const handleConfirmFinalPayment = async (leadId: string) => {
    await updateLeadStage(leadId, { buyer_confirmed_final_payment: true });
    fetchLeads({ buyer_id: user!.id });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Mis Compras</h1>
        <p className="text-sm text-gray-400 mt-0.5">Seguimiento de tus solicitudes (CRM 2)</p>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No tienes solicitudes activas</p>
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
                      {prop?.currency === 'USD' ? '$' : 'Bs.'}{prop?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3">
                    <StepperCRM stages={CRM2_STAGE_LABELS} currentStage={lead.stage_crm2} startIndex={1} />
                  </div>
                </div>

                {/* Stage content */}
                <div className="p-5">
                  {/* Stage 1: Contacto */}
                  {lead.stage_crm2 === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-100">
                        <Clock className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-sky-700 font-medium">
                          Tu información fue enviada al agente. En breve se pondrá en contacto contigo para brindarte más detalles y agendar una visita.
                        </p>
                      </div>
                      <button
                        onClick={() => handleShowInterest(lead.id)}
                        className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Star className="w-4 h-4" /> Mostrar Interés por esta Propiedad
                      </button>
                    </div>
                  )}

                  {/* Stage 2: Interés */}
                  {lead.stage_crm2 === 2 && (
                    <div className="space-y-3">
                      {lead.reservation_amount ? (
                        <>
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-600 mb-1">
                              Monto de Reserva establecido por el Agente
                            </p>
                            <p className="text-2xl font-black text-amber-700">
                              ${lead.reservation_amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-amber-500 mt-2 leading-relaxed">
                              Realiza el pago de reserva a través de las plataformas externas acordadas con el agente. Una vez completado, confírmalo aquí.
                            </p>
                          </div>
                          {!lead.buyer_confirmed_reservation_payment ? (
                            <button
                              onClick={() => handleConfirmReservationPayment(lead.id)}
                              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" /> Confirmar Pago de Reserva Realizado
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                              <p className="text-sm text-emerald-700 font-medium">
                                Confirmaste el pago ✓ — Esperando confirmación del agente...
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <p className="text-sm text-amber-700 font-medium">
                            El agente está revisando tu solicitud y establecerá el monto de reserva en breve...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 3: Contrato */}
                  {lead.stage_crm2 === 3 && (
                    <div className="space-y-3">
                      {!lead.is_agent_signed ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 border border-violet-100">
                          <Clock className="w-5 h-5 text-violet-500 flex-shrink-0" />
                          <p className="text-sm text-violet-700 font-medium">
                            Esperando que el agente cargue y firme el contrato...
                          </p>
                        </div>
                      ) : !lead.is_buyer_signed ? (
                        <>
                          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                            <p className="text-sm font-semibold text-violet-700 mb-1">
                              El agente ha cargado el contrato
                            </p>
                            <p className="text-xs text-violet-500">
                              Revisa el análisis de IA sobre las cláusulas importantes y de riesgo, luego firma digitalmente.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveLeadId(lead.id);
                              setShowAnalyzer(true);
                            }}
                            className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            🔍 Revisar Análisis IA y Firmar Contrato
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <p className="text-sm text-emerald-700 font-medium">
                            Contrato firmado ✓ — Avanzando a etapa de pago...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 4: Pago */}
                  {lead.stage_crm2 === 4 && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                        <p className="text-sm font-semibold text-orange-700 mb-1">Pago Final</p>
                        <p className="text-xs text-orange-600 leading-relaxed">
                          Realiza el pago final a través de las plataformas externas acordadas con el agente. Una vez completado, confírmalo aquí.
                        </p>
                      </div>
                      {!lead.buyer_confirmed_final_payment ? (
                        <button
                          onClick={() => handleConfirmFinalPayment(lead.id)}
                          className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" /> Confirmar Pago Final Realizado
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <p className="text-sm text-emerald-700 font-medium">
                            Confirmaste el pago ✓ — Esperando confirmación del agente...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 5: Venta */}
                  {lead.stage_crm2 === 5 && (
                    <div className="p-6 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 text-center animate-fadeIn">
                      <div className="text-5xl mb-3 animate-bounce">🎉</div>
                      <h4 className="text-lg font-black text-violet-700 mb-1">¡Transacción Completada!</h4>
                      <p className="text-sm text-violet-600">
                        La compra ha sido realizada exitosamente. ¡Felicidades por tu nueva propiedad!
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
        context="final"
        transactionType={
          activeLeadId
            ? getProperty(leads.find((l) => l.id === activeLeadId)?.property_id || '')?.type || 'venta'
            : 'venta'
        }
        preloadedFilename={
          activeLeadId
            ? leads.find((l) => l.id === activeLeadId)?.contract_filename ?? undefined
            : undefined
        }
        onSign={(filename) => {
          if (activeLeadId) handleSignContract(activeLeadId, filename);
        }}
      />
    </div>
  );
}
