import { create } from 'zustand';
import type { LeadCRM2, CreateLeadRequest, UpdateLeadStageRequest } from '../types';

interface LeadState {
  leads: LeadCRM2[];
  loading: boolean;
  fetchLeads: (params?: Record<string, string>) => Promise<void>;
  createLead: (data: CreateLeadRequest) => Promise<LeadCRM2 | null>;
  updateLeadStage: (leadId: string, data: UpdateLeadStageRequest) => Promise<void>;
}

export const useLeadStore = create<LeadState>()((set) => ({
  leads: [],
  loading: false,

  fetchLeads: async (params) => {
    set({ loading: true });
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`/api/leads-crm2${query}`);
      const data = await res.json();
      set({ leads: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createLead: async (data) => {
    try {
      const res = await fetch('/api/leads-crm2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const lead = await res.json();
      set((state) => ({ leads: [...state.leads, lead] }));
      return lead;
    } catch {
      return null;
    }
  },

  updateLeadStage: async (leadId, data) => {
    try {
      const res = await fetch(`/api/leads-crm2/${leadId}/update-stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
      }));
    } catch {
      // silent
    }
  },
}));
