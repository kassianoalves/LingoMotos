import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { securityService } from '@shared/services/security.service';

export function MasterPasswordSetupModal({ onCreated }: { onCreated: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/90 backdrop-blur-sm">
      <form
        className="w-[420px] rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={async (event) => {
          event.preventDefault();
          if (password !== confirm) {
            setError('As senhas nao conferem.');
            return;
          }
          try {
            await securityService.setPassword(password);
            onCreated();
          } catch (caught) {
            console.error(caught);
            setError('Erro ao salvar.');
          }
        }}
      >
        <h2 className="text-base font-semibold">Criar senha master</h2>
        <div className="mt-4 grid gap-3">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha master" />
          <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirmar senha" />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={password.length < 4 || confirm.length < 4}>Salvar senha</Button>
        </div>
      </form>
    </div>
  );
}

export function MasterPasswordVerifyModal({
  title,
  onCancel,
  onVerified,
}: {
  title: string;
  onCancel: () => void;
  onVerified: (password: string) => Promise<void> | void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/90 backdrop-blur-sm">
      <form
        className="w-[420px] rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          console.time('master-password-flow');
          try {
            await onVerified(password);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Erro ao concluir operacao.');
          } finally {
            console.timeEnd('master-password-flow');
            setBusy(false);
          }
        }}
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-4 grid gap-3">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha master" />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button type="submit" disabled={busy || !password}>{busy ? 'Processando...' : 'Confirmar'}</Button>
        </div>
      </form>
    </div>
  );
}
