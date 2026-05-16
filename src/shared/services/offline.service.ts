import { serviceClient } from '@shared/api/service-client';
import type { BackupInfo, OfflineStatus } from '@shared/types/offline.types';

export const offlineService = {
  status() {
    return serviceClient.execute<OfflineStatus>('offline_status');
  },

  createBackup(password: string) {
    return serviceClient.execute<BackupInfo, { password: string }>('create_database_backup', { password });
  },

  listBackups() {
    return serviceClient.execute<BackupInfo[]>('list_database_backups');
  },

  restoreBackup(backupPath: string, password: string) {
    return serviceClient.execute<BackupInfo, { backupPath: string; password: string }>('restore_database_backup', {
      backupPath,
      password,
    });
  },

  deleteBackup(backupPath: string, password: string) {
    return serviceClient.execute<void, { backupPath: string; password: string }>('delete_database_backup', {
      backupPath,
      password,
    });
  },
};
