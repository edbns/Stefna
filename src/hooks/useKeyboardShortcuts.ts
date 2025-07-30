import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutAction[];
  enabled?: boolean;
  showToast?: boolean;
}

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
  showToast = false
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      matchingShortcut.action();
      
      if (showToast) {
        toast.success(matchingShortcut.description, {
          duration: 2000,
          position: 'bottom-right',
          style: {
            background: '#2a4152',
            color: '#eee9dd',
            fontFamily: 'Figtree, sans-serif',
            fontSize: '14px'
          }
        });
      }
    }
  }, [enabled, showToast]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcutsRef.current
  };
};

// Helper function to format shortcut display
export const formatShortcut = (shortcut: ShortcutAction): string => {
  const parts: string[] = [];
  
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
};