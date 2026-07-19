/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Shield,
  UserCheck,
  Briefcase,
  Sparkles,
  User,
  Truck,
  Search,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Boxes
} from 'lucide-react';

interface LoginOverlayProps {
  onLoginSuccess: () => void;
}

interface Shipment {
  id: string;
  orderId: string;
  destination: string;
  carrier: 'FedEx' | 'DHL' | 'UPS' | 'Local';
  trackingNumber: string;
  status: 'In Transit' | 'Out for Delivery' | 'Exception / Delay' | 'Delivered' | 'Pending Label';
  milestone: number;
  lastUpdate: string;
  weight: string;
  dimensions: string;
  recipient: string;
  address: string;
  shippingMethod: string;
  createdDate: string;
}

const PRESET_ROLES = [
  {
    role: 'Developer',
    email: 'sanjoobjayamohan@gmail.com',
    password: 'stonex123',
    desc: 'Full workspace controls',
    icon: Shield,
    color: 'border-indigo-500/10 hover:border-indigo-500/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10',
    badgeBg: 'bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/30'
  },
  {
    role: 'Admin',
    email: 'admin@stonex.com',
    password: 'stonex123',
    desc: 'Core settings & role registry',
    icon: UserCheck,
    color: 'border-rose-500/10 hover:border-rose-500/30 hover:bg-rose-50/20 dark:hover:bg-rose-950/10',
    badgeBg: 'bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/30'
  },
  {
    role: 'Sales Associate',
    email: 'sales@stonex.com',
    password: 'stonex123',
    desc: 'Manage product catalog & leads',
    icon: Briefcase,
    color: 'border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10',
    badgeBg: 'bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  {
    role: 'Marketing Associate',
    email: 'marketing@stonex.com',
    password: 'stonex123',
    desc: 'Hero, services & announcements',
    icon: Sparkles,
    color: 'border-sky-500/10 hover:border-sky-500/30 hover:bg-sky-50/20 dark:hover:bg-sky-950/10',
    badgeBg: 'bg-sky-50/50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-50 dark:bg-sky-950/30'
  }
];

export default function LoginOverlay({ onLoginSuccess }: LoginOverlayProps) {
  const [activeTab, setActiveTab] = useState<'track' | 'login'>('track');

  // Dynamic theme customization
  const [loginBgUrl, setLoginBgUrl] = useState('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80');
  const [loginOverlayColor, setLoginOverlayColor] = useState('#0f172a');
  const [loginOverlayOpacity, setLoginOverlayOpacity] = useState(0.2);
  const [loginBlurLevel, setLoginBlurLevel] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [loginCardBg, setLoginCardBg] = useState('rgba(255, 255, 255, 0.7)');
  const [loginCardBorder, setLoginCardBorder] = useState('rgba(255, 255, 255, 0.5)');
  const [loginPrimaryBtnBg, setLoginPrimaryBtnBg] = useState('#0f172a');
  const [loginPrimaryBtnText, setLoginPrimaryBtnText] = useState('#ffffff');

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const themeSnap = await getDoc(doc(db, 'siteConfig', 'theme'));
        if (themeSnap.exists()) {
          const themeData = themeSnap.data();
          if (themeData.loginTheme) {
            if (themeData.loginTheme.bgUrl) setLoginBgUrl(themeData.loginTheme.bgUrl);
            if (themeData.loginTheme.overlayColor) setLoginOverlayColor(themeData.loginTheme.overlayColor);
            if (themeData.loginTheme.overlayOpacity !== undefined) setLoginOverlayOpacity(themeData.loginTheme.overlayOpacity);
            if (themeData.loginTheme.blurLevel) setLoginBlurLevel(themeData.loginTheme.blurLevel);
            if (themeData.loginTheme.cardBg) setLoginCardBg(themeData.loginTheme.cardBg);
            if (themeData.loginTheme.cardBorder) setLoginCardBorder(themeData.loginTheme.cardBorder);
            if (themeData.loginTheme.primaryBtnBg) setLoginPrimaryBtnBg(themeData.loginTheme.primaryBtnBg);
            if (themeData.loginTheme.primaryBtnText) setLoginPrimaryBtnText(themeData.loginTheme.primaryBtnText);
          }
        }
      } catch (err) {
        console.warn('Could not load custom login theme properties, using defaults.', err);
      }
    };
    fetchTheme();
  }, []);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [loginError, setLoginError] = useState('');

  // Tracking states
  const [trackQuery, setTrackQuery] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);

  // Inquiry states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Preset tracking IDs to help users test
  const demoTrackingIds = ['773921849120', 'JD0146382012', '#10482', '#10481'];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePresetSelect = async (idx: number) => {
    const preset = PRESET_ROLES[idx];
    setEmail(preset.email);
    setPassword(preset.password);
    setLoginLoading(true);
    setActivePresetIndex(idx);
    setLoginError('');

    try {
      await signInWithEmailAndPassword(auth, preset.email, preset.password);
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, preset.email, preset.password);
          try {
            await setDoc(doc(db, 'siteConfig', 'userRoles'), {
              [preset.email.toLowerCase()]: preset.role
            }, { merge: true });
          } catch (dbErr) {
            console.error('Firestore role mapping error:', dbErr);
          }
          onLoginSuccess();
        } catch (createErr: any) {
          console.error('Preset auto-creation failed:', createErr);
          setLoginError(`Auto-registration failed: ${createErr.message}`);
        }
      } else {
        setLoginError(err.message || 'Credential mismatch or permission error.');
      }
    } finally {
      setLoginLoading(false);
      setActivePresetIndex(null);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    const targetQuery = (typeof e === 'string' ? e : trackQuery).trim();
    if (!targetQuery) return;

    setTrackLoading(true);
    setTrackError('');
    setTrackedShipment(null);
    setInquirySuccess(false);

    try {
      const snap = await getDoc(doc(db, 'siteConfig', 'logistics'));
      if (snap.exists() && snap.data().shipments) {
        const shipments: Shipment[] = snap.data().shipments;
        const cleanQuery = targetQuery.toLowerCase().replace('#', '');
        const found = shipments.find(s => 
          s.trackingNumber.toLowerCase() === cleanQuery ||
          s.orderId.toLowerCase().replace('#', '') === cleanQuery ||
          s.id.toLowerCase().replace('sh-', '') === cleanQuery
        );

        if (found) {
          setTrackedShipment(found);
          setTrackQuery(found.trackingNumber);
        } else {
          setTrackError(`No active shipment found matching "${targetQuery}". Check the tracking ID and try again.`);
        }
      } else {
        // Fallback default mock lookup
        const demoShipments: Shipment[] = [
          {
            id: "SH-10482",
            orderId: "#10482",
            destination: "New York, US",
            carrier: "FedEx",
            trackingNumber: "773921849120",
            status: "In Transit",
            milestone: 3,
            lastUpdate: "Arrived at FedEx sorting facility, Memphis TN",
            weight: "4.2 kg",
            dimensions: "30x20x15 cm",
            recipient: "Jane Doe",
            address: "5th Avenue, Suite 120, New York, NY 10001, US",
            shippingMethod: "FedEx Standard Overnight",
            createdDate: "2026-07-14"
          },
          {
            id: "SH-10481",
            orderId: "#10481",
            destination: "London, UK",
            carrier: "DHL",
            trackingNumber: "JD0146382012",
            status: "Out for Delivery",
            milestone: 4,
            lastUpdate: "Out for local courier delivery via DHL Express van",
            weight: "18.5 kg",
            dimensions: "60x40x40 cm",
            recipient: "Global Build Ltd",
            address: "22 Bishopsgate, London EC2N 4AJ, United Kingdom",
            shippingMethod: "DHL Express Worldwide",
            createdDate: "2026-07-13"
          }
        ];

        const cleanQuery = targetQuery.toLowerCase().replace('#', '');
        const found = demoShipments.find(s => 
          s.trackingNumber.toLowerCase() === cleanQuery ||
          s.orderId.toLowerCase().replace('#', '') === cleanQuery ||
          s.id.toLowerCase().replace('sh-', '') === cleanQuery
        );

        if (found) {
          setTrackedShipment(found);
          setTrackQuery(found.trackingNumber);
        } else {
          setTrackError(`No active shipment found matching "${targetQuery}".`);
        }
      }
    } catch (err) {
      console.error('Error searching tracking db:', err);
      setTrackError('An error occurred while communicating with the logistics server.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryContact.trim() || !inquiryMsg.trim() || !trackedShipment) return;

    setInquiryLoading(true);
    try {
      const subjectText = `[Tracking Inquiry: ${trackedShipment.orderId} / TRK: ${trackedShipment.trackingNumber}]`;
      const fullMessage = `${subjectText}\n\nClient Message:\n${inquiryMsg.trim()}`;

      await addDoc(collection(db, 'chatbot_leads'), {
        name: inquiryName.trim(),
        email: inquiryContact.includes('@') ? inquiryContact.trim() : '',
        phone: !inquiryContact.includes('@') ? inquiryContact.trim() : '',
        message: fullMessage,
        timestamp: new Date().toISOString()
      });

      setInquirySuccess(true);
      setInquiryMsg('');
    } catch (err) {
      console.error('Error saving customer tracking lead:', err);
    } finally {
      setInquiryLoading(false);
    }
  };

  const maskRecipientName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 4));
    }).join(' ');
  };

  const isWide = activeTab === 'track' && trackedShipment !== null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto selection:bg-violet-500/30">
      {/* Cloud Backdrop Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{ 
          backgroundImage: `url('${loginBgUrl}')` 
        }}
      />
      {/* Dynamic atmospheric ambient cover to make text legible */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundColor: loginOverlayColor,
          opacity: loginOverlayOpacity
        }}
      />
      {/* Dynamic blur layer to keep things glassmorphic */}
      <div 
        className="absolute inset-0" 
        style={{
          backdropFilter: 
            loginBlurLevel === 'none' ? 'none' :
            loginBlurLevel === 'sm' ? 'blur(4px)' :
            loginBlurLevel === 'md' ? 'blur(8px)' :
            loginBlurLevel === 'lg' ? 'blur(16px)' : 'blur(24px)',
          WebkitBackdropFilter:
            loginBlurLevel === 'none' ? 'none' :
            loginBlurLevel === 'sm' ? 'blur(4px)' :
            loginBlurLevel === 'md' ? 'blur(8px)' :
            loginBlurLevel === 'lg' ? 'blur(16px)' : 'blur(24px)'
        }}
      />

      {/* Main Glassmorphic Card Container */}
      <div 
        id="login-glass-card"
        className={`w-full rounded-3xl border shadow-[0_32px_64px_-15px_rgba(15,23,42,0.15)] relative overflow-hidden transition-all duration-500 z-10 ${
          isWide ? 'max-w-5xl p-6 md:p-8' : 'max-w-md p-8'
        }`}
        style={{
          backgroundColor: loginCardBg,
          borderColor: loginCardBorder
        }}
      >
        {/* Abstract floating mesh gradients inside the glassmorphic card */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Corporate branding at top-left inside card */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-950/5 dark:border-white/5 pb-4 relative z-10">
          <div className="p-1.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg">
            <Boxes className="w-4 h-4" />
          </div>
          <span className="text-xs font-black tracking-widest text-slate-900 dark:text-white uppercase font-sans">
            Stonex Portal
          </span>
          <span className="ml-auto text-[9px] bg-slate-950/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Enterprise Console
          </span>
        </div>

        {/* Dynamic Card Content Grid */}
        <div className="relative z-10">
          {!isWide ? (
            /* COMPACT MODE: LOGIN OR BLANK TRACKING SEARCH */
            <div className="flex flex-col">
              {/* Center icon wrap */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl flex items-center justify-center shadow-md shadow-slate-950/10">
                  {activeTab === 'login' ? <Lock className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </div>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
                {activeTab === 'login' ? 'Sign in with email' : 'Track Shipment'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 text-center max-w-xs mx-auto leading-relaxed">
                {activeTab === 'login' 
                  ? 'Enter your email to access the Stonex admin console.'
                  : 'Enter your order number or tracking reference to locate cargo.'}
              </p>

              {/* Slider tab selector */}
              <div className="flex bg-slate-200/50 dark:bg-slate-950/40 p-1 rounded-xl my-5 border border-slate-200/30 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('track');
                    setTrackError('');
                    setTrackedShipment(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'track'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Client Tracker
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Staff Sign In
                </button>
              </div>

              {/* Action Panels */}
              {activeTab === 'track' ? (
                /* Compact Track Form */
                <div className="space-y-4">
                  <form onSubmit={handleTrackSearch} className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        placeholder="e.g. 773921849120"
                        className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-850 dark:text-white focus:border-slate-950 dark:focus:border-white transition-all font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full py-2.5 disabled:opacity-75 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
                      style={{
                        backgroundColor: loginPrimaryBtnBg,
                        color: loginPrimaryBtnText
                      }}
                    >
                      {trackLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Shipment</span>
                        </>
                      )}
                    </button>
                  </form>

                  {trackError && (
                    <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl p-3 flex items-start gap-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{trackError}</span>
                    </div>
                  )}

                  {/* Helpers */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/60 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      ⚡ Quick Demo tracking helper
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {demoTrackingIds.map((id) => (
                        <button
                          key={id}
                          onClick={() => handleTrackSearch(id)}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9.5px] font-mono font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 rounded-md cursor-pointer transition-all active:scale-95"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Compact Login Form */
                <div className="space-y-4">
                  {loginError && (
                    <div className="bg-rose-50/85 dark:bg-rose-950/25 border border-rose-200/40 dark:border-rose-900/40 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Email Address
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@stonex.com"
                          className="w-full pl-9 pr-4 py-2.5 bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-slate-950 dark:focus:border-white text-xs text-slate-850 dark:text-white font-medium transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Password
                        </label>
                        <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please sign in using one of the quick access demo roles on the right, or register with your email.'); }} className="text-[10px] font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-slate-950 dark:focus:border-white text-xs text-slate-850 dark:text-white font-medium transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-2.5 mt-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      style={{
                        backgroundColor: loginPrimaryBtnBg,
                        color: loginPrimaryBtnText
                      }}
                    >
                      {loginLoading && activePresetIndex === null ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <span>Sign In</span>
                      )}
                    </button>
                  </form>

                  {/* Preset Roles Inside Card */}
                  <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                      💡 Quick Sandbox Identities
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_ROLES.map((preset, idx) => {
                        const IconComp = preset.icon;
                        const isThisLoading = loginLoading && activePresetIndex === idx;

                        return (
                          <button
                            key={preset.role}
                            type="button"
                            disabled={loginLoading}
                            onClick={() => handlePresetSelect(idx)}
                            className={`p-2 border border-slate-200/50 dark:border-slate-800 rounded-xl flex flex-col items-start text-left bg-white/40 dark:bg-slate-950/10 hover:bg-white/90 dark:hover:bg-slate-950/40 disabled:opacity-50 cursor-pointer transition-all`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-md">
                                <IconComp className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              </div>
                              {isThisLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 truncate w-full">
                              {preset.role}
                            </span>
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 block truncate w-full">
                              {preset.email}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* WIDE BENTO GRID MODE: SHIPMENT FOUND & DISPLAY DETAILS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Search & Action forms */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white/40 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/60">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-slate-500" />
                      Another Search
                    </h3>
                    <button
                      onClick={() => setTrackedShipment(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-slate-850 px-2.5 py-1 rounded-md cursor-pointer transition-all"
                    >
                      Clear Result
                    </button>
                  </div>

                  <form onSubmit={handleTrackSearch} className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        placeholder="Tracking Ref or Order ID"
                        className="w-full pl-9 pr-4 py-2 bg-white/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs text-slate-850 dark:text-white focus:border-slate-950 dark:focus:border-white transition-all font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-75 text-white dark:text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      {trackLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Search Consignment</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Priority inquiry form */}
                <div className="bg-white/40 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl p-5">
                  {inquirySuccess ? (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Inquiry Received!</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">Our logistics desk will contact you via email/phone shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Have questions? Contact logistics
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="px-2.5 py-1.5 bg-white/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600 font-medium"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Email or Phone"
                          value={inquiryContact}
                          onChange={(e) => setInquiryContact(e.target.value)}
                          className="px-2.5 py-1.5 bg-white/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600 font-medium"
                        />
                      </div>

                      <textarea
                        required
                        rows={2}
                        placeholder="Write your delivery question..."
                        value={inquiryMsg}
                        onChange={(e) => setInquiryMsg(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white outline-none resize-none focus:border-slate-400 dark:focus:border-slate-600 font-medium"
                      />

                      <button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-75 text-white dark:text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        {inquiryLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Submit Priority Inquiry</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Tracking Progress & Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white/40 dark:bg-slate-950/10 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl p-5 space-y-5">
                  {/* Title & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/30 dark:border-slate-800/40 pb-4">
                    <div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border ${
                        trackedShipment.status === 'In Transit' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450 border-indigo-100 dark:border-indigo-900/40' :
                        trackedShipment.status === 'Out for Delivery' ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-450 border-sky-100 dark:border-sky-900/40' :
                        trackedShipment.status === 'Delivered' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/40' :
                        trackedShipment.status === 'Exception / Delay' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/40' :
                        'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 border-amber-100 dark:border-amber-900/40'
                      }`}>
                        {trackedShipment.status}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                        Order {trackedShipment.orderId}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        Ref: <span className="font-bold text-slate-700 dark:text-slate-300">{trackedShipment.trackingNumber}</span>
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wide">Carrier</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{trackedShipment.carrier}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{trackedShipment.shippingMethod}</p>
                    </div>
                  </div>

                  {/* Bezier Vector Progress Arc */}
                  <div className="bg-slate-950 dark:bg-black rounded-2xl p-4 border border-slate-800/50 relative overflow-hidden h-28 flex flex-col justify-between">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:12px_12px]" />
                    
                    <div className="relative z-10 flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      <span>Stonex Hub</span>
                      <span>{trackedShipment.destination}</span>
                    </div>

                    <div className="relative h-10 w-full flex items-center justify-center">
                      <svg className="w-full h-full absolute overflow-visible" viewBox="0 0 300 64" fill="none">
                        <path
                          d="M 20 40 Q 150 10 280 40"
                          stroke="#1e293b"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        {trackedShipment.milestone > 0 && (
                          <path
                            d="M 20 40 Q 150 10 280 40"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            strokeDashoffset={300 - (trackedShipment.milestone * 55)}
                            className="transition-all duration-1000"
                          />
                        )}
                        <circle cx="20" cy="40" r="4" fill="#f43f5e" />
                        <circle cx="280" cy="40" r="4" fill="#10b981" />
                        <g>
                          <circle
                            cx={20 + (trackedShipment.milestone * 52)}
                            cy={40 - (Math.sin((trackedShipment.milestone / 5) * Math.PI) * 20)}
                            r="5"
                            fill="#8b5cf6"
                            className="transition-all duration-1000 animate-pulse"
                          />
                        </g>
                      </svg>
                    </div>

                    <div className="relative z-10 flex items-center gap-1.5 text-[9px] font-bold text-violet-300">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping shrink-0" />
                      <span className="truncate">{trackedShipment.lastUpdate}</span>
                    </div>
                  </div>

                  {/* Milestones Checkpoints */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2.5 md:border-r md:border-slate-200/20 md:pr-4">
                      {[
                        { step: 0, label: "Label Created", d: "Order checked" },
                        { step: 1, label: "Picked Up", d: "Driver scanned package" },
                        { step: 2, label: "Sorting Hub", d: "Inbound facility scan" },
                        { step: 3, label: "In Transit", d: "En route to delivery" },
                        { step: 4, label: "Out for Delivery", d: "Local courier van active" },
                        { step: 5, label: "Delivered", d: "Recipient secure drop-off" }
                      ].map((item) => {
                        const done = trackedShipment.milestone >= item.step;
                        const current = trackedShipment.milestone === item.step;

                        return (
                          <div key={item.step} className="flex gap-2 items-start text-[11px]">
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black transition-all shrink-0 mt-0.5 ${
                              done ? 'bg-violet-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            } ${current ? 'ring-2 ring-violet-200 dark:ring-violet-900/40' : ''}`}>
                              {done ? '✓' : ''}
                            </span>
                            <div className="min-w-0">
                              <p className={`font-bold leading-none ${done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                                {item.label}
                              </p>
                              <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {item.d}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Specs Details */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div className="bg-white/40 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/40 flex flex-col gap-2 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between border-b border-slate-200/20 pb-1.5">
                          <span>Recipient:</span>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {maskRecipientName(trackedShipment.recipient)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/20 pb-1.5">
                          <span>Specs:</span>
                          <span className="font-bold text-slate-850 dark:text-white">
                            {trackedShipment.weight} / {trackedShipment.dimensions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dispatched:</span>
                          <span className="font-bold text-slate-850 dark:text-white">
                            {trackedShipment.createdDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal border border-dashed border-slate-200/30 dark:border-slate-800/50 p-2.5 rounded-xl">
                        📍 <strong>Transit Note:</strong> Slabs are packaged inside heavy-duty timber crating and secured with rubber buffers to prevent quarry-grade damage.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
