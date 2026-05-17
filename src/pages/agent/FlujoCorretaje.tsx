import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Send, Clock, FileText, AlertCircle, PenTool } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePropertyStore } from '../../store/propertyStore';
import KanbanBoard from '../../components/KanbanBoard';
import AutoContractGenerator from '../../components/AutoContractGenerator';
import type { CommissionType } from '../../types';

const COLUMNS = [
  { id: 1, title: 'Buzón de Entrada', color: 'bg-amber-400' },
  { id: 2, title: 'Negociación', color: 'bg-violet-500' },
  { id: 3, title: 'Revisión Contrato', color: 'bg-blue-500' },
  { id: 4, title: 'En Mercado', color: 'bg-emerald-500' },
];

export default function FlujoCorretaje() {
  const user = useAuthStore((s) => s.user);
  const { properties, fetchProperties, updateStage } = usePropertyStore();

  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzingPropertyId, setAnalyzingPropertyId] = useState<string | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);

  // Commission form state per property
  const [commissionForms, setCommissionForms] = useState<
    Record<string, { type: CommissionType; amount: string; exclusivity: string }>
  >({});

  const handleSignContract = async (propertyId: string, filename: string) => {
    await updateStage(propertyId, {
      is_agent_signed_crm1: true,
      corretaje_contract_filename: filename,
    });
    fetchProperties({ agent_id: user!.id });
  };

  useEffect(() => {
    if (user) {
      fetchProperties({ agent_id: user.id });
      const interval = setInterval(() => {
        fetchProperties({ agent_id: user.id });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchProperties]);

  const handleAcceptLead = async (propertyId: string) => {
    await updateStage(propertyId, { stage_crm1: 2 });
    fetchProperties({ agent_id: user!.id });
  };

  const handleRejectLead = async (propertyId: string) => {
    await updateStage(propertyId, { stage_crm1: 0 });
    fetchProperties({ agent_id: user!.id });
  };

  const handleSendContract = async (propertyId: string) => {
    const form = commissionForms[propertyId];
    if (!form || !form.amount || !form.exclusivity) return;
    
    await updateStage(propertyId, {
      stage_crm1: 3,
      commission_type: form.type,
      proposed_commission: parseFloat(form.amount),
      corretaje_exclusivity_months: parseInt(form.exclusivity, 10),
      corretaje_status: 'pending'
    });
    fetchProperties({ agent_id: user!.id });
  };

  const generateAndShowContract = async (propertyId: string, ownerName: string) => {
    setIsGeneratingContract(true);
    setAnalyzingPropertyId(propertyId);
    try {
      await fetch('/api/ai/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, owner_name: ownerName }),
      });
      // Refresh properties so corretaje_contract_content is updated
      await fetchProperties({ agent_id: user!.id });
    } catch (e) {
      console.error('Error generating contract:', e);
    } finally {
      setIsGeneratingContract(false);
      setShowAnalyzer(true);
    }
  };

  const agentProperties = properties.filter((p) => p.stage_crm1 >= 1 && p.stage_crm1 <= 4);

  const renderCards = (columnId: number) => {
    const colProps = agentProperties.filter((p) => p.stage_crm1 === columnId);

    if (colProps.length === 0) {
      return (
        <div className="text-center py-8 text-gray-300 text-xs">
          Sin elementos
        </div>
      );
    }

    return colProps.map((prop) => (
      <div
        key={prop.id}
        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
      >
        <h4 className="text-sm font-bold text-gray-900 mb-1 truncate">{prop.title}</h4>
        <p className="text-xs text-gray-400 mb-3">
          {prop.currency === 'USD' ? '$' : 'Bs.'}{prop.price.toLocaleString()} • {prop.type}
        </p>

        {/* Status badge */}
        <div className="mb-3">
          {prop.status_documents === 'saneado' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">
              <div className="w-1 h-1 rounded-full bg-emerald-500" /> Saneado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[10px] font-semibold">
              <div className="w-1 h-1 rounded-full bg-rose-500" /> Alerta Legal
            </span>
          )}
        </div>

        {/* Column 1: Accept/Reject */}
        {columnId === 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAcceptLead(prop.id)}
              className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Aceptar
            </button>
            <button
              onClick={() => handleRejectLead(prop.id)}
              className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Rechazar
            </button>
          </div>
        )}

        {/* Column 2: Commission Form */}
        {columnId === 2 && (
          <div className="space-y-2">
            <select
              value={commissionForms[prop.id]?.type || 'porcentaje'}
              onChange={(e) =>
                setCommissionForms((prev) => ({
                  ...prev,
                  [prop.id]: { ...prev[prop.id], type: e.target.value as CommissionType, amount: prev[prop.id]?.amount || '', exclusivity: prev[prop.id]?.exclusivity || '6' },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Monto Fijo ($)</option>
            </select>
            <input
              type="number"
              placeholder={commissionForms[prop.id]?.type === 'fijo' ? 'Monto en USD' : 'Porcentaje (ej: 3)'}
              value={commissionForms[prop.id]?.amount || ''}
              onChange={(e) =>
                setCommissionForms((prev) => ({
                  ...prev,
                  [prop.id]: { ...prev[prop.id], type: prev[prop.id]?.type || 'porcentaje', amount: e.target.value, exclusivity: prev[prop.id]?.exclusivity || '6' },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <input
              type="number"
              placeholder="Meses de Exclusividad"
              value={commissionForms[prop.id]?.exclusivity || ''}
              onChange={(e) =>
                setCommissionForms((prev) => ({
                  ...prev,
                  [prop.id]: { ...prev[prop.id], type: prev[prop.id]?.type || 'porcentaje', amount: prev[prop.id]?.amount || '', exclusivity: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={() => handleSendContract(prop.id)}
              disabled={!commissionForms[prop.id]?.amount || !commissionForms[prop.id]?.exclusivity}
              className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> Generar y Enviar Contrato
            </button>
          </div>
        )}

        {/* Column 3: Contract Review & Counteroffer */}
        {columnId === 3 && (
          <div className="space-y-2">
            {prop.corretaje_status === 'pending' && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-700 font-medium">Contrato Enviado</span>
                </div>
                <p className="text-[10px] text-blue-600 mt-1">Esperando que el propietario revise y acepte los términos...</p>
              </div>
            )}

            {prop.corretaje_status === 'counteroffer' && prop.corretaje_counteroffer_data && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 space-y-2">
                <div className="flex items-center gap-1 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-bold text-rose-700">Contraoferta del Propietario</span>
                </div>
                
                <div className="space-y-1">
                  {prop.corretaje_counteroffer_data.amount && (
                    <p className="text-[10px] text-gray-700">
                      <span className="font-semibold">Propone:</span> {prop.corretaje_counteroffer_data.commission_type === 'porcentaje' ? `${prop.corretaje_counteroffer_data.amount}%` : `$${prop.corretaje_counteroffer_data.amount}`}
                    </p>
                  )}
                  {prop.corretaje_counteroffer_data.exclusivity_months && (
                    <p className="text-[10px] text-gray-700">
                      <span className="font-semibold">Exclusividad:</span> {prop.corretaje_counteroffer_data.exclusivity_months} meses
                    </p>
                  )}
                  {prop.corretaje_counteroffer_data.message && (
                    <p className="text-[10px] text-gray-700 italic border-l-2 border-rose-300 pl-2 mt-1">
                      "{prop.corretaje_counteroffer_data.message}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-200 mt-2 space-y-2">
                  <p className="text-[10px] font-semibold text-gray-600">Ajustar términos y re-enviar:</p>
                  <select
                    value={commissionForms[prop.id]?.type || 'porcentaje'}
                    onChange={(e) =>
                      setCommissionForms((prev) => ({
                        ...prev,
                        [prop.id]: { ...prev[prop.id], type: e.target.value as CommissionType, amount: prev[prop.id]?.amount || '', exclusivity: prev[prop.id]?.exclusivity || '6' },
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-white border border-rose-200 text-xs focus:outline-none"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Monto Fijo ($)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Monto / Porcentaje"
                    value={commissionForms[prop.id]?.amount || ''}
                    onChange={(e) =>
                      setCommissionForms((prev) => ({
                        ...prev,
                        [prop.id]: { ...prev[prop.id], type: prev[prop.id]?.type || 'porcentaje', amount: e.target.value, exclusivity: prev[prop.id]?.exclusivity || '6' },
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-white border border-rose-200 text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Meses exclusividad"
                    value={commissionForms[prop.id]?.exclusivity || ''}
                    onChange={(e) =>
                      setCommissionForms((prev) => ({
                        ...prev,
                        [prop.id]: { ...prev[prop.id], type: prev[prop.id]?.type || 'porcentaje', amount: prev[prop.id]?.amount || '', exclusivity: e.target.value },
                      }))
                    }
                    className="w-full px-2 py-1.5 rounded bg-white border border-rose-200 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {(!prop.is_agent_signed_crm1 || prop.corretaje_status === 'counteroffer') && (
              <button
                onClick={() => generateAndShowContract(prop.id, prop.title)}
                disabled={isGeneratingContract && analyzingPropertyId === prop.id}
                className="w-full py-2 rounded-lg bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-70"
              >
                {isGeneratingContract && analyzingPropertyId === prop.id ? (
                  <><span className="animate-spin">⏳</span> Generando con IA...</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" /> Revisar y Enviar Contrato</>
                )}
              </button>
            )}

            {prop.is_agent_signed_crm1 && prop.corretaje_status !== 'counteroffer' && prop.corretaje_status !== 'pending' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">Enviado por ti ✓</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Column 4: In Market */}
        {columnId === 4 && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-xs font-medium text-emerald-700">
              {prop.published_to_map ? '🟢 Publicada en portal' : '⚪ Lista para publicar'}
            </span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Flujo de Corretaje</h1>
        <p className="text-sm text-gray-400 mt-0.5">CRM 1 — Gestión de captaciones y contratos generados</p>
      </div>

      <KanbanBoard columns={COLUMNS} renderCards={renderCards} />

      <AutoContractGenerator
        isOpen={showAnalyzer}
        onClose={() => setShowAnalyzer(false)}
        property={analyzingPropertyId ? properties.find((p) => p.id === analyzingPropertyId) || null : null}
        ownerName="Propietario (CRM)"
        isAgentView={true}
        aiContent={analyzingPropertyId ? properties.find((p) => p.id === analyzingPropertyId)?.corretaje_contract_content : null}
        onAccept={(filename) => {
          if (analyzingPropertyId) {
            handleSignContract(analyzingPropertyId, filename);
            handleSendContract(analyzingPropertyId);
          }
        }}
      />
    </div>
  );
}
