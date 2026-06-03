import { create } from 'zustand';
import type { CreateBankingRecipientInput } from '@brioela/shared/validators/banking-recipient.validator';

interface RecipientDraftState {
  draft: CreateBankingRecipientInput | null;
  setDraft: (draft: CreateBankingRecipientInput) => void;
  clearDraft: () => void;
}

export const useRecipientDraftStore = create<RecipientDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
