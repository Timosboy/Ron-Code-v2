import { useEffect, useState } from 'react';
import { Brain, Flame, TrendingUp, Users, Activity, ChevronRight, Zap, Eye, MessageSquare, Calendar, Heart, MousePointer, MapPin, DollarSign, BedDouble } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCRMStore } from '../store/crmStore';
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES_ORDER, CLASSIFICATION_LABELS, INTERACTION_LABELS } from '../types';
import type { EnrichedLead, PipelineStage, ClassificationType, BuyerInteraction } from '../types';

const STAGE_COLORS: Record<PipelineStage, string> = {
  CONTACT: 'bg-slate-400', VISIT: 'bg-amber-400', INTEREST: 'bg-violet-500',
  COMMITMENT_SIGNATURE: 'bg-blue-500', PAYMENT: 'bg-emerald-500', COMPLETED: 'bg-green-600',
};

const CLASS_COLORS: Record<ClassificationType, { bg: string; text: string; border: string }> = {
  HOT_LEAD: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  WARM_LEAD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  COLD_LEAD: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const INTER_ICONS: Record<string, typeof Eye> = {
  VIEW: Eye, CLICK: MousePointer, FAVORITE: Heart, MESSAGE: MessageSquare, VISIT_REQUEST: Calendar,
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = 18, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#3b82f6';
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="rotate-[-90deg]">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="animate-scoreRing" style={{ '--score-offset': offset } as React.CSSProperties} />
      <text x="22" y="22" textAnchor="middle" dy="5" fill={color}
        fontSize="12" fontWeight="800" className="rotate-[90deg] origin-center">{score}</text>
    </svg>
  );
}

function LeadCard({ lead, onClassify, classifying }: {
  lead: EnrichedLead; onClassify: (id: string) => void; classifying: boolean;
}) {
  const cls = lead.classification;
  const clsStyle = cls ? CLASS_COLORS[cls.classification] : null;
  return (
    <div className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all animate-cardSlideIn ${
      cls?.classification === 'HOT_LEAD' ? 'animate-hotPulse border-red-200' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 truncate">{lead.buyer_name}</h4>
          <p className="text-[10px] text-gray-400">{lead.buyer_email}</p>
        </div>
        {cls && <ScoreRing score={cls.score} size={40} />}
      </div>
      {cls && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${clsStyle?.bg} ${clsStyle?.text} ${clsStyle?.border}`}>
          {CLASSIFICATION_LABELS[cls.classification]}
        </span>
      )}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold">
          <DollarSign className="w-3 h-3 inline" />Etapa {lead.stage_crm2}
        </span>
      </div>
      {lead.preferences && (
        <div className="mt-2 p-2 rounded-lg bg-gray-50 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <MapPin className="w-3 h-3" />{lead.preferences.preferred_zones.join(', ') || 'Sin zona'}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <BedDouble className="w-3 h-3" />{lead.preferences.bedrooms_min}-{lead.preferences.bedrooms_max} hab
            <span className="ml-1">${lead.preferences.budget_min.toLocaleString()}-${lead.preferences.budget_max.toLocaleString()}</span>
          </div>
        </div>
      )}
      <button onClick={() => onClassify(lead.id)} disabled={classifying}
        className="w-full mt-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-semibold hover:from-violet-700 hover:to-purple-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50">
        <Brain className="w-3.5 h-3.5" />{classifying ? 'Analizando...' : 'Clasificar IA'}
      </button>
    </div>
  );
}

function InteractionItem({ interaction }: { interaction: BuyerInteraction }) {
  const Icon = INTER_ICONS[interaction.interaction_type] || Activity;
  const label = INTERACTION_LABELS[interaction.interaction_type] || interaction.interaction_type;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(interaction.timestamp).getTime();
    const days = Math.floor(diff / 86400000);
    return days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`;
  })();
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{interaction.buyer_name}</p>
        <p className="text-[10px] text-gray-400 truncate">{label} — {interaction.property_title}</p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo}</span>
    </div>
  );
}

export default function CRMDashboard() {
  const user = useAuthStore((s) => s.user);
  const { dashboard, loading, classifying, fetchDashboard, classifyLead, updateLeadStage } = useCRMStore();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  useEffect(() => { if (user) fetchDashboard(user.id); }, [user, fetchDashboard]);

  const handleClassify = async (leadId: string) => {
    await classifyLead(leadId);
    if (user) fetchDashboard(user.id);
  };

  const handleAdvanceStage = async (leadId: string, currentStage: PipelineStage) => {
    const idx = PIPELINE_STAGES_ORDER.indexOf(currentStage);
    if (idx < PIPELINE_STAGES_ORDER.length - 1) {
      await updateLeadStage(leadId, PIPELINE_STAGES_ORDER[idx + 1]);
      if (user) fetchDashboard(user.id);
    }
  };

  if (loading && !dashboard) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  if (!dashboard) return null;

  const stats = [
    { label: 'Total Leads', value: dashboard.total_leads, icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Leads Calientes', value: dashboard.hot_leads_count, icon: Flame, color: 'from-red-500 to-orange-500' },
    { label: 'Score Promedio', value: dashboard.avg_score, icon: TrendingUp, color: 'from-amber-500 to-yellow-500' },
    { label: 'Interacciones', value: dashboard.recent_interactions.length, icon: Activity, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-br ${s.color} opacity-10`} />
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-600" />Pipeline de Compradores
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-3 px-0.5">
          {PIPELINE_STAGES_ORDER.map((stage) => {
            const stageLeads = dashboard.leads.filter((l) => l.pipeline_stage === stage);
            return (
              <div key={stage} className="flex-1 min-w-[220px] bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-100">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[stage]}`} />
                    <h3 className="text-xs font-semibold text-gray-700">{PIPELINE_STAGE_LABELS[stage]}</h3>
                    <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[360px] overflow-y-auto">
                  {stageLeads.length === 0 ? (
                    <p className="text-center py-6 text-gray-300 text-[10px]">Sin leads</p>
                  ) : stageLeads.map((lead) => (
                    <div key={lead.id}>
                      <LeadCard lead={lead} onClassify={handleClassify} classifying={classifying === lead.id} />
                      {stage !== 'COMPLETED' && (
                        <button onClick={() => handleAdvanceStage(lead.id, stage)}
                          className="w-full mt-1 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-0.5 cursor-pointer">
                          Avanzar <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Hot Leads + Recent Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hot Leads */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />Leads Calientes
          </h3>
          <div className="space-y-2">
            {dashboard.leads
              .filter((l) => l.classification?.classification === 'HOT_LEAD')
              .map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/50 border border-red-100">
                  <ScoreRing score={lead.classification!.score} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900">{lead.buyer_name}</p>
                    <p className="text-[10px] text-gray-400">{PIPELINE_STAGE_LABELS[lead.pipeline_stage]}</p>
                  </div>
                </div>
              ))}
            {dashboard.leads.filter((l) => l.classification?.classification === 'HOT_LEAD').length === 0 && (
              <p className="text-center py-4 text-gray-300 text-xs">Sin leads calientes aún</p>
            )}
          </div>
        </div>

        {/* Recent Interactions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-600" />Interacciones Recientes
          </h3>
          <div className="max-h-[280px] overflow-y-auto">
            {dashboard.recent_interactions.slice(0, 10).map((inter) => (
              <InteractionItem key={inter.id} interaction={inter} />
            ))}
            {dashboard.recent_interactions.length === 0 && (
              <p className="text-center py-4 text-gray-300 text-xs">Sin interacciones</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
