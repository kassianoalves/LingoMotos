INSERT OR IGNORE INTO settings (key, value, value_type, group_name, description, is_system)
VALUES (
  'auto_backup_interval_hours',
  '6',
  'number',
  'backup',
  'Intervalo em horas para criacao automatica de backups locais',
  0
);
