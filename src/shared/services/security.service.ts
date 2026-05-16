import { serviceClient } from '@shared/api/service-client';

export const securityService = {
  isConfigured() {
    return serviceClient.execute<boolean>('is_master_password_configured');
  },
  setPassword(password: string) {
    return serviceClient.execute<void, { password: string }>('set_master_password', { password });
  },
  verifyPassword(password: string) {
    return serviceClient.execute<boolean, { password: string }>('verify_master_password', { password });
  },
  factoryReset(password: string) {
    return serviceClient.execute<void, { password: string }>('factory_reset', { password });
  },
};
