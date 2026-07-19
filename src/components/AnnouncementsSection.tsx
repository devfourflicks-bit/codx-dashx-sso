/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Megaphone, Save, Loader2, Play, AlertCircle } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';

interface AnnouncementsSectionProps {
  announcementsData: string[] | null;
  onSave: (items: string[]) => void;
}

export default function AnnouncementsSection({ announcementsData, onSave }: AnnouncementsSectionProps) {
  const { confirm } = useConfirm();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (announcementsData) {
      setText(announcementsData.join('\n'));
    }
  }, [announcementsData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm({
      title: 'Save Announcements Ticker',
      message: 'Are you sure you want to write the modified marquee announcements slide list to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        const items = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        try {
          try {
            await setDoc(doc(db, 'siteConfig', 'announcements'), { items }, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/announcements');
          }
          onSave(items);
        } catch (err) {
          console.error('Error saving announcements ticker list:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const parsedLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-4xl">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Failed to Save Announcements</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Announcements Ticker
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Manage running marquee announcements displayed on the top bar ticker line.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Announcements List (One per line)</span>
            <span className="text-violet-500 font-bold">{parsedLines.length} active slide(s)</span>
          </label>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Free shipping on bulk marble orders this week!&#10;New batch of premium black granite blocks now in stock.&#10;Consult our experts for custom residential landscaping designs."
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-2xl text-sm leading-relaxed outline-none focus:border-violet-500 font-mono"
          />
        </div>

        {parsedLines.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-slate-400" />
              Live Marquee Preview
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl overflow-hidden relative">
              <div className="flex gap-12 whitespace-nowrap animate-marquee text-xs font-bold text-slate-700 dark:text-slate-300">
                {parsedLines.map((line, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-75 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Announcements...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Announcements</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
