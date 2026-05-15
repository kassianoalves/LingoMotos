import { useEffect } from 'react';
import { appShortcuts } from './shortcuts';

type GlobalShortcutHandlers = {
  navigate: (route: string) => void;
  toggleTheme: () => void;
  showCash: () => void;
  focusSearch: () => void;
};

export function useGlobalShortcuts({ navigate, toggleTheme, showCash, focusSearch }: GlobalShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const shortcut = appShortcuts.find((item) => item.key === event.key);

      if (!shortcut) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (isTyping && shortcut.dangerous) {
        return;
      }

      event.preventDefault();

      if ('route' in shortcut) {
        navigate(shortcut.route);
        return;
      }

      if (shortcut.action === 'toggleTheme') {
        toggleTheme();
      }

      if (shortcut.action === 'cash') {
        showCash();
      }

      if (shortcut.action === 'searchProduct') {
        focusSearch();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusSearch, navigate, showCash, toggleTheme]);
}

