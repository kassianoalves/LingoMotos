import { serviceClient } from '@shared/api/service-client';
import type { BackupInfo, OfflineStatus } from '@shared/types/offline.types';

export const offlineService = {
  status() {
    return serviceClient.execute<OfflineStatus>('offline_status');
  },

  createBackup() {
    return serviceClient.execute<BackupInfo>('create_backup');
  },

  listBackups() {
    return serviceClient.execute<BackupInfo[]>('list_backups');
  },

  restoreBackup(backupPath: string) {
    return serviceClient.execute<BackupInfo, { backupPath: string }>('restore_backup', {
      backupPath,
    });
  },
};

