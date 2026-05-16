import { QrCodeBox } from './QrCodeBox';

type QrCodeModalProps = {
  title: string;
  description: string;
  value: string;
  onClose: () => void;
  fileName?: string;
};

export function QrCodeModal({ title, description, value, onClose, fileName }: QrCodeModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-lg">
        <div className="mb-5 space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <QrCodeBox value={value} onClose={onClose} fileName={fileName} />
        <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
          <p className="break-all text-xs text-muted-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
