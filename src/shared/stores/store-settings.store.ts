import { create } from 'zustand';
import { serviceClient } from '@shared/api/service-client';

export type StoreSettings = {
  name: string;
  documentNumber: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  logo: string;
  theme: string;
  pixKey: string;
  pixReceiverName: string;
  pixReceiverCity: string;
};

const initialSettings: StoreSettings = {
  name: 'LingoMotos',
  documentNumber: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  logo: '',
  theme: 'light',
  pixKey: '',
  pixReceiverName: '',
  pixReceiverCity: '',
};

type SettingsDto = Omit<StoreSettings, 'logo'> & { logoPath: string };

type StoreSettingsState = {
  settings: StoreSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: StoreSettings) => Promise<void>;
};

export const useStoreSettingsStore = create<StoreSettingsState>((set) => ({
  settings: initialSettings,
  loaded: false,
  loadSettings: async () => {
    const settings = await serviceClient.execute<SettingsDto>('get_store_settings');
    set({ settings: fromDto(settings), loaded: true });
  },
  saveSettings: async (settings) => {
    const saved = await serviceClient.execute<SettingsDto, { settings: SettingsDto }>('update_store_settings', {
      settings: toDto(settings),
    });
    set({ settings: fromDto(saved), loaded: true });
  },
}));

function toDto(settings: StoreSettings): SettingsDto {
  return {
    name: settings.name,
    documentNumber: settings.documentNumber,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    logoPath: settings.logo,
    theme: settings.theme,
    pixKey: settings.pixKey,
    pixReceiverName: settings.pixReceiverName,
    pixReceiverCity: settings.pixReceiverCity,
  };
}

function fromDto(settings: SettingsDto): StoreSettings {
  return {
    ...settings,
    logo: settings.logoPath,
  };
}
