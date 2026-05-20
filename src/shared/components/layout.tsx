import type { HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Button } from './ui/button';

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-full min-h-0 flex-col overflow-hidden px-5 pb-5 pt-4 compact:px-4 compact:pb-4 compact:pt-3', className)}
      {...props}
    />
  );
}

export function ScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-h-0 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

export function DialogShell({
  title,
  description,
  onClose,
  className,
  children,
  zIndexClassName = 'z-40',
}: {
  title: string;
  description?: string;
  onClose: () => void;
  className?: string;
  zIndexClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('fixed inset-0 grid place-items-center bg-background/80 p-4 backdrop-blur-sm', zIndexClassName)}>
      <div
        className={cn(
          'flex max-h-[90vh] w-full max-w-2xl min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg',
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex flex-none items-start justify-between gap-4 border-b border-border bg-card px-5 py-4 compact:px-4 compact:py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ScrollArea className={cn('flex-1 px-5 py-4 compact:px-4 compact:py-3', className)} {...props} />;
}

export function StickyDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 flex flex-none flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-3 compact:px-4 compact:py-2',
        className,
      )}
      {...props}
    />
  );
}

export function DrawerShell({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn('fixed inset-y-0 right-0 z-30 flex max-h-screen w-[420px] min-h-0 flex-col overflow-hidden border-l border-border bg-card shadow-lg', className)}
      {...props}
    />
  );
}
