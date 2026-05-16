import { useRef, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@shared/components/ui/button';

type QrCodeBoxProps = {
  value: string;
  onClose?: () => void;
  fileName?: string;
};

export function QrCodeBox({ value, onClose, fileName = 'qrcode.svg' }: QrCodeBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function saveImage() {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="mx-auto grid w-fit place-items-center rounded-md border border-border bg-white p-4">
        <QRCodeSVG value={value} size={220} bgColor="#ffffff" fgColor="#111827" level="M" includeMargin />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" onClick={() => void copyValue()}>
          <Copy className="h-4 w-4" />
          {copied ? 'Copiado' : 'Copiar codigo'}
        </Button>
        <Button type="button" variant="outline" onClick={saveImage}>
          <Download className="h-4 w-4" />
          Salvar imagem
        </Button>
        {onClose && <Button type="button" onClick={onClose}>Fechar</Button>}
      </div>
    </div>
  );
}
