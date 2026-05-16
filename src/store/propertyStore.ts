import { create } from 'zustand';
import type { Property, CreatePropertyRequest, UpdatePropertyStageRequest, User } from '../types';

interface PropertyState {
  properties: Property[];
  agents: User[];
  loading: boolean;
  fetchProperties: (params?: Record<string, string>) => Promise<void>;
  fetchAgents: () => Promise<void>;
  createProperty: (data: CreatePropertyRequest, ownerId: string) => Promise<Property | null>;
  assignAgent: (propertyId: string, agentId: string) => Promise<void>;
  updateStage: (propertyId: string, data: UpdatePropertyStageRequest) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>()((set) => ({
  properties: [],
  agents: [],
  loading: false,

  fetchProperties: async (params) => {
    set({ loading: true });
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`/api/properties${query}`);
      const data = await res.json();
      set({ properties: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAgents: async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      set({ agents: data });
    } catch {
      // silent
    }
  },

  createProperty: async (data, ownerId) => {
    try {
      const res = await fetch(`/api/properties?owner_id=${ownerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const prop = await res.json();
      set((state) => ({ properties: [...state.properties, prop] }));
      return prop;
    } catch {
      return null;
    }
  },

  assignAgent: async (propertyId, agentId) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      set((state) => ({
        properties: state.properties.map((p) => (p.id === propertyId ? updated : p)),
      }));
    } catch {
      // silent
    }
  },

  updateStage: async (propertyId, data) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/update-stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const updated = await res.json();
      set((state) => ({
        properties: state.properties.map((p) => (p.id === propertyId ? updated : p)),
      }));
    } catch {
      // silent
    }
  },
}));
