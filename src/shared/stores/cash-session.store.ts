import { create } from 'zustand';

type CashSessionState = {
  isOpen: boolean;
  openedAt: string | null;
  closedAt: string | null;
  initialAmountCents: number;
  expectedAmountCents: number;
  closeReportedAmountCents: number;
  openCash: (initialAmountCents?: number) => void;
  closeCash: (reportedAmountCents?: number) => void;
};

export const useCashSessionStore = create<CashSessionState>((set, get) => ({
  isOpen: false,
  openedAt: null,
  closedAt: null,
  initialAmountCents: 0,
  expectedAmountCents: 0,
  closeReportedAmountCents: 0,
  openCash: (initialAmountCents = 0) =>
    set({
      isOpen: true,
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialAmountCents,
      expectedAmountCents: initialAmountCents,
      closeReportedAmountCents: 0,
    }),
  closeCash: (reportedAmountCents = get().expectedAmountCents) =>
    set({
      isOpen: false,
      closedAt: new Date().toISOString(),
      closeReportedAmountCents: reportedAmountCents,
    }),
}));

