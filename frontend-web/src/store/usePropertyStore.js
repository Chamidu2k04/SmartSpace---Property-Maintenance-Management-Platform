import { create } from 'zustand';
import { propertyService } from '../services/propertyService';

export const usePropertyStore = create((set, get) => ({
  properties: [], leases: [], tenants: [],
  isLoading: false, isSaving: false, error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [properties, leases, tenants] = await Promise.all([
        propertyService.getProperties(), propertyService.getLeases(), propertyService.getTenants(),
      ]);
      set({ properties: properties || [], leases: leases || [], tenants: tenants || [], isLoading: false });
    } catch (error) {
      set({ error, isLoading: false });
    }
  },

  createProperty: async (data) => {
    set({ isSaving: true });
    try {
      await propertyService.createProperty(data);
      await get().loadData();
    } finally {
      set({ isSaving: false });
    }
  },

  createLease: async (data) => {
    set({ isSaving: true });
    try {
      await propertyService.createLease(data);
      await get().loadData();
    } finally {
      set({ isSaving: false });
    }
  },

  runMutation: async (operation) => {
    set({ isSaving: true });
    try {
      await operation();
      await get().loadData();
    } finally {
      set({ isSaving: false });
    }
  },
}));
