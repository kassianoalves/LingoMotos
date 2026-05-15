import { useEffect } from 'react';

type PosKeyboardShortcuts = {
  onFocusSearch: () => void;
  onCheckout: () => void;
  onClearSale: () => void;
  onPayCash: () => void;
  onPayPix: () => void;
};

export function usePosKeyboardShortcuts({
  onFocusSearch,
  onCheckout,
  onClearSale,
  onPayCash,
  onPayPix,
}: PosKeyboardShortcuts) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (event.key === 'F3') {
        event.preventDefault();
        onFocusSearch();
      }

      if (isTyping && ['F8', 'F9', 'F10', 'Escape'].includes(event.key)) {
        return;
      }

      if (event.key === 'F8') {
        event.preventDefault();
        onCheckout();
      }

      if (event.key === 'F9') {
        event.preventDefault();
        onPayCash();
      }

      if (event.key === 'F10') {
        event.preventDefault();
        onPayPix();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClearSale();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCheckout, onClearSale, onFocusSearch, onPayCash, onPayPix]);
}
