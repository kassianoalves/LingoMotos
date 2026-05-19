import { serviceClient } from '@shared/api/service-client';
import type { BackupInfo, BackupMaintenance, OfflineStatus } from '@shared/types/offline.types';

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

  ensureAutoBackup() {
    return serviceClient.execute<BackupMaintenance>('ensure_auto_backup');
  },

  getAutoBackupIntervalHours() {
    return serviceClient.execute<number>('get_auto_backup_interval_hours');
  },

  setAutoBackupIntervalHours(intervalHours: number) {
    return serviceClient.execute<number, { intervalHours: number }>('set_auto_backup_interval_hours', { intervalHours });
  },

  cleanupOldAutoBackups() {
    return serviceClient.execute<number>('cleanup_old_auto_backups');
  },

  openBackupFolder() {
    return serviceClient.execute<void>('open_backup_folder');
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
