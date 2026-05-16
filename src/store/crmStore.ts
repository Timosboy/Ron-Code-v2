import { create } from 'zustand';
import type { DashboardData, PipelineStage, LeadClassification, EnrichedLead } from '../types';

interface CRMState {
  dashboard: DashboardData | null;
  pipeline: Record<string, EnrichedLead[]> | null;
  loading: boolean;
  classifying: string | null;

  fetchDashboard: (agentId: string) => Promise<void>;
  fetchPipeline: (agentId: string) => Promise<void>;
  updateLeadStage: (leadId: string, stage: PipelineStage) => Promise<void>;
  classifyLead: (leadId: string) => Promise<LeadClassification | null>;
}

export const useCRMStore = create<CRMState>()((set, get) => ({
  dashboard: null,
  pipeline: null,
  loading: false,
  classifying: null,

  fetchDashboard: async (agentId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/agents/${agentId}/dashboard`);
      const data = await res.json();
      set({ dashboard: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchPipeline: async (agentId) => {
    try {
      const res = await fetch(`/api/agents/leads/pipeline?agent_id=${agentId}`);
      const data = await res.json();
      set({ pipeline: data });
    } catch {
      // silent
    }
  },

  updateLeadStage: async (leadId, stage) => {
    try {
      await fetch(`/api/agents/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
    } catch {
      // silent
    }
  },

  classifyLead: async (leadId) => {
    set({ classifying: leadId });
    try {
      const res = await fetch(`/api/agents/leads/${leadId}/classify`, {
        method: 'POST',
      });
      if (!res.ok) return null;
      const data = await res.json();
      set({ classifying: null });
      return data;
    } catch {
      set({ classifying: null });
      return null;
    }
  },
}));
