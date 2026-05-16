import { create } from 'zustand';
import type { FinancialGoal } from '../types/finance.types';
import { serviceClient } from '@shared/api/service-client';

type FinancialGoalsState = {
  goals: FinancialGoal[];
  loadGoals: () => Promise<void>;
  saveGoal: (goal: FinancialGoal) => Promise<void>;
};

export const useFinancialGoalsStore = create<FinancialGoalsState>((set) => ({
  goals: [],
  loadGoals: async () => {
    const goals = await serviceClient.execute<FinancialGoal[]>('list_financial_goals');
    set({ goals });
  },
  saveGoal: async (goal) => {
    const saved = await serviceClient.execute<FinancialGoal, { goal: FinancialGoal }>('save_financial_goal', { goal });
    set((state) => ({
      goals: [saved, ...state.goals.filter((item) => item.id !== saved.id)],
    }));
  },
}));
