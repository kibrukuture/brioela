import { create } from 'zustand';
import type { ShippingAddress } from '@schnl/shared/validators/card-order.validator';

export type CreateCardType = 'virtual' | 'physical';

interface CreateCardFlowState {
  type: CreateCardType | null;
  shippingAddress: ShippingAddress | null;
  orderId: string | null;

  setType: (type: CreateCardType) => void;
  setShippingAddress: (address: ShippingAddress | null) => void;
  setOrderId: (orderId: string | null) => void;
  resetCreateCardFlow: () => void;
}

export const useCreateCardFlowStore = create<CreateCardFlowState>((set) => ({
  type: null,
  shippingAddress: null,
  orderId: null,

  setType: (type) => set({ type }),
  setShippingAddress: (address) => set({ shippingAddress: address }),
  setOrderId: (orderId) => set({ orderId }),

  resetCreateCardFlow: () =>
    set({
      type: null,
      shippingAddress: null,
      orderId: null,
    }),
}));
