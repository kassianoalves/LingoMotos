import { whatsappRepository, type WhatsappSettings } from '../repositories/whatsapp.repository';

export const whatsappService = {
  getSettings() {
    return whatsappRepository.getSettings();
  },
  saveSettings(settings: WhatsappSettings) {
    return whatsappRepository.saveSettings(settings);
  },
};

