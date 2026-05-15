export type WhatsappSettings = {
  apiToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookUrl: string;
  connectionStatus: 'not_configured' | 'configured' | 'disabled';
};

let settings: WhatsappSettings = {
  apiToken: '',
  phoneNumberId: '',
  businessAccountId: '',
  webhookUrl: '',
  connectionStatus: 'not_configured',
};

export const whatsappRepository = {
  getSettings() {
    return Promise.resolve(settings);
  },
  saveSettings(nextSettings: WhatsappSettings) {
    settings = {
      ...nextSettings,
      connectionStatus: nextSettings.apiToken && nextSettings.phoneNumberId ? 'configured' : 'not_configured',
    };
    return Promise.resolve(settings);
  },
};

