import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatShortcut } from '../hooks/useKeyboardShortcuts';

interface ShortcutCategory {
  name: string;
  shortcuts: Array<{
    key: string;
    description: string;
    icon?: React.ComponentType<any>;
  }>;
}

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const shortcutCategories: ShortcutCategory[] = [
    {
      name: 'Navigation',
      shortcuts: [
        { key: '⌘ + K', description: 'Open search', icon: MagnifyingGlassIcon },
        { key: 'G + D', description: 'Go to Dashboard', icon: HomeIcon },
        { key: 'G + A', description: 'Go to Analytics', icon: ChartBarIcon },
        { key: 'G + N', description: 'Go to Notifications', icon: BellIcon },
        { key: 'G + P', description: 'Go to Profile', icon: UserIcon },
        { key: '?', description: 'Show shortcuts help', icon: CommandLineIcon }
      ]
    },
    {
      name: 'Actions',
      shortcuts: [
        { key: 'C', description: 'Create new content', icon: PlusIcon },
        { key: 'R', description: 'Refresh data', icon: ArrowPathIcon },
        { key: 'Escape', description: 'Close modal/menu' },
        { key: '⌘ + Enter', description: 'Submit form' },
        { key: '⌘ + S', description: 'Save changes' }
      ]
    },
    {
      name: 'Content',
      shortcuts: [
        { key: 'J', description: 'Next item' },
        { key: 'K', description: 'Previous item' },
        { key: 'L', description: 'Like/Unlike' },
        { key: 'S', description: 'Share content' },
        { key: 'Enter', description: 'Open content' }
      ]
    },
    {
      name: 'View',
      shortcuts: [
        { key: '1-9', description: 'Switch to tab 1-9' },
        { key: '⌘ + /', description: 'Toggle sidebar' },
        { key: 'F', description: 'Toggle fullscreen' },
        { key: '⌘ + +', description: 'Zoom in' },
        { key: '⌘ + -', description: 'Zoom out' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl border border-[#2a4152]/10 w-full max-w-4xl max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#2a4152]/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#2a4152]/10 rounded-lg">
                    <CommandLineIcon className="w-6 h-6 text-[#2a4152]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#2a4152] font-['Figtree']">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-[#2a4152]/70 font-['Figtree']">
                      Speed up your workflow with these shortcuts
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#2a4152]/5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-[#2a4152]" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {shortcutCategories.map((category, categoryIndex) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: categoryIndex * 0.1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-semibold text-[#2a4152] font-['Figtree'] border-b border-[#2a4152]/10 pb-2">
                        {category.name}
                      </h3>
                      
                      <div className="space-y-3">
                        {category.shortcuts.map((shortcut, index) => {
                          const Icon = shortcut.icon;
                          
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-[#eee9dd]/30 rounded-lg hover:bg-[#eee9dd]/50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                {Icon && (
                                  <Icon className="w-4 h-4 text-[#2a4152]/70" />
                                )}
                                <span className="text-sm text-[#2a4152] font-['Figtree']">
                                  {shortcut.description}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {shortcut.key.split(' + ').map((key, keyIndex) => (
                                  <React.Fragment key={keyIndex}>
                                    {keyIndex > 0 && (
                                      <span className="text-[#2a4152]/40 text-xs font-['Figtree']">
                                        +
                                      </span>
                                    )}
                                    <kbd className="px-2 py-1 bg-white border border-[#2a4152]/20 rounded text-xs font-mono text-[#2a4152] shadow-sm">
                                      {key}
                                    </kbd>
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-[#2a4152]/10 bg-[#eee9dd]/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#2a4152]/70 font-['Figtree']">
                    Press <kbd className="px-2 py-1 bg-white border border-[#2a4152]/20 rounded text-xs font-mono">?</kbd> anytime to open this help
                  </p>
                  
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#2a4152] text-[#eee9dd] rounded-lg hover:bg-[#2a4152]/90 transition-colors font-['Figtree'] font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutsHelp;