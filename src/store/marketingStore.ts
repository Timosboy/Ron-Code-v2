import { create } from 'zustand';
import type { MarketingCampaign, PropertyAnalytics, PublishContentRequest } from '../types';

interface MarketingState {
  campaign: MarketingCampaign | null;
  analytics: PropertyAnalytics | null;
  loading: boolean;
  publishing: boolean;
  generateMarketing: (propertyId: string) => Promise<void>;
  publishContent: (propertyId: string, req: PublishContentRequest) => Promise<boolean>;
  fetchAnalytics: (propertyId: string) => Promise<void>;
  fetchOwnerAnalytics: (propertyId: string, ownerId: string) => Promise<void>;
  reset: () => void;
}

export const useMarketingStore = create<MarketingState>()((set) => ({
  campaign: null,
  analytics: null,
  loading: false,
  publishing: false,

  generateMarketing: async (propertyId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/properties/${propertyId}/generate-marketing`, {
        method: 'POST',
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ campaign: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  publishContent: async (propertyId, req) => {
    set({ publishing: true });
    try {
      const res = await fetch(`/api/properties/${propertyId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      set({ publishing: false });
      return res.ok;
    } catch {
      set({ publishing: false });
      return false;
    }
  },

  fetchAnalytics: async (propertyId) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/analytics`);
      if (!res.ok) return;
      const data = await res.json();
      set({ analytics: data });
    } catch {
      // silent
    }
  },

  fetchOwnerAnalytics: async (propertyId, ownerId) => {
    try {
      const res = await fetch(`/api/owners/properties/${propertyId}/analytics?owner_id=${ownerId}`);
      if (!res.ok) return;
      const data = await res.json();
      set({ analytics: data });
    } catch {
      // silent
    }
  },

  reset: () => set({ campaign: null, analytics: null }),
}));
