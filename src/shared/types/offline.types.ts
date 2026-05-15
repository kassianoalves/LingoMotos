export type BackupInfo = {
  file_name: string;
  path: string;
  size_bytes: number;
  created_at: string;
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

