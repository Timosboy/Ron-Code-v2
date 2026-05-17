import { create } from 'zustand';
import type {
  Property,
  CreatePropertyRequest,
  UpdatePropertyStageRequest,
  User,
  PanoramaUploadUrlResponse,
} from '../types';

interface PropertyState {
  properties: Property[];
  agents: User[];
  loading: boolean;
  fetchProperties: (params?: Record<string, string>) => Promise<void>;
  fetchAgents: () => Promise<void>;
  createProperty: (data: CreatePropertyRequest, ownerId: string) => Promise<Property | null>;
  assignAgent: (propertyId: string, agentId: string) => Promise<void>;
  updateStage: (propertyId: string, data: UpdatePropertyStageRequest) => Promise<void>;
  requestPanoramaUploadUrl: (
    propertyId: string,
    agentId: string,
    contentType: string,
  ) => Promise<PanoramaUploadUrlResponse>;
  confirmPanorama: (
    propertyId: string,
    agentId: string,
    panoramaUrl: string,
    label?: string,
  ) => Promise<Property>;
  deletePanorama: (propertyId: string, agentId: string) => Promise<Property>;
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

  requestPanoramaUploadUrl: async (propertyId, agentId, contentType) => {
    const res = await fetch(`/api/properties/${propertyId}/panorama/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, content_type: contentType }),
    });
    const data = await res.json();
    if (!res.ok) {
      const detail = data.detail;
      throw new Error(typeof detail === 'string' ? detail : 'No se pudo obtener URL de subida');
    }
    return data as PanoramaUploadUrlResponse;
  },

  confirmPanorama: async (propertyId, agentId, panoramaUrl, label) => {
    const res = await fetch(`/api/properties/${propertyId}/panorama`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: agentId,
        panorama_url: panoramaUrl,
        panorama_label: label,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const detail = data.detail;
      throw new Error(typeof detail === 'string' ? detail : 'No se pudo guardar el tour');
    }
    const updated = data as Property;
    set((state) => ({
      properties: state.properties.map((p) => (p.id === propertyId ? updated : p)),
    }));
    return updated;
  },

  deletePanorama: async (propertyId, agentId) => {
    const res = await fetch(
      `/api/properties/${propertyId}/panorama?agent_id=${encodeURIComponent(agentId)}`,
      { method: 'DELETE' },
    );
    const data = await res.json();
    if (!res.ok) {
      const detail = data.detail;
      throw new Error(typeof detail === 'string' ? detail : 'No se pudo eliminar el tour');
    }
    const updated = data as Property;
    set((state) => ({
      properties: state.properties.map((p) => (p.id === propertyId ? updated : p)),
    }));
    return updated;
  },
}));
