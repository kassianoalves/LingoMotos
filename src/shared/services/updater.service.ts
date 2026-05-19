import { check, type Update } from '@tauri-apps/plugin-updater';
import { serviceClient } from '@shared/api/service-client';

export type PendingUpdate = Update;

const UPDATE_CHECK_TIMEOUT_MS = 8_000;
const UPDATE_DOWNLOAD_TIMEOUT_MS = 120_000;

export const updaterService = {
  async checkForUpdate() {
    return check({ timeout: UPDATE_CHECK_TIMEOUT_MS });
  },

  async createAutomaticBackup() {
    return serviceClient.execute('create_auto_update_backup');
  },

  async downloadUpdate(update: PendingUpdate) {
    return update.download(undefined, { timeout: UPDATE_DOWNLOAD_TIMEOUT_MS });
  },
};
