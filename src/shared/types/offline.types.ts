export type BackupInfo = {
  file_name: string;
  path: string;
  size_bytes: number;
  created_at: string;
  backup_type: 'automatic' | 'pre-update' | 'before-restore' | 'manual-legacy';
};

export type OfflineStatus = {
  mode: string;
  database_path: string;
  data_dir: string;
  backup_dir: string;
  last_backup_at: string | null;
  backup_count: number;
  pending_sync_count: number;
};

export type BackupMaintenance = {
  backup_created: boolean;
  backup: BackupInfo | null;
  deleted_auto_backups: number;
  interval_hours: number;
  next_check_after_ms: number;
};

export type AutoBackupSummary = {
  last_backup_at: string | null;
  last_file_name: string | null;
  status: 'created' | 'restored' | 'failed' | 'pending';
  error_message: string | null;
  next_backup_at: string | null;
  interval_hours: number;
};
