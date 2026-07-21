import { create } from 'zustand';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmStore {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isPending: boolean;
  showConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;
  setPending: (pending: boolean) => void;
}

export const useConfirm = create<ConfirmStore>((set) => ({
  isOpen: false,
  options: null,
  isPending: false,
  showConfirm: (options) => set({ isOpen: true, options, isPending: false }),
  closeConfirm: () => set({ isOpen: false, isPending: false }),
  setPending: (pending) => set({ isPending: pending })
}));
