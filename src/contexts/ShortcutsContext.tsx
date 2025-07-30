import React, { createContext, useContext, useState, useCallback } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ShortcutsHelp from '../components/ShortcutsHelp';
import { toast } from 'react-hot-toast';

interface ShortcutsContextType {
  showHelp: () => void;
  hideHelp: () => void;
  isHelpVisible: boolean;
  registerShortcut: (shortcut: any) => void;
  unregisterShortcut: (key: string) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
};

interface ShortcutsProviderProps {
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onCreateContent?: () => void;
}

export const ShortcutsProvider: React.FC<ShortcutsProviderProps> = ({
  children,
  onNavigate,
  onSearch,
  onRefresh,
  onCreateContent
}) => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [dynamicShortcuts, setDynamicShortcuts] = useState<any[]>([]);

  const showHelp = useCallback(() => setIsHelpVisible(true), []);
  const hideHelp = useCallback(() => setIsHelpVisible(false), []);

  const registerShortcut = useCallback((shortcut: any) => {
    setDynamicShortcuts(prev => [...prev.filter(s => s.key !== shortcut.key), shortcut]);
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setDynamicShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  // Global shortcuts
  const globalShortcuts = [
    {
      key: '?',
      action: showHelp,
      description: 'Show keyboard shortcuts help',
      category: 'Help'
    },
    {
      key: 'Escape',
      action: hideHelp,
      description: 'Close modal or help',
      category: 'Navigation'
    },
    {
      key: 'k',
      metaKey: true,
      action: () => onSearch?.(),
      description: 'Open search',
      category: 'Navigation'
    },
    {
      key: 'r',
      action: () => {
        onRefresh?.();
        toast.success('Refreshing data...', {
          duration: 2000,
          position: 'bottom-right',
          style: {
            background: '#2a4152',
            color: '#eee9dd',
            fontFamily: 'Figtree, sans-serif'
          }
        });
      },
      description: 'Refresh data',
      category: 'Actions'
    },
    {
      key: 'c',
      action: () => onCreateContent?.(),
      description: 'Create new content',
      category: 'Actions'
    },
    // Navigation shortcuts
    {
      key: 'd',
      action: () => onNavigate?.('dashboard'),
      description: 'Go to Dashboard',
      category: 'Navigation'
    },
    {
      key: 'a',
      action: () => onNavigate?.('analytics'),
      description: 'Go to Analytics',
      category: 'Navigation'
    },
    {
      key: 'n',
      action: () => onNavigate?.('notifications'),
      description: 'Go to Notifications',
      category: 'Navigation'
    },
    {
      key: 'p',
      action: () => onNavigate?.('profile'),
      description: 'Go to Profile',
      category: 'Navigation'
    },
    // Number shortcuts for tabs
    ...Array.from({ length: 9 }, (_, i) => ({
      key: (i + 1).toString(),
      action: () => {
        const tabs = ['dashboard', 'analytics', 'trending', 'notifications', 'schedule', 'audience', 'settings', 'profile', 'help'];
        if (tabs[i]) {
          onNavigate?.(tabs[i]);
        }
      },
      description: `Switch to tab ${i + 1}`,
      category: 'Navigation'
    }))
  ];

  const allShortcuts = [...globalShortcuts, ...dynamicShortcuts];

  useKeyboardShortcuts({
    shortcuts: allShortcuts,
    enabled: true,
    showToast: false
  });

  return (
    <ShortcutsContext.Provider value={{
      showHelp,
      hideHelp,
      isHelpVisible,
      registerShortcut,
      unregisterShortcut
    }}>
      {children}
      <ShortcutsHelp isOpen={isHelpVisible} onClose={hideHelp} />
    </ShortcutsContext.Provider>
  );
};