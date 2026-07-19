/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, Save, FileEdit, X, Loader2 } from 'lucide-react';

export type ConfirmType = 'save' | 'delete' | 'update' | 'critical';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

interface ConfirmProviderProps {
  children: React.ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = (newOptions: ConfirmOptions) => {
    setOptions(newOptions);
    setLoading(false);
  };

  const handleCancel = () => {
    if (loading) return;
    if (options?.onCancel) {
      options.onCancel();
    }
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (!options || loading) return;
    setLoading(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } catch (err) {
      console.error('Error during confirmed action execution:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: ConfirmType = 'save') => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-rose-500" />;
      case 'update':
        return <FileEdit className="w-6 h-6 text-blue-500" />;
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'save':
      default:
        return <Save className="w-6 h-6 text-emerald-500" />;
    }
  };

  const getThemeClasses = (type: ConfirmType = 'save') => {
    switch (type) {
      case 'delete':
        return {
          iconBg: 'bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 dark:shadow-none focus:ring-rose-500',
        };
      case 'update':
        return {
          iconBg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none focus:ring-blue-500',
        };
      case 'critical':
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200 dark:shadow-none focus:ring-amber-500',
        };
      case 'save':
      default:
        return {
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 dark:shadow-none focus:ring-emerald-500',
        };
    }
  };

  const currentTheme = options ? getThemeClasses(options.type) : null;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && currentTheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              {/* Top Banner / Corner Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-slate-150 dark:via-slate-700 to-transparent" />

              {/* Header section with Close Button */}
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-5">
                {/* Visual Icon Badge */}
                <div className={`p-4 rounded-2xl ${currentTheme.iconBg} flex items-center justify-center`}>
                  {getIcon(options.type)}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white leading-snug">
                    {options.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                    {options.message}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 w-full pt-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 px-5 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={loading}
                    className={`flex-1 px-5 py-3 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 focus:outline-none focus:ring-2 ${currentTheme.confirmBtn}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{options.confirmText || (options.type === 'delete' ? 'Delete' : 'Save Changes')}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
