/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Search, ExternalLink, CheckCircle, Download, Loader2, Globe, ChevronDown, Cpu, Terminal } from 'lucide-react';
import { downloadFullProject, downloadDashboardProject, downloadFrontendProject } from '../lib/projectDownloader';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  saveStatus: string | null;
  userEmail: string | null;
  liveSiteUrl: string;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  saveStatus,
  userEmail,
  liveSiteUrl
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [siteCoreOpen, setSiteCoreOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'frontend' | 'dashboard' | 'full'>('idle');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const displayEmail = userEmail ? userEmail.split('@')[0] : 'Admin';
  const avatarUrl = `https://ui-avatars.com/api/?name=${displayEmail}&background=f0edff&color=7854f7&bold=true`;

  const handleDownloadFrontend = async () => {
    setDownloadStatus('frontend');
    try {
      await downloadFrontendProject();
    } catch (err) {
      console.error('Failed to download frontend ZIP:', err);
    } finally {
      setDownloadStatus('idle');
      setSiteCoreOpen(false);
    }
  };

  const handleDownloadDashboard = async () => {
    setDownloadStatus('dashboard');
    try {
      await downloadDashboardProject();
    } catch (err) {
      console.error('Failed to download admin ZIP:', err);
    } finally {
      setDownloadStatus('idle');
      setSiteCoreOpen(false);
    }
  };

  const handleDownloadFull = async () => {
    setDownloadStatus('full');
    try {
      await downloadFullProject();
    } catch (err) {
      console.error('Failed to download project ZIP:', err);
    } finally {
      setDownloadStatus('idle');
      setSiteCoreOpen(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-30 relative">
      <div className="relative w-80">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search fields or sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all text-slate-800 dark:text-white"
        />
      </div>

      <div className="flex items-center gap-6">
        {saveStatus && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{saveStatus}</span>
          </div>
        )}

        <div className="flex flex-col items-end text-right border-r border-slate-100 dark:border-slate-800 pr-5 select-none shrink-0 font-mono">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">{timeString}</span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{dateString}</span>
        </div>

        <a
          href="/tmp_frontend/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-200 shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <span>View Local Frontends</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Site Core Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSiteCoreOpen(!siteCoreOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/15 hover:shadow-violet-600/25 active:scale-95 cursor-pointer"
          >
            <Cpu className={`w-3.5 h-3.5 ${downloadStatus !== 'idle' ? 'animate-spin text-emerald-300' : ''}`} />
            <span>Site Core</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${siteCoreOpen ? 'rotate-180' : ''}`} />
          </button>

          {siteCoreOpen && (
            <>
              {/* Back drop to close */}
              <div className="fixed inset-0 z-10" onClick={() => setSiteCoreOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-3 animate-fade-in space-y-1">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-1.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider font-display">Project Downloads</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    Download customized workspaces or the full bundle source code.
                  </p>
                </div>

                {/* Option 1: Frontend Website Only */}
                <button
                  onClick={handleDownloadFrontend}
                  disabled={downloadStatus !== 'idle'}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/60 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                      <span>Frontend Download</span>
                      {downloadStatus === 'frontend' && <Loader2 className="w-3 h-3 animate-spin text-violet-500" />}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                      Client-facing customer landing pages and logistics site (.zip)
                    </p>
                  </div>
                </button>

                {/* Option 2: Admin Dashboard Code */}
                <button
                  onClick={handleDownloadDashboard}
                  disabled={downloadStatus !== 'idle'}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-950/60 text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                      <span>Dashboard Download</span>
                      {downloadStatus === 'dashboard' && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                      React + Vite dashboard editor workspace project (.zip)
                    </p>
                  </div>
                </button>

                {/* Option 3: Full Package Bundle */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                  <button
                    onClick={handleDownloadFull}
                    disabled={downloadStatus !== 'idle'}
                    className="w-full flex items-start gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-950 text-left transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-display">
                        <span>Download Project</span>
                        {downloadStatus === 'full' && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                        Triggers zip generation of administrative dashboard and frontend separately
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800 py-1.5 shrink-0">
          <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full shadow-inner bg-slate-50 dark:bg-slate-950 ring-2 ring-violet-500/10" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
            {displayEmail}
          </span>
        </div>
      </div>
    </header>
  );
}
