import { CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { PendingUpdate } from '@shared/services/updater.service';

type UpdateAvailableModalProps = {
  currentVersion: string;
  update: PendingUpdate;
  busy: boolean;
  status?: string;
  onClose: () => void;
  onConfirm: () => void;
};

type NotesSection = {
  title: string;
  items: string[];
};

const SECTION_TITLES = ['Adicionado', 'Melhorado', 'Corrigido', 'Removido'] as const;

const SECTION_ALIASES: Record<string, (typeof SECTION_TITLES)[number]> = {
  adicionado: 'Adicionado',
  adicionados: 'Adicionado',
  added: 'Adicionado',
  novo: 'Adicionado',
  novos: 'Adicionado',
  novidades: 'Adicionado',
  melhorado: 'Melhorado',
  melhorados: 'Melhorado',
  melhorias: 'Melhorado',
  changed: 'Melhorado',
  improved: 'Melhorado',
  aprimorado: 'Melhorado',
  corrigido: 'Corrigido',
  corrigidos: 'Corrigido',
  correcoes: 'Corrigido',
  correcao: 'Corrigido',
  fixed: 'Corrigido',
  bugfixes: 'Corrigido',
  remocao: 'Removido',
  remocoes: 'Removido',
  removido: 'Removido',
  removidos: 'Removido',
  removed: 'Removido',
};

export function UpdateAvailableModal({
  currentVersion,
  update,
  busy,
  status,
  onClose,
  onConfirm,
}: UpdateAvailableModalProps) {
  const notes = normalizeNotes(update.body);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl"
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">LingoMotos</p>
              <h2 id="update-title" className="mt-1 text-xl font-semibold">
                Atualização disponível
              </h2>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-6 py-5">
          <div className="grid gap-3 rounded-md border border-border bg-background p-4 text-sm sm:grid-cols-2">
            <VersionField label="Versão atual" value={formatVersion(update.currentVersion || currentVersion)} />
            <VersionField label="Nova versão" value={formatVersion(update.version)} strong />
          </div>

          <div className="mt-5 rounded-md border border-border bg-background">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">O que há de novo</h3>
                <p className="text-xs text-muted-foreground">Notas da versão publicadas no canal de atualização.</p>
              </div>
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            </div>
            <div className="max-h-[34vh] overflow-y-auto px-4 py-4">
              <div className="space-y-5">
                {notes.map((section) => (
                  <section key={section.title}>
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {section.title}
                    </h4>
                    <ul className="mt-2 space-y-2 pl-6 text-sm text-muted-foreground">
                      {section.items.map((item) => (
                        <li key={`${section.title}-${item}`} className="list-disc leading-6">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            O instalador será validado pelo atualizador antes da instalação. O banco SQLite e os backups locais não serão apagados.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <span className="min-h-5 text-xs text-muted-foreground">{busy ? status || 'Preparando atualização...' : ''}</span>
          <div className="flex shrink-0 justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Agora não
            </Button>
            <Button onClick={onConfirm} disabled={busy}>
              {busy ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function VersionField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? 'mt-1 text-base font-semibold text-primary' : 'mt-1 text-base font-semibold'}>{value}</p>
    </div>
  );
}

function normalizeNotes(body?: string | null): NotesSection[] {
  const fallback = 'Esta versão contém melhorias e correções.';
  const rawLines = (body ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return [{ title: 'Melhorado', items: [fallback] }];
  }

  const sections = new Map<(typeof SECTION_TITLES)[number], string[]>();
  let activeSection: (typeof SECTION_TITLES)[number] | null = null;

  for (const rawLine of rawLines) {
    const heading = parseHeading(rawLine);
    if (heading) {
      activeSection = heading;
      if (!sections.has(activeSection)) sections.set(activeSection, []);
      continue;
    }

    const item = cleanListItem(rawLine);
    if (!item) continue;

    const target = activeSection ?? 'Melhorado';
    sections.set(target, [...(sections.get(target) ?? []), item]);
  }

  const normalized = SECTION_TITLES.map((title) => ({
    title,
    items: sections.get(title) ?? [],
  })).filter((section) => section.items.length > 0);

  return normalized.length > 0 ? normalized : [{ title: 'Melhorado', items: [fallback] }];
}

function parseHeading(line: string): (typeof SECTION_TITLES)[number] | null {
  const normalized = line
    .replace(/^#{1,6}\s*/, '')
    .replace(/:$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized === 'remocoes' || normalized === 'remocao') {
    return 'Removido';
  }

  return SECTION_ALIASES[normalized] ?? null;
}

function cleanListItem(line: string) {
  return line
    .replace(/^[-*+]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^#{1,6}\s*/, '')
    .trim();
}

function formatVersion(value: string) {
  const clean = value.trim();
  return clean.startsWith('v') || clean.startsWith('V') ? clean : `v${clean}`;
}
