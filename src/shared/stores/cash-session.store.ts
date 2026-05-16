import { create } from 'zustand';
import { serviceClient } from '@shared/api/service-client';

type CashSessionDto = {
  openedAt: string;
  closedAt: string | null;
  openingAmountCents: number;
  expectedAmountCents: number;
  reportedAmountCents: number | null;
};

type CashSessionState = {
  isOpen: boolean;
  openedAt: string | null;
  closedAt: string | null;
  initialAmountCents: number;
  expectedAmountCents: number;
  closeReportedAmountCents: number;
  loadCashSession: () => Promise<void>;
  openCash: (initialAmountCents?: number, password?: string) => Promise<void>;
  closeCash: (reportedAmountCents?: number, password?: string) => Promise<void>;
};

export const useCashSessionStore = create<CashSessionState>((set, get) => ({
  isOpen: false,
  openedAt: null,
  closedAt: null,
  initialAmountCents: 0,
  expectedAmountCents: 0,
  closeReportedAmountCents: 0,
  loadCashSession: async () => {
    const session = await serviceClient.execute<CashSessionDto | null>('get_current_cash_session');
    if (!session) return set({ isOpen: false });
    set({
      isOpen: true,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmountCents: session.openingAmountCents,
      expectedAmountCents: session.expectedAmountCents,
      closeReportedAmountCents: session.reportedAmountCents ?? 0,
    });
  },
  openCash: async (initialAmountCents = 0, password = '') => {
    const session = await serviceClient.execute<CashSessionDto, { openingAmountCents: number; password: string }>('open_cash_session', { openingAmountCents: initialAmountCents, password });
    set({
      isOpen: true,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      initialAmountCents: session.openingAmountCents,
      expectedAmountCents: session.expectedAmountCents,
      closeReportedAmountCents: session.reportedAmountCents ?? 0,
    });
  },
  closeCash: async (reportedAmountCents = get().expectedAmountCents, password = '') => {
    await serviceClient.execute<void, { reportedAmountCents: number; password: string }>('close_cash_session', { reportedAmountCents, password });
    set({ isOpen: false, closedAt: new Date().toISOString(), closeReportedAmountCents: reportedAmountCents });
  },
}));
