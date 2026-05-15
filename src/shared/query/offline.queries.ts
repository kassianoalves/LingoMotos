import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineService } from '@shared/services/offline.service';

export const offlineQueryKeys = {
  all: ['offline'] as const,
  status: () => [...offlineQueryKeys.all, 'status'] as const,
  backups: () => [...offlineQueryKeys.all, 'backups'] as const,
};

export function useOfflineStatus() {
  return useQuery({
    queryKey: offlineQueryKeys.status(),
    queryFn: () => offlineService.status(),
    staleTime: 30_000,
  });
}

export function useBackups() {
  return useQuery({
    queryKey: offlineQueryKeys.backups(),
    queryFn: () => offlineService.listBackups(),
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => offlineService.createBackup(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.all });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (backupPath: string) => offlineService.restoreBackup(backupPath),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.all });
    },
  });
}

