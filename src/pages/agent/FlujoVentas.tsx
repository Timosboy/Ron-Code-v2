import { useEffect, useState } from 'react';
import { Play, PenTool, CheckCircle, DollarSign, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import { usePropertyStore } from '../../store/propertyStore';
import KanbanBoard from '../../components/KanbanBoard';
import AIDocumentAnalyzer from '../../components/AIDocumentAnalyzer';
import { PAYMENT_LABELS } from '../../types';
import type { DocumentContext } from '../../types';

const COLUMNS = [
  { id: 1, title: 'Leads Compradores', color: 'bg-amber-400' },
  { id: 2, title: 'Contrato Compromiso', color: 'bg-violet-500' },
  { id: 3, title: 'Cierre Legal', color: 'bg-blue-500' },
  { id: 4, title: 'Cerrado / Ganado', color: 'bg-emerald-500' },
];

export default function FlujoVentas() {
  const user = useAuthStore((s) => s.user);
  const { leads, fetchLeads, updateLeadStage } = useLeadStore();
  const { properties, fetchProperties } = usePropertyStore();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzerContext, setAnalyzerContext] = useState<DocumentContext>('compromiso');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [reservationAmounts, setReservationAmounts] = useState<Record<string, string>>({});
  const [notaryNumbers, setNotaryNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchLeads({ agent_id: user.id });
      fetchProperties({ agent_id: user.id });
    }
  }, [user, fetchLeads, fetchProperties]);

  const getProperty = (propertyId: string) => properties.find((p) => p.id === propertyId);

  const handleInitiateReservation = async (leadId: string) => {
    await updateLeadStage(leadId, { stage_crm2: 2 });
    fetchLeads({ agent_id: user!.id });
  };

  const handleSignCompromiso = async (leadId: string, filename: string) => {
    const amount = reservationAmounts[leadId];
    await updateLeadStage(leadId, {
      is_agent_signed_crm2_s2: true,
      compromiso_contract_filename: filename,
      reservation_amount: amount ? parseFloat(amount) : undefined,
    });
    // Check if buyer also signed
    const lead = leads.find((l) => l.id === leadId);
    if (lead?.is_buyer_signed_crm2_s2) {
      await updateLeadStage(leadId, { stage_crm2: 3 });
    }
    fetchLeads({ agent_id: user!.id });
  };

  const handleSignFinal = async (leadId: string, filename: string) => {
    const notary = notaryNumbers[leadId];
    await updateLeadStage(leadId, {
      is_agent_signed_crm2_s3: true,
      final_contract_filename: filename,
      notary_office_number: notary || undefined,
    });
    // Check all three signatures
    const lead = leads.find((l) => l.id === leadId);
    if (lead?.is_buyer_signed_crm2_s3 && lead?.is_owner_signed_crm2_s3) {
      await updateLeadStage(leadId, { stage_crm2: 4 });
    }
    fetchLeads({ agent_id: user!.id });
    fetchProperties({ agent_id: user!.id });
  };

  const renderCards = (columnId: number) => {
    const colLeads = leads.filter((l) => l.stage_crm2 === columnId);

    if (colLeads.length === 0) {
      return (
        <div className="text-center py-8 text-gray-300 text-xs">
          Sin elementos
        </div>
      );
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
          <p className="text-xs text-gray-400 mb-2">
            Comprador: <span className="font-medium text-gray-600">{lead.buyer_name}</span>
          </p>

          {/* Financial details */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold">
              <DollarSign className="w-3 h-3" />${lead.offer_price.toLocaleString()}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-semibold">
              {PAYMENT_LABELS[lead.payment_method]}
            </span>
          </div>

          {/* Column 1: Initiate */}
          {columnId === 1 && (
            <button
              onClick={() => handleInitiateReservation(lead.id)}
              className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> Iniciar Reserva
            </button>
          )}

          {/* Column 2: Compromiso Contract */}
          {columnId === 2 && (
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Monto de reserva ($)"
                value={reservationAmounts[lead.id] || ''}
                onChange={(e) =>
                  setReservationAmounts((prev) => ({ ...prev, [lead.id]: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {!lead.is_agent_signed_crm2_s2 ? (
                <button
                  onClick={() => {
                    setActiveLeadId(lead.id);
                    setAnalyzerContext('compromiso');
                    setShowAnalyzer(true);
                  }}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" /> Cargar y Firmar Compromiso
                </button>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-700">Firmado ✓</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    {lead.is_buyer_signed_crm2_s2 ? 'Comprador firmó ✓' : 'Esperando firma comprador...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Column 3: Final Contract */}
          {columnId === 3 && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nro. Notaría"
                value={notaryNumbers[lead.id] || ''}
                onChange={(e) =>
                  setNotaryNumbers((prev) => ({ ...prev, [lead.id]: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {!lead.is_agent_signed_crm2_s3 ? (
                <button
                  onClick={() => {
                    setActiveLeadId(lead.id);
                    setAnalyzerContext('final');
                    setShowAnalyzer(true);
                  }}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Cargar Contrato Definitivo
                </button>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 space-y-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-700">Agente firmó ✓</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Comprador: {lead.is_buyer_signed_crm2_s3 ? '✅' : '⏳'} •
                    Vendedor: {lead.is_owner_signed_crm2_s3 ? '✅' : '⏳'}
                  </p>
                </div>
              )}

              {/* Simulate owner signature for demo */}
              {lead.is_agent_signed_crm2_s3 && !lead.is_owner_signed_crm2_s3 && (
                <button
                  onClick={async () => {
                    await updateLeadStage(lead.id, { is_owner_signed_crm2_s3: true });
                    // If all signed, advance
                    if (lead.is_buyer_signed_crm2_s3) {
                      await updateLeadStage(lead.id, { stage_crm2: 4 });
                    }
                    fetchLeads({ agent_id: user!.id });
                    fetchProperties({ agent_id: user!.id });
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-semibold hover:bg-amber-200 transition-all cursor-pointer"
                >
                  🔑 Simular Firma del Vendedor (Demo)
                </button>
              )}
            </div>
          )}

          {/* Column 4: Closed */}
          {columnId === 4 && (
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

      <KanbanBoard columns={COLUMNS} renderCards={renderCards} />

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
