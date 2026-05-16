import { useEffect, useState } from 'react';
import { AppShell } from './layout/AppShell';
import { MasterPasswordSetupModal } from '@shared/components/security/MasterPasswordModal';
import { securityService } from '@shared/services/security.service';

export function App() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    void securityService.isConfigured().then(setConfigured);
  }, []);

  if (configured === null) return null;
  return (
    <>
      <AppShell />
      {!configured && <MasterPasswordSetupModal onCreated={() => setConfigured(true)} />}
    </>
  );
}
