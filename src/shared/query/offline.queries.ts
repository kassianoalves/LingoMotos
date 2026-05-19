import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineService } from '@shared/services/offline.service';

export const offlineQueryKeys = {
  all: ['offline'] as const,
  status: () => [...offlineQueryKeys.all, 'status'] as const,
  backups: () => [...offlineQueryKeys.all, 'backups'] as const,
  autoBackupInterval: () => [...offlineQueryKeys.all, 'auto-backup-interval'] as const,
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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useAutoBackupInterval() {
  return useQuery({
    queryKey: offlineQueryKeys.autoBackupInterval(),
    queryFn: () => offlineService.getAutoBackupIntervalHours(),
    staleTime: 60_000,
  });
}

export function useSaveAutoBackupInterval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (intervalHours: number) => offlineService.setAutoBackupIntervalHours(intervalHours),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.autoBackupInterval() });
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => offlineService.createBackup(password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.backups() });
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.status() });
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ backupPath, password }: { backupPath: string; password: string }) => offlineService.restoreBackup(backupPath, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.backups() });
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.status() });
    },
  });
}

export function useDeleteBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ backupPath, password }: { backupPath: string; password: string }) => offlineService.deleteBackup(backupPath, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.backups() });
      void queryClient.invalidateQueries({ queryKey: offlineQueryKeys.status() });
    },
  });
}
