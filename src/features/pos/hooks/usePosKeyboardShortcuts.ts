import { useEffect } from 'react';

type PosKeyboardShortcuts = {
  onClearSale: () => void;
  enabled?: boolean;
};

export function usePosKeyboardShortcuts({
  onClearSale,
  enabled = true,
}: PosKeyboardShortcuts) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (isTyping && event.key === 'Escape') {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClearSale();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onClearSale]);
}
