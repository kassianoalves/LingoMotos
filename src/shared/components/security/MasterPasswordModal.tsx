import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { securityService } from '@shared/services/security.service';
import { DialogBody, DialogShell, StickyDialogFooter } from '@shared/components/layout';

export function MasterPasswordSetupModal({ onCreated }: { onCreated: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  return (
    <DialogShell title="Criar senha master" onClose={() => undefined} className="max-w-[420px]" zIndexClassName="z-[60]">
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
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
        <DialogBody className="grid gap-3">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha master" />
          <Input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirmar senha" />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <StickyDialogFooter>
          <Button type="submit" disabled={password.length < 4 || confirm.length < 4}>Salvar senha</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
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
    <DialogShell title={title} onClose={onCancel} className="max-w-[420px]" zIndexClassName="z-[60]">
      <form
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
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
        <DialogBody className="grid gap-3">
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha master" />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>
        <StickyDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button type="submit" disabled={busy || !password}>{busy ? 'Processando...' : 'Confirmar'}</Button>
        </StickyDialogFooter>
      </form>
    </DialogShell>
  );
}
