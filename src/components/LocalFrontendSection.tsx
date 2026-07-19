/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  RefreshCw,
  Play,
  Pause,
  Terminal,
  MousePointerClick,
  Compass,
  Sparkles,
  ExternalLink,
  Smartphone,
  Monitor,
  Activity,
  Maximize2
} from 'lucide-react';

interface LocalFrontendSectionProps {
  onNotifySync?: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'interaction' | 'simulated' | 'success';
}

export default function LocalFrontendSection({ onNotifySync }: LocalFrontendSectionProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Real-time Simulation States
  const [simActive, setSimActive] = useState(true);
  const [visitorCount, setVisitorCount] = useState(14);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      text: 'Real-time Operator Connection Established with Firestore Stream.',
      type: 'success'
    }
  ]);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2),
        timestamp: new Date().toLocaleTimeString(),
        text,
        type
      },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  // Setup communication message listeners from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'frontend-interaction') {
        addLog(`User Interaction: ${event.data.log}`, 'interaction');
      } else if (event.data?.type === 'frontend-ready') {
        addLog('Handshake completed: Local Frontend website loaded active Firestore configuration.', 'success');
        setIframeLoaded(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Traffic and Event Simulation
  useEffect(() => {
    if (!simActive) return;

    const mockLocations = [
      'Houston, TX', 'London, UK', 'Berlin, DE', 'Toronto, CA', 'Sydney, AU', 
      'Riyadh, SA', 'Singapore', 'New York, NY', 'Chicago, IL', 'Los Angeles, CA'
    ];
    const mockActions = [
      { text: 'viewed Personal Protective Equipment range', type: 'simulated' },
      { text: 'queried active freight cargo shipment status', type: 'simulated' },
      { text: 'requested material specifications catalog via AI Chatbot', type: 'info' },
      { text: 'explored Heavy Excavator and Mobile Crane fleet rates', type: 'simulated' },
      { text: 'submitted quick contact inquiry for marble slabs quote', type: 'success' },
      { text: 'scrolled to core corporate certifications shelf', type: 'simulated' }
    ];

    const interval = setInterval(() => {
      const loc = mockLocations[Math.floor(Math.random() * mockLocations.length)];
      const action = mockActions[Math.floor(Math.random() * mockActions.length)];
      
      // Update stats and logs
      setVisitorCount((prev) => prev + (Math.random() > 0.4 ? 1 : -1));
      addLog(`[Visitor from ${loc}] ${action.text}`, action.type as LogEntry['type']);
    }, 4500);

    return () => clearInterval(interval);
  }, [simActive]);

  // Remote controls posting message to iframe
  const postToIframe = (action: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(action, '*');
      addLog(`Posted remote control instruction: "${action}" to local preview`, 'info');
    } else {
      addLog('Failed to post remote command: IFrame not ready', 'info');
    }
  };

  const handleManualSync = () => {
    postToIframe('reload-config');
    addLog('Triggered manual site config synchronization across active client nodes.', 'success');
    if (onNotifySync) onNotifySync();
  };

  const handleHardReload = () => {
    if (iframeRef.current) {
      setIframeLoaded(false);
      iframeRef.current.src = iframeRef.current.src; // Reload
      addLog('Re-initializing entire container webpage...', 'info');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            <span>Local Frontend Preview & Remote Control Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Analyze, test, and control your public website environment in real-time with remote action triggers and live stream telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleHardReload}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${!iframeLoaded ? 'animate-spin' : ''}`} />
            <span>Reload Frame</span>
          </motion.button>
          
          <motion.a
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            href="/tmp_frontend/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-violet-600/10 cursor-pointer"
          >
            <span>Open New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        </div>
      </div>

      {/* Main Grid: Control Station and Embedded Iframe Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5/12 width): Telemetry, Remote Actions & Controls */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Dashboard Realtime Status Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-150/40 dark:border-emerald-900/30 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Sync Online
              </span>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSimActive(!simActive)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                  simActive 
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' 
                    : 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400'
                }`}
              >
                {simActive ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>Pause Traffic Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Start Traffic Simulation</span>
                  </>
                )}
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <motion.div 
                whileHover={{ y: -1, scale: 1.02 }}
                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl relative overflow-hidden"
              >
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Active Stream Clients</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <motion.span 
                    key={visitorCount}
                    initial={{ scale: 0.8, opacity: 0.5, y: -4 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 12 }}
                    className="text-xl font-black text-slate-800 dark:text-white inline-block font-mono"
                  >
                    {visitorCount}
                  </motion.span>
                  <span className="text-[9.5px] text-emerald-600 font-bold">In-Session</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -1, scale: 1.02 }}
                className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-xl"
              >
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">WebSocket Ping</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-black text-slate-800 dark:text-white font-mono">14ms</span>
                  <span className="text-[9.5px] text-violet-600 font-bold flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
                    </span>
                    Stable
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Manual Sync Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.01, boxShadow: '0 4px 15px rgba(109, 40, 217, 0.2)' }}
              whileTap={{ scale: 0.99 }}
              onClick={handleManualSync}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-pulse" />
              <span>Push Instant Live Configuration Refresh</span>
            </motion.button>
          </motion.div>

          {/* Remote Navigation Actions Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-violet-500 animate-spin-slow" style={{ animationDuration: '8s' }} />
              <span>Interactive Remote Action Triggers</span>
            </h3>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              Click any of the controls below to remotely control the active view, scroll, or open functional dialogs inside the local website iframe preview.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.025, y: -1, backgroundColor: 'rgba(109, 40, 217, 0.04)' }}
                whileTap={{ scale: 0.975 }}
                onClick={() => postToIframe('simulate-scroll-hero')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="truncate">Scroll: Hero</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -1, backgroundColor: 'rgba(99, 102, 241, 0.04)' }}
                whileTap={{ scale: 0.975 }}
                onClick={() => postToIframe('simulate-scroll-services')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Scroll: Services</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -1, backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
                whileTap={{ scale: 0.975 }}
                onClick={() => postToIframe('simulate-scroll-products')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Scroll: Products</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -1, backgroundColor: 'rgba(244, 63, 94, 0.04)' }}
                whileTap={{ scale: 0.975 }}
                onClick={() => postToIframe('simulate-scroll-contact')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">Scroll: Contact</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015, y: -1, backgroundColor: 'rgba(109, 40, 217, 0.04)' }}
                whileTap={{ scale: 0.985 }}
                onClick={() => postToIframe('simulate-open-chat')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer col-span-2"
              >
                <Activity className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="truncate font-bold text-slate-800 dark:text-slate-200">Remotely Trigger Chatbot Toggle</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015, y: -1, backgroundColor: 'rgba(16, 185, 129, 0.04)' }}
                whileTap={{ scale: 0.985 }}
                onClick={() => postToIframe('simulate-open-tracking')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-left transition-all border border-slate-100 dark:border-slate-800 cursor-pointer col-span-2"
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate font-bold text-slate-800 dark:text-slate-200">Remotely Open Cargo Track Modal</span>
              </motion.button>
            </div>
          </div>

          {/* Real-time Telemetry logs terminal */}
          <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl shadow-inner space-y-3 flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Live Activity Telemetry Stream</span>
              </h3>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear Stream
              </motion.button>
            </div>

            <div className="overflow-y-auto font-mono text-[10.5px] leading-relaxed flex-1 pr-2 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Waiting for telemetry signals...</p>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {logs.map((log) => {
                      let colorClass = 'text-slate-400';
                      if (log.type === 'success') colorClass = 'text-emerald-400 font-semibold';
                      else if (log.type === 'interaction') colorClass = 'text-violet-400 font-semibold';
                      else if (log.type === 'simulated') colorClass = 'text-amber-350';

                      return (
                        <motion.div 
                          key={log.id} 
                          initial={{ opacity: 0, x: -10, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="border-b border-slate-800/40 pb-1 flex gap-2 items-start overflow-hidden"
                        >
                          <span className="text-slate-600 shrink-0 font-medium">[{log.timestamp}]</span>
                          <span className={colorClass}>{log.text}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (7/12 width): Embedded Interactive Web IFrame Container */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 p-3.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">Active Frame Sandbox Port</span>
            </div>

            {/* View switcher buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop View</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide transition-all ${
                  viewMode === 'mobile'
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile View</span>
              </button>
            </div>
          </div>

          {/* Iframe wrapper mimicking responsive viewports */}
          <div className="flex justify-center w-full transition-all duration-300">
            <div 
              className={`w-full bg-slate-900 border-4 border-slate-950 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-350 flex flex-col`}
              style={{ 
                maxWidth: viewMode === 'mobile' ? '410px' : '100%',
                height: viewMode === 'mobile' ? '720px' : '650px'
              }}
            >
              {/* Webpage Address Bar Mock */}
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-900 flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block" />
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                </div>
                <div className="flex-1 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800/40 text-[10px] font-mono text-slate-500 truncate flex items-center justify-between">
                  <span className="truncate">https://stonex-heavy-industries.local/home</span>
                  <RefreshCw 
                    className={`w-3 h-3 text-slate-600 hover:text-slate-400 cursor-pointer transition-colors ${!iframeLoaded ? 'animate-spin' : ''}`}
                    onClick={handleHardReload}
                  />
                </div>
              </div>

              {/* Real IFrame */}
              <div className="relative flex-1 bg-white">
                {!iframeLoaded && (
                  <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-3 z-50 animate-fade-in">
                    <div className="w-10 h-10 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest">
                      Establishing Operator Stream Link...
                    </p>
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src="/tmp_frontend/index.html"
                  title="Stonex Cargo Dispatch website preview container"
                  className="w-full h-full border-none bg-white"
                  allow="autoplay"
                  onLoad={() => {
                    // Timeout fallback in case postMessage ready signal isn't triggered
                    setTimeout(() => setIframeLoaded(true), 2500);
                  }}
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
