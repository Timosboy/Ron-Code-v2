import { useEffect, useState } from 'react';
import { CheckCircle, DollarSign, FileText, ShoppingCart, Brain, Phone, Mail, CreditCard, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import { usePropertyStore } from '../../store/propertyStore';
import KanbanBoard from '../../components/KanbanBoard';
import AIDocumentAnalyzer from '../../components/AIDocumentAnalyzer';
import CRMDashboard from '../../components/CRMDashboard';

type SubTab = 'pipeline' | 'intelligence';

const COLUMNS = [
  { id: 1, title: 'Contacto', color: 'bg-sky-400' },
  { id: 2, title: 'Interés', color: 'bg-amber-400' },
  { id: 3, title: 'Contrato', color: 'bg-violet-500' },
  { id: 4, title: 'Pago', color: 'bg-orange-500' },
  { id: 5, title: 'Venta', color: 'bg-emerald-500' },
];

export default function FlujoVentas() {
  const user = useAuthStore((s) => s.user);
  const { leads, fetchLeads, updateLeadStage } = useLeadStore();
  const { properties, fetchProperties } = usePropertyStore();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [reservationInputs, setReservationInputs] = useState<Record<string, string>>({});
  const [subTab, setSubTab] = useState<SubTab>('pipeline');

  useEffect(() => {
    if (user) {
      fetchLeads({ agent_id: user.id });
      fetchProperties({ agent_id: user.id });
      const interval = setInterval(() => {
        fetchLeads({ agent_id: user.id });
        fetchProperties({ agent_id: user.id });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchLeads, fetchProperties]);

  const getProperty = (propertyId: string) => properties.find((p) => p.id === propertyId);

  const handleSetReservation = async (leadId: string) => {
    const amount = reservationInputs[leadId];
    if (!amount) return;
    await updateLeadStage(leadId, { reservation_amount: parseFloat(amount) });
    fetchLeads({ agent_id: user!.id });
  };

  const handleConfirmReservationPayment = async (leadId: string) => {
    await updateLeadStage(leadId, { agent_confirmed_reservation_payment: true });
    fetchLeads({ agent_id: user!.id });
  };

  const handleSignContract = async (leadId: string, filename: string) => {
    await updateLeadStage(leadId, { is_agent_signed: true, contract_filename: filename });
    fetchLeads({ agent_id: user!.id });
  };

  const handleConfirmFinalPayment = async (leadId: string) => {
    await updateLeadStage(leadId, { agent_confirmed_final_payment: true });
    fetchLeads({ agent_id: user!.id });
    fetchProperties({ agent_id: user!.id });
  };

  const renderCards = (columnId: number) => {
    const colLeads = leads.filter((l) => l.stage_crm2 === columnId);

    if (colLeads.length === 0) {
      return <div className="text-center py-8 text-gray-300 text-xs">Sin elementos</div>;
    }

    return colLeads.map((lead) => {
      const prop = getProperty(lead.property_id);
      return (
        <div
          key={lead.id}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
        >
          <h4 className="text-sm font-bold text-gray-900 mb-0.5 truncate">
            {prop?.title || 'Propiedad'}
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Comprador: <span className="font-medium text-gray-600">{lead.buyer_name}</span>
          </p>

          {/* Column 1: Contacto */}
          {columnId === 1 && (
            <div className="space-y-1.5 p-3 rounded-lg bg-sky-50 border border-sky-100">
              <div className="flex items-center gap-2 text-xs text-sky-700">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{lead.buyer_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-700">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{lead.buyer_email}</span>
              </div>
              <p className="text-[10px] text-sky-500 mt-1.5 leading-relaxed">
                Contacta al cliente por medios externos para brindarle más información y agendar una visita.
              </p>
            </div>
          )}

          {/* Column 2: Interés */}
          {columnId === 2 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-700">El comprador mostró interés</span>
              </div>

              {!lead.reservation_amount ? (
                <div className="space-y-1.5">
                  <input
                    type="number"
                    placeholder="Monto de reserva ($)"
                    value={reservationInputs[lead.id] || ''}
                    onChange={(e) =>
                      setReservationInputs((prev) => ({ ...prev, [lead.id]: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={() => handleSetReservation(lead.id)}
                    disabled={!reservationInputs[lead.id]}
                    className="w-full py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Establecer Monto de Reserva
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-[10px] text-amber-600 font-semibold">Monto de reserva</p>
                  <p className="text-sm font-black text-amber-700">${lead.reservation_amount.toLocaleString()}</p>
                </div>
              )}

              {lead.reservation_amount && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                    Confirmación de pago externo
                  </p>
                  {!lead.agent_confirmed_reservation_payment ? (
                    <button
                      onClick={() => handleConfirmReservationPayment(lead.id)}
                      className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirmar Pago de Reserva
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] text-emerald-700 font-medium">Agente confirmó ✓</span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Comprador: {lead.buyer_confirmed_reservation_payment ? '✅ Confirmó' : '⏳ Pendiente'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Column 3: Contrato */}
          {columnId === 3 && (
            <div className="space-y-2">
              {!lead.is_agent_signed ? (
                <button
                  onClick={() => {
                    setActiveLeadId(lead.id);
                    setShowAnalyzer(true);
                  }}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cargar Contrato y Firmar
                </button>
              ) : (
                <div className="space-y-1.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-700">Contrato subido y firmado ✓</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Comprador: {lead.is_buyer_signed ? '✅ Firmó' : '⏳ Revisando contrato con IA...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Column 4: Pago */}
          {columnId === 4 && (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-[10px] text-orange-700 leading-relaxed">
                  El pago final se realiza por plataformas externas. Confirma cuando se complete.
                </p>
              </div>
              {!lead.agent_confirmed_final_payment ? (
                <button
                  onClick={() => handleConfirmFinalPayment(lead.id)}
                  className="w-full py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Confirmar Pago Final
                </button>
              ) : (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-700 font-medium">Agente confirmó ✓</span>
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                Comprador: {lead.buyer_confirmed_final_payment ? '✅ Confirmó' : '⏳ Pendiente'}
              </p>
            </div>
          )}

          {/* Column 5: Venta */}
          {columnId === 5 && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <span className="text-xs font-bold text-emerald-700">¡Transacción Cerrada!</span>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Flujo de Ventas</h1>
        <p className="text-sm text-gray-400 mt-0.5">CRM 2 — Gestión de compradores</p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${subTab === 'pipeline'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Pipeline Ventas
        </button>
        {/* <button
          onClick={() => setSubTab('intelligence')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'intelligence'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> CRM Inteligente
        </button> */}
      </div>

      {subTab === 'pipeline' && (
        <>
          <KanbanBoard columns={COLUMNS} renderCards={renderCards} />
          <AIDocumentAnalyzer
            isOpen={showAnalyzer}
            onClose={() => setShowAnalyzer(false)}
            context="final"
            transactionType={
              activeLeadId
                ? getProperty(leads.find((l) => l.id === activeLeadId)?.property_id || '')?.type || 'venta'
                : 'venta'
            }
            onSign={(filename) => {
              if (activeLeadId) handleSignContract(activeLeadId, filename);
            }}
          />
        </>
      )}

      {subTab === 'intelligence' && <CRMDashboard />}
    </div>
  );
}
