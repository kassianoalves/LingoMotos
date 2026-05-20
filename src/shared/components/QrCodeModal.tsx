import { QrCodeBox } from './QrCodeBox';
import { DialogBody, DialogShell } from './layout';

type QrCodeModalProps = {
  title: string;
  description: string;
  value: string;
  onClose: () => void;
  fileName?: string;
};

export function QrCodeModal({ title, description, value, onClose, fileName }: QrCodeModalProps) {
  return (
    <DialogShell title={title} description={description} onClose={onClose} className="max-w-lg" zIndexClassName="z-50">
      <DialogBody>
        <QrCodeBox value={value} onClose={onClose} fileName={fileName} />
        <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
          <p className="break-all text-xs text-muted-foreground">{value}</p>
        </div>
      </DialogBody>
    </DialogShell>
  );
}
