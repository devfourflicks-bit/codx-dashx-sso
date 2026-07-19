/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { ThemeConfig } from '../types';
import {
  Palette,
  Layers,
  Type,
  Upload,
  Settings,
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
  Building2,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  Star,
  ClipboardList,
  PhoneCall,
  Megaphone,
  Lock
} from 'lucide-react';
import { useConfirm } from './ConfirmDialog';

// Import sub-sections for unified rendering
import CompanyInfoSection from './CompanyInfoSection';
import HeroSection from './HeroSection';
import ListSection from './ListSection';
import ProductsSection from './ProductsSection';
import ContactSection from './ContactSection';
import AnnouncementsSection from './AnnouncementsSection';

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Oswald", "Raleway",
  "PT Sans", "Merriweather", "Noto Sans", "Playfair Display", "Nunito", "Lora", "Muli",
  "Space Grotesk", "Outfit", "DM Sans", "Manrope", "Plus Jakarta Sans",
  "Work Sans", "Chivo", "Syne", "Urbanist", "Lexend", "Clash Display", "Satoshi", "General Sans"
];

interface ThemeSectionProps {
  themeData: ThemeConfig | null;
  onSave: (newData: ThemeConfig) => void;

  // Grouped sections props
  companyData: any;
  onSaveCompany: (data: any) => void;

  heroData: any;
  onSaveHero: (data: any) => void;

  servicesData: any;
  onSaveServices: (key: any, items: any[]) => void;

  products: any[];
  onRefreshProducts: () => void;

  whyChooseData: any;
  onSaveWhyChoose: (key: any, items: any[]) => void;

  processData: any;
  onSaveProcess: (key: any, items: any[]) => void;

  contactData: any;
  onSaveContact: (data: any) => void;

  announcementsData: any;
  onSaveAnnouncements: (data: any) => void;
}

export default function ThemeSection({
  themeData,
  onSave,
  companyData,
  onSaveCompany,
  heroData,
  onSaveHero,
  servicesData,
  onSaveServices,
  products,
  onRefreshProducts,
  whyChooseData,
  onSaveWhyChoose,
  processData,
  onSaveProcess,
  contactData,
  onSaveContact,
  announcementsData,
  onSaveAnnouncements
}: ThemeSectionProps) {
  const { confirm } = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'theme' | 'hero' | 'about' | 'services' | 'products' | 'why' | 'process' | 'announcements' | 'contact' | 'login-page'>('theme');

  // General theme states
  const [primaryColor, setPrimaryColor] = useState('#7854F7');
  const [accentColor, setAccentColor] = useState('#F0EDFF');
  const [headerType, setHeaderType] = useState('gradient');
  const [headerBg, setHeaderBg] = useState('linear-gradient(135deg, var(--color-primary), var(--color-accent))');
  const [headerSolidColor, setHeaderSolidColor] = useState('#2a6cd6');
  const [font, setFont] = useState('Inter');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoType, setLogoType] = useState<'text' | 'image' | 'both'>('image');
  const [logoText, setLogoText] = useState('Stonex');
  const [logoSize, setLogoSize] = useState<number>(36);
  const [fontSizeBase, setFontSizeBase] = useState<'small' | 'normal' | 'large' | 'xlarge'>('normal');
  const [menuTextSize, setMenuTextSize] = useState<'small' | 'normal' | 'large' | 'xlarge'>('normal');
  const [sectionColors, setSectionColors] = useState<Record<string, { bg: string; text: string; bgImage?: string }>>({
    hero: { bg: '#0b0f19', text: '#ffffff', bgImage: '' },
    services: { bg: '#0b0f19', text: '#f8fafc', bgImage: '' },
    about: { bg: '#0f172a', text: '#f8fafc', bgImage: '' },
    products: { bg: '#0b0f19', text: '#f8fafc', bgImage: '' },
    why: { bg: '#0f172a', text: '#f8fafc', bgImage: '' },
    process: { bg: '#0b0f19', text: '#f8fafc', bgImage: '' },
    contact: { bg: '#0f172a', text: '#f8fafc', bgImage: '' }
  });
  
  // Feature Toggles
  const [whatsapp, setWhatsapp] = useState(true);
  const [topbar, setTopbar] = useState(true);
  const [ticker, setTicker] = useState(true);
  const [processEnabled, setProcessEnabled] = useState(true);
  const [statsEnabled, setStatsEnabled] = useState(true);

  // Preloader configs
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderStyle, setPreloaderStyle] = useState<'linear' | 'circle' | 'bouncing'>('linear');
  const [preloaderAnimation, setPreloaderAnimation] = useState<'pulse' | 'spin' | 'glow' | 'bounce' | 'flip'>('pulse');
  const [preloaderLogoUrl, setPreloaderLogoUrl] = useState<string>('');
  const [preloaderLogoFile, setPreloaderLogoFile] = useState<File | null>(null);
  const [preloaderTheme, setPreloaderTheme] = useState<string>('black');
  const [preloaderDuration, setPreloaderDuration] = useState<number>(350); // Default hold duration in ms
  const [glassEffects, setGlassEffects] = useState<boolean>(true);

  // Footer customization configs
  const [footerBg, setFooterBg] = useState('#0b0f19');
  const [footerText, setFooterText] = useState('#94a3b8');
  const [footerIconColor, setFooterIconColor] = useState('#f97316');
  const [footerBrandDesc, setFooterBrandDesc] = useState('Your trusted partner for industrial trading, heavy equipment rentals, civil material supply, and premium PPE products.');
  const [footerCopyright, setFooterCopyright] = useState('© 2025 Stonex Industrial Solutions. All rights reserved.');
  const [showFooterSocial, setShowFooterSocial] = useState(true);
  const [showFooterLogo, setShowFooterLogo] = useState(true);

  // Login page customization configs
  const [loginBgUrl, setLoginBgUrl] = useState('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80');
  const [loginBgFile, setLoginBgFile] = useState<File | null>(null);
  const [loginOverlayColor, setLoginOverlayColor] = useState('#0f172a');
  const [loginOverlayOpacity, setLoginOverlayOpacity] = useState(0.2);
  const [loginBlurLevel, setLoginBlurLevel] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [loginCardBg, setLoginCardBg] = useState('rgba(255, 255, 255, 0.7)');
  const [loginCardBorder, setLoginCardBorder] = useState('rgba(255, 255, 255, 0.5)');
  const [loginPrimaryBtnBg, setLoginPrimaryBtnBg] = useState('#0f172a');
  const [loginPrimaryBtnText, setLoginPrimaryBtnText] = useState('#ffffff');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (themeData) {
      if (themeData.primaryColor) setPrimaryColor(themeData.primaryColor);
      if (themeData.accentColor) setAccentColor(themeData.accentColor);
      if (themeData.headerBg) {
        if (themeData.headerBg.startsWith('#') || !themeData.headerBg.includes('gradient')) {
          setHeaderType('solid');
          setHeaderSolidColor(themeData.headerBg);
        } else {
          setHeaderType('gradient');
          setHeaderBg(themeData.headerBg);
        }
      }
      if (themeData.font) setFont(themeData.font);
      if (themeData.logoUrl) setLogoUrl(themeData.logoUrl);
      if (themeData.logoType) setLogoType(themeData.logoType);
      if (themeData.logoText) setLogoText(themeData.logoText);
      if (themeData.logoSize !== undefined) setLogoSize(themeData.logoSize);
      if (themeData.fontSizeBase) setFontSizeBase(themeData.fontSizeBase);
      if (themeData.menuTextSize) setMenuTextSize(themeData.menuTextSize);
      if (themeData.sectionColors) {
        setSectionColors({
          hero: { bg: '#0b0f19', text: '#ffffff', bgImage: '', ...themeData.sectionColors.hero },
          services: { bg: '#0b0f19', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.services },
          about: { bg: '#0f172a', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.about },
          products: { bg: '#0b0f19', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.products },
          why: { bg: '#0f172a', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.why },
          process: { bg: '#0b0f19', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.process },
          contact: { bg: '#0f172a', text: '#f8fafc', bgImage: '', ...themeData.sectionColors.contact }
        });
      }
      if (themeData.toggles) {
        setWhatsapp(themeData.toggles.whatsapp !== false);
        setTopbar(themeData.toggles.topbar !== false);
        setTicker(themeData.toggles.ticker !== false);
        setProcessEnabled(themeData.toggles.process !== false);
        setStatsEnabled(themeData.toggles.stats !== false);
      }
      if (themeData.preloader) {
        setShowPreloader(themeData.preloader.showPreloader !== false);
        setPreloaderStyle(themeData.preloader.preloaderStyle || 'linear');
        setPreloaderAnimation((themeData.preloader.preloaderAnimation as any) || 'pulse');
        setPreloaderLogoUrl(themeData.preloader.preloaderLogoUrl || '');
        setPreloaderTheme(themeData.preloader.preloaderTheme || 'black');
        setPreloaderDuration(themeData.preloader.preloaderDuration !== undefined ? Math.min(60000, themeData.preloader.preloaderDuration) : 350);
      }
      if (themeData.glassEffects !== undefined) {
        setGlassEffects(themeData.glassEffects);
      } else {
        setGlassEffects(true);
      }
      if (themeData.footer) {
        if (themeData.footer.bg) setFooterBg(themeData.footer.bg);
        if (themeData.footer.text) setFooterText(themeData.footer.text);
        if (themeData.footer.iconColor) setFooterIconColor(themeData.footer.iconColor);
        if (themeData.footer.brandDesc !== undefined) setFooterBrandDesc(themeData.footer.brandDesc);
        if (themeData.footer.copyright !== undefined) setFooterCopyright(themeData.footer.copyright);
        if (themeData.footer.showSocial !== undefined) setShowFooterSocial(themeData.footer.showSocial);
        if (themeData.footer.showLogo !== undefined) setShowFooterLogo(themeData.footer.showLogo);
      }
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
  }, [themeData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handlePreloaderLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreloaderLogoFile(file);
      setPreloaderLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSectionBgFileChange = async (sectionId: string, file: File) => {
    try {
      const base64 = await compressAndEncodeImage(file, 1200, 0.8);
      setSectionColors(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], bgImage: base64 }
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to compress background image: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'hero':
        return <HeroSection heroData={heroData} onSave={onSaveHero} />;
      case 'about':
        return <CompanyInfoSection companyData={companyData} onSave={onSaveCompany} />;
      case 'services':
        return (
          <ListSection
            sectionTitle="What We Offer (Services)"
            description="Manage the 4 primary services blocks displayed on the customer services shelf."
            configKey="services"
            defaultItems={[
              { key: 'industrial', title: 'Industrial Supplies', desc: 'Sourcing and distributing specialized machinery, instrumentation components, and customized piping accessories.' },
              { key: 'equipment', title: 'Heavy Equipment Rentals', desc: 'Providing highly certified machinery, tower cranes, lifting lifters, excavators, and dump trucks.' },
              { key: 'civil', title: 'Civil Slabs & Paving Stones', desc: 'Premium grade granite and marble slabs of international quarries custom tailored for large commercial and landscape projects.' },
              { key: 'ppe', title: 'PPE Safety Materials', desc: 'Original personal protective equipment, helmets, fireproof clothing, gloves, and high-visibility jackets.' }
            ]}
            listData={servicesData}
            onSave={onSaveServices}
          />
        );
      case 'products':
        return <ProductsSection products={products} onRefresh={onRefreshProducts} />;
      case 'why':
        return (
          <ListSection
            sectionTitle="Why Choose Stonex"
            description="Manage the competitive values, reasons, and certifications showing your edge."
            configKey="whyChoose"
            defaultItems={[
              { title: '15+ Years Track Record', desc: 'Extensive expertise executing complex engineering procurement contracts across regions safely.' },
              { title: 'ISO Certifications', desc: 'Uncompromised compliance in material standards, sourcing transparency, and corporate operations.' },
              { title: 'Global Partnerships', desc: 'Direct sourcing connections to elite Italian and Brazilian stone quarries, and safety gear manufacturers.' },
              { title: '24/7 Priority Support', desc: 'Around-the-clock emergency replacement requests, project consultations, and on-site material inspections.' }
            ]}
            listData={whyChooseData}
            onSave={onSaveWhyChoose}
          />
        );
      case 'process':
        return (
          <ListSection
            sectionTitle="How It Works (Steps)"
            description="Configure active processing steps from consultation to material delivery."
            configKey="process"
            defaultItems={[
              { title: 'Consultation & Specifications', desc: 'Understand architectural plans, material standards, strength formulas, and budget constraints.' },
              { title: 'Procurement & Quality Control', desc: 'Source matching stones and check dimensions, structural integrity, and ISO certificates.' },
              { title: 'Delivery & Logistics Support', desc: 'Safe delivery using customized heavy transit logistics and cranes to prevent slab damage.' }
            ]}
            listData={processData}
            onSave={onSaveProcess}
          />
        );
      case 'announcements':
        return <AnnouncementsSection announcementsData={announcementsData} onSave={onSaveAnnouncements} />;
      case 'contact':
        return <ContactSection contactData={contactData} onSave={onSaveContact} />;
      case 'login-page':
        return (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Controls Column */}
              <div className="flex-1 space-y-6">
                {/* Background Image Panel */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-violet-500" />
                    Login Screen Backdrop
                  </h4>
                  <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                    Choose a prominent industrial backdrop. You can select a high-quality pre-curated preset, upload a local file, or paste a custom URL.
                  </p>

                  {/* Preset Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Curated Presets</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          name: 'White Quarry',
                          url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Industrial Crane',
                          url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Warehouse Slabs',
                          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Modern Architecture',
                          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Metal & Steel',
                          url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Heavy Excavator',
                          url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Sunset Concrete',
                          url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=2000&q=80'
                        },
                        {
                          name: 'Golden Grid',
                          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=80'
                        }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setLoginBgUrl(preset.url);
                            setLoginBgFile(null);
                          }}
                          className={`group relative h-16 rounded-xl overflow-hidden border-2 text-left cursor-pointer transition-all ${
                            loginBgUrl === preset.url && !loginBgFile
                              ? 'border-violet-600 shadow-md scale-[1.02]'
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-slate-950/40" />
                          <span className="absolute bottom-1.5 left-2 right-2 text-[9px] font-bold text-white tracking-wide truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual URL & File Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/35 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Custom URL Address</label>
                      <input
                        type="text"
                        value={loginBgFile ? 'Custom uploaded image active' : loginBgUrl}
                        disabled={!!loginBgFile}
                        onChange={(e) => setLoginBgUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-sans outline-none disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Upload Image File</label>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5 flex-1 justify-center">
                          <Upload className="w-3.5 h-3.5 text-violet-500" />
                          <span>Choose Backdrop File</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setLoginBgFile(file);
                                setLoginBgUrl(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {loginBgFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setLoginBgFile(null);
                              setLoginBgUrl('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80');
                            }}
                            className="text-[10px] font-bold text-rose-500 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blending & Opacity Panel */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-violet-500" />
                    Overlay tint & Glass effects
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/35 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Overlay Backdrop Tint</label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={loginOverlayColor.startsWith('#') ? loginOverlayColor : '#0f172a'}
                          onChange={(e) => setLoginOverlayColor(e.target.value)}
                          className="w-12 h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 p-1"
                        />
                        <input
                          type="text"
                          value={loginOverlayColor}
                          onChange={(e) => setLoginOverlayColor(e.target.value)}
                          placeholder="#0f172a"
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Overlay Tint Opacity</label>
                        <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400">{(loginOverlayOpacity * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={loginOverlayOpacity}
                        onChange={(e) => setLoginOverlayOpacity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Backdrop Blur Intensity</label>
                      <select
                        value={loginBlurLevel}
                        onChange={(e) => setLoginBlurLevel(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold cursor-pointer outline-none"
                      >
                        <option value="none">No Blur (Clear backdrop)</option>
                        <option value="sm">Soft Hint (4px blur)</option>
                        <option value="md">Balanced Studio (8px blur - Recommended)</option>
                        <option value="lg">Frosted Ice (16px blur)</option>
                        <option value="xl">Abyss Dream (24px blur)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Card Glass presets</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginCardBg('rgba(255, 255, 255, 0.7)');
                            setLoginCardBorder('rgba(255, 255, 255, 0.5)');
                          }}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            loginCardBg.includes('255, 255, 255')
                              ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-500 text-violet-600 dark:text-violet-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600'
                          }`}
                        >
                          Glassy Frosted Light
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginCardBg('rgba(15, 23, 42, 0.75)');
                            setLoginCardBorder('rgba(255, 255, 255, 0.15)');
                          }}
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            loginCardBg.includes('15, 23, 42')
                              ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-500 text-violet-600 dark:text-violet-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-600'
                          }`}
                        >
                          Glassy Obsidian Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button Colors */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/50 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-violet-500" />
                    Interactive Card Accent Elements
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/35 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Primary Button Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginPrimaryBtnBg.startsWith('#') ? loginPrimaryBtnBg : '#0f172a'}
                          onChange={(e) => setLoginPrimaryBtnBg(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-white border border-slate-200 p-1"
                        />
                        <input
                          type="text"
                          value={loginPrimaryBtnBg}
                          onChange={(e) => setLoginPrimaryBtnBg(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Button Label Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginPrimaryBtnText.startsWith('#') ? loginPrimaryBtnText : '#ffffff'}
                          onChange={(e) => setLoginPrimaryBtnText(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-white border border-slate-200 p-1"
                        />
                        <input
                          type="text"
                          value={loginPrimaryBtnText}
                          onChange={(e) => setLoginPrimaryBtnText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Interactive Live Preview Column */}
              <div className="w-full xl:w-80 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  Live Preview Workspace
                </h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                  Immediate, high-fidelity visual render of the active admin credentials gate based on your selected aesthetic values:
                </p>

                {/* The visual simulator screen */}
                <div 
                  className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center p-4"
                  style={{
                    backgroundImage: `url(${loginBgUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Overlay */}
                  <div 
                    className="absolute inset-0" 
                    style={{
                      backgroundColor: loginOverlayColor,
                      opacity: loginOverlayOpacity
                    }}
                  />

                  {/* Blur layer */}
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

                  {/* Mock card container */}
                  <div 
                    className="relative w-full max-w-[240px] p-4.5 rounded-2xl border flex flex-col gap-3 text-center transition-all duration-300"
                    style={{
                      backgroundColor: loginCardBg,
                      borderColor: loginCardBorder,
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)'
                    }}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
                        S
                      </div>
                      <h5 className="text-[10px] font-extrabold text-slate-800 dark:text-white tracking-wider uppercase mt-1">Stonex Admin</h5>
                      <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Gate Access Secure</span>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="h-6 w-full bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[8px] px-2 flex items-center text-slate-400">admin@stonex.in</div>
                      <div className="h-6 w-full bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[8px] px-2 flex items-center text-slate-400">••••••••</div>
                    </div>

                    <button 
                      type="button" 
                      className="w-full h-7 rounded-lg font-bold text-[9px] tracking-widest uppercase transition-all flex items-center justify-center cursor-default"
                      style={{
                        backgroundColor: loginPrimaryBtnBg,
                        color: loginPrimaryBtnText
                      }}
                    >
                      Authenticate
                    </button>
                    
                    <span className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">SECURE ID: GATE-ACC-X</span>
                  </div>
                </div>

                {/* Quick Save Action Button inside subtab */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-70 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-md shadow-violet-600/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving parameters...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Commit Gate Customization</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm({
      title: 'Save Theme Configuration',
      message: 'Are you sure you want to write the modified color scheme, fonts, and layout settings to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        try {
          let finalLogoUrl = logoUrl;
          if (logoFile) {
            try {
              finalLogoUrl = await compressAndEncodeImage(logoFile, 400, 0.85);
            } catch (storageErr) {
              console.error('Logo compression and encoding error: ', storageErr);
              throw new Error('Failed to compress and convert logo image. Detail: ' + (storageErr instanceof Error ? storageErr.message : String(storageErr)));
            }
          }

          let finalPreloaderLogoUrl = preloaderLogoUrl;
          if (preloaderLogoFile) {
            try {
              finalPreloaderLogoUrl = await compressAndEncodeImage(preloaderLogoFile, 300, 0.85);
            } catch (storageErr) {
              console.error('Preloader logo compression and encoding error: ', storageErr);
              throw new Error('Failed to compress and convert preloader logo. Detail: ' + (storageErr instanceof Error ? storageErr.message : String(storageErr)));
            }
          }

          let finalLoginBgUrl = loginBgUrl;
          if (loginBgFile) {
            try {
              finalLoginBgUrl = await compressAndEncodeImage(loginBgFile, 1200, 0.8);
            } catch (storageErr) {
              console.error('Login background compression and encoding error: ', storageErr);
              throw new Error('Failed to compress and convert login background image. Detail: ' + (storageErr instanceof Error ? storageErr.message : String(storageErr)));
            }
          }

          const updatedTheme: ThemeConfig = {
            primaryColor,
            accentColor,
            headerBg: headerType === 'solid' ? headerSolidColor : headerBg,
            font,
            logoUrl: finalLogoUrl,
            logoType,
            logoText,
            logoSize,
            fontSizeBase,
            menuTextSize,
            sectionColors,
            toggles: {
              whatsapp,
              topbar,
              ticker,
              process: processEnabled,
              stats: statsEnabled
            },
            preloader: {
              showPreloader,
              preloaderStyle,
              preloaderAnimation,
              preloaderLogoUrl: finalPreloaderLogoUrl,
              preloaderTheme,
              preloaderDuration
            },
            footer: {
              bg: footerBg,
              text: footerText,
              iconColor: footerIconColor,
              brandDesc: footerBrandDesc,
              copyright: footerCopyright,
              showSocial: showFooterSocial,
              showLogo: showFooterLogo
            },
            glassEffects,
            loginTheme: {
              bgUrl: finalLoginBgUrl,
              overlayColor: loginOverlayColor,
              overlayOpacity: loginOverlayOpacity,
              blurLevel: loginBlurLevel,
              cardBg: loginCardBg,
              cardBorder: loginCardBorder,
              primaryBtnBg: loginPrimaryBtnBg,
              primaryBtnText: loginPrimaryBtnText
            }
          };

          try {
            await setDoc(doc(db, 'siteConfig', 'theme'), updatedTheme, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/theme');
          }

          onSave(updatedTheme);
        } catch (err) {
          console.error('Error saving theme settings:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  // List of tabs for visual styling
  const subTabs = [
    { id: 'theme', label: 'Theme & General', icon: Palette, desc: 'Configure brand colors, logos, feature toggles and preloading screen.' },
    { id: 'hero', label: 'Hero Content', icon: ImageIcon, desc: 'Manage top banner headers, background images/videos, and action buttons.' },
    { id: 'about', label: 'About Stonex', icon: Building2, desc: 'Update company history description, counters/statistics, and side graphic.' },
    { id: 'services', label: 'What We Offer', icon: Package, desc: 'Edit core services block listings displayed on client section cards.' },
    { id: 'products', label: 'Product Range', icon: ShoppingBag, desc: 'Update inventory list, categories, description fields and materials.' },
    { id: 'why', label: 'Why Choose Us', icon: Star, desc: 'Manage your quarry certificates, corporate compliant tracks and traits.' },
    { id: 'process', label: 'How It Works', icon: ClipboardList, desc: 'Configure order pipeline steps from initial sketch to site drop-off.' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, desc: 'Write floating announcements or breaking ticker notice list.' },
    { id: 'contact', label: 'Contact Info', icon: PhoneCall, desc: 'Manage active communication addresses, working hours, and phone lines.' },
    { id: 'login-page', label: 'Admin Login', icon: Lock, desc: 'Customize admin login screen background image, colors, and styling.' }
  ];

  const currentTabInfo = subTabs.find(t => t.id === activeSubTab);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in w-full">
      {/* Upper header section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-violet-600 dark:text-violet-400" />
              Theme Control Panel
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 leading-relaxed">
              Configure and preview all aspects of your Stonex customer landing page directly from a unified visual workspace.
            </p>
          </div>
          <span className="text-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/60 font-black px-3 py-1.5 rounded-full uppercase tracking-widest self-start md:self-center">
            Consolidated Cockpit
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-850 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Failed to Save Details</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Options Rows Panel */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-4 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-3">Navigation Modules</p>
          <div className="flex flex-col gap-1.5">
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveSubTab(tab.id as any);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer border text-left ${
                    isActive
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white shadow-sm font-semibold scale-[1.01]'
                      : 'bg-slate-50/40 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900 border-slate-100/60 dark:border-slate-800 text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                  title={tab.desc}
                >
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-400 dark:bg-violet-100/20 dark:text-violet-600'
                      : 'bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight">{tab.label}</p>
                    <p className={`text-[9px] mt-0.5 truncate leading-none ${isActive ? 'text-slate-300 dark:text-slate-550' : 'text-slate-400 dark:text-slate-500'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Tab Content */}
        <div className="lg:col-span-8 xl:col-span-9 w-full">
        {activeSubTab === 'theme' ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
              
              <div className="border-b border-slate-100 dark:border-slate-700/50 pb-4">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Palette className="w-4.5 h-4.5 text-violet-600 dark:text-violet-450" />
                  Branding Styles & General Configuration
                </h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  Configure corporate palette codes, typography selections, preloader settings and general toggles.
                </p>
              </div>

              {/* Branding Colors */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Branding Color Palettes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Primary Color Theme</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accent Highlight Theme</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Configuration */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Header Design Setup</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Background Fill Type</label>
                    <select
                      value={headerType}
                      onChange={(e) => setHeaderType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs outline-none"
                    >
                      <option value="gradient">Linear CSS Gradient formula</option>
                      <option value="solid">Solid single flat color</option>
                    </select>
                  </div>

                  {headerType === 'gradient' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Linear Gradient Formula</label>
                      <input
                        type="text"
                        value={headerBg}
                        onChange={(e) => setHeaderBg(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Solid Hex Color</label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={headerSolidColor}
                          onChange={(e) => setHeaderSolidColor(e.target.value)}
                          className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                        />
                        <input
                          type="text"
                          value={headerSolidColor}
                          onChange={(e) => setHeaderSolidColor(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Typography Selections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Typography Font-Family</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {GOOGLE_FONTS.map((fontName) => (
                      <option key={fontName} value={fontName}>{fontName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Global Font Sizing Scale</label>
                  <select
                    value={fontSizeBase}
                    onChange={(e) => setFontSizeBase(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="small">Compact Sizing (14px base)</option>
                    <option value="normal">Standard Sizing (16px base)</option>
                    <option value="large">Elevated Sizing (18px base)</option>
                    <option value="xlarge">Spacious Sizing (20px base)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Menu Text Size</label>
                  <select
                    value={menuTextSize}
                    onChange={(e) => setMenuTextSize(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="small">Compact (12px / 14px mobile)</option>
                    <option value="normal">Standard (14px / 16px mobile)</option>
                    <option value="large">Elevated (16px / 18px mobile)</option>
                    <option value="xlarge">Spacious (18px / 20px mobile)</option>
                  </select>
                </div>
              </div>

              {/* Glassmorphism Configuration */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Glassmorphism Acrylic Design</h4>
                <div className="bg-slate-50/50 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={glassEffects}
                      onChange={(e) => setGlassEffects(e.target.checked)}
                      className="w-4 h-4 text-violet-600 rounded mt-0.5 accent-violet-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Enable Glassmorphic Glass Effects for All Sections</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Applies ultra-modern acrylic backdrop blur filters, fine translucent border structures, and glowing light-leak shadows across all landing page sections, grid blocks, and information cards.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Company Logo Customization */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-violet-500" />
                  Corporate Brand Logo Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Logo Mode</label>
                    <div className="flex flex-col gap-1.5">
                      {['text', 'image', 'both'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setLogoType(mode as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-left cursor-pointer border transition-all ${
                            logoType === mode
                              ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {mode === 'text' && 'Typography Text Only'}
                          {mode === 'image' && 'Vector Image Icon Only'}
                          {mode === 'both' && 'Hybrid (Image + Text)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`space-y-2 ${logoType === 'image' ? 'opacity-40' : ''}`}>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Brand Text</label>
                    <input
                      type="text"
                      disabled={logoType === 'image'}
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className={`space-y-2 ${logoType === 'text' ? 'opacity-40' : ''}`}>
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Vector Logo File</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-905 rounded-xl p-3 cursor-pointer">
                      <Upload className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">Choose Image</span>
                      <input
                        type="file"
                        disabled={logoType === 'text'}
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && logoType !== 'text' && (
                      <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg">
                        <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
                        <button type="button" onClick={() => { setLogoUrl(null); setLogoFile(null); }} className="text-[9px] text-rose-500 font-bold">Remove</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Logo Height Size</label>
                    <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">{logoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                </div>
              </div>

              {/* SECTION COLORS */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Section Background overrides</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Customize backgrounds with colors, text overrides, or beautiful background images/textures.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sectionColors).map(([sectionId, colors]: [string, any]) => (
                    <div key={sectionId} className="p-4 bg-slate-50 dark:bg-slate-900/35 rounded-xl border border-slate-150 dark:border-slate-800/80 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-300">{sectionId} Area</span>
                        {colors.bgImage && (
                          <span className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-400 px-2 py-0.5 rounded-full font-bold">
                            Active Image Bg
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        {/* Background color column */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Bg Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colors.bg?.startsWith('#') ? colors.bg : '#0b0f19'}
                              onChange={(e) => {
                                setSectionColors(prev => ({
                                  ...prev,
                                  [sectionId]: { ...prev[sectionId], bg: e.target.value }
                                }));
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-150 p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={colors.bg || ''}
                              onChange={(e) => {
                                setSectionColors(prev => ({
                                  ...prev,
                                  [sectionId]: { ...prev[sectionId], bg: e.target.value }
                                }));
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-md"
                            />
                          </div>
                        </div>

                        {/* Text color column */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colors.text?.startsWith('#') ? colors.text : '#f8fafc'}
                              onChange={(e) => {
                                setSectionColors(prev => ({
                                  ...prev,
                                  [sectionId]: { ...prev[sectionId], text: e.target.value }
                                }));
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-150 p-0.5 shrink-0"
                            />
                            <input
                              type="text"
                              value={colors.text || ''}
                              onChange={(e) => {
                                setSectionColors(prev => ({
                                  ...prev,
                                  [sectionId]: { ...prev[sectionId], text: e.target.value }
                                }));
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Background image upload / paste url */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Section Bg Image</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Paste image URL..."
                            value={colors.bgImage || ''}
                            onChange={(e) => {
                              setSectionColors(prev => ({
                                ...prev,
                                  [sectionId]: { ...prev[sectionId], bgImage: e.target.value }
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-md placeholder-slate-400"
                          />
                          
                          <label className="flex items-center justify-center h-7 px-3 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850/80 text-slate-600 dark:text-slate-400 transition-colors text-xs font-bold gap-1 shrink-0">
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleSectionBgFileChange(sectionId, file);
                                }
                              }}
                            />
                          </label>

                          {colors.bgImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setSectionColors(prev => ({
                                  ...prev,
                                  [sectionId]: { ...prev[sectionId], bgImage: '' }
                                }));
                              }}
                              className="h-7 px-2 border border-rose-200 hover:border-rose-300 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-md transition-colors text-xs font-bold shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {colors.bgImage && (
                          <div className="mt-2 flex items-center gap-2 bg-slate-100/60 dark:bg-slate-950/30 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                            <div className="w-8 h-8 rounded border border-slate-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${colors.bgImage})` }} />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] font-mono">
                              {colors.bgImage.startsWith('data:') ? 'Base64 image uploaded' : colors.bgImage}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Feature Activation Toggles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { state: whatsapp, set: setWhatsapp, title: 'Enable WhatsApp Live Floating Chatbot' },
                    { state: topbar, set: setTopbar, title: 'Enable Top Emergency Info Header Bar' },
                    { state: ticker, set: setTicker, title: 'Enable Breaking Announcements Ticker' },
                    { state: processEnabled, set: setProcessEnabled, title: 'Enable Timeline "How It Works" module' },
                    { state: statsEnabled, set: setStatsEnabled, title: 'Enable "Performance & Track Record Metrics"' }
                  ].map((toggle, idx) => (
                    <label key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={toggle.state}
                        onChange={(e) => toggle.set(e.target.checked)}
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{toggle.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preloader & Loading screen with white background */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-violet-500 animate-pulse" />
                  Premium Loading Screen & Transition (Preloader)
                </h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                  Toggle and customize the fullscreen transition guard. Adding white backgrounds and highly refined keyframe rotations ensures a rich desktop presentation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="md:col-span-12">
                    <label className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPreloader}
                        onChange={(e) => setShowPreloader(e.target.checked)}
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Active Fullscreen Loader Guard</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Locks client screens behind a premium loading sequence to eliminate unstyled layout shifts on slower mobile links.</p>
                      </div>
                    </label>
                  </div>

                  {showPreloader && (
                    <>
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Screen Backdrop Color</label>
                        <select
                          value={preloaderTheme}
                          onChange={(e) => setPreloaderTheme(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer outline-none"
                        >
                          <option value="black">Premium Pitch Black (#000000)</option>
                          <option value="dark-slate">Space Slate Dark (#0F172A)</option>
                          <option value="midnight-blue">Midnight Blue (#0B0F19)</option>
                          <option value="deep-navy">Deep Blue Navy (#020617)</option>
                          <option value="charcoal">Charcoal Grey (#1E1E1E)</option>
                          <option value="indigo">Royal Indigo (#1E1B4B)</option>
                          <option value="violet">Deep Violet (#2E1065)</option>
                          <option value="teal">Abyss Teal (#042F2E)</option>
                        </select>
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Preloader Hold Duration</label>
                          <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400">{(preloaderDuration / 1000).toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60000"
                          step="500"
                          value={preloaderDuration}
                          onChange={(e) => setPreloaderDuration(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5">Controls how many seconds (up to 60.0s max / 1 minute) the preloader screen is held active.</span>
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Indicator Style</label>
                        <select
                          value={preloaderStyle}
                          onChange={(e) => setPreloaderStyle(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer outline-none"
                        >
                          <option value="linear">Linear horizontal slider line</option>
                          <option value="circle">Circular spinner orbit ring</option>
                        </select>
                      </div>

                      <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Dynamic Logo Animation</label>
                        <select
                          value={preloaderAnimation}
                          onChange={(e) => setPreloaderAnimation(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold cursor-pointer outline-none"
                        >
                          <option value="pulse">Breathing Scale Pulse</option>
                          <option value="spin">Smooth Orbital Spin Rotation</option>
                          <option value="glow">Inner Dynamic Radial Glow</option>
                          <option value="bounce">Bouncing Logo bounce</option>
                          <option value="flip">3D Cards logo-flip (Recommended!)</option>
                        </select>
                      </div>

                      <div className="md:col-span-12 space-y-2 border-t border-slate-200/50 dark:border-slate-800/60 pt-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Custom Preloader Vector Graphic</label>
                        <div className="flex flex-wrap gap-3 items-center">
                          <label className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer shadow-xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-violet-500" />
                            <span>Upload Dedicated Loading Icon</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/svg+xml"
                              onChange={handlePreloaderLogoChange}
                              className="hidden"
                            />
                          </label>
                          {preloaderLogoUrl && (
                            <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-905 border border-slate-200 rounded-lg max-h-10">
                              <img src={preloaderLogoUrl} alt="Loader logo" className="h-6 object-contain" />
                              <button type="button" onClick={() => { setPreloaderLogoUrl(''); setPreloaderLogoFile(null); }} className="text-[9px] text-rose-500 font-bold px-1">Reset</button>
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Falls back to the main corporate brand logo if unassigned.</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Customization Panel */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-violet-500" />
                  Footer Brand & Style Customization
                </h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                  Customize the presentation, colors, branding description text, copyright notice, and social/logo element visibilities of the website footer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/35 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {/* Colors */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Footer Background Color</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={footerBg}
                        onChange={(e) => setFooterBg(e.target.value)}
                        className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                      />
                      <input
                        type="text"
                        value={footerBg}
                        onChange={(e) => setFooterBg(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Footer Text Color</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                      />
                      <input
                        type="text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Footer Icons & Accents Color</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={footerIconColor}
                        onChange={(e) => setFooterIconColor(e.target.value)}
                        className="w-14 h-11 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 p-1"
                      />
                      <input
                        type="text"
                        value={footerIconColor}
                        onChange={(e) => setFooterIconColor(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Brand Description */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Footer Brand Description</label>
                    <textarea
                      value={footerBrandDesc}
                      onChange={(e) => setFooterBrandDesc(e.target.value)}
                      placeholder="e.g. Your trusted partner for industrial trading..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-sans outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Copyright Notice */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Footer Copyright Notice</label>
                    <input
                      type="text"
                      value={footerCopyright}
                      onChange={(e) => setFooterCopyright(e.target.value)}
                      placeholder="e.g. © 2025 Stonex Industrial Solutions. All rights reserved."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-sans outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Element Toggles */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/60">
                    <label className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooterLogo}
                        onChange={(e) => setShowFooterLogo(e.target.checked)}
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Show Footer Brand Logo</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Show or hide the corporate brand logo at the footer.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooterSocial}
                        onChange={(e) => setShowFooterSocial(e.target.checked)}
                        className="w-4 h-4 text-violet-600 rounded"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">Show Footer Social Icons</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Toggle the visibility of social buttons under the footer brand description.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-70 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-md shadow-slate-950/10"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing Theme Parameters...</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4" />
                    <span>Save Theme Configuration</span>
                  </>
                )}
              </button>

            </div>
          </form>
        ) : (
          /* CONSOLIDATED CHILD SECTIONS */
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-xs relative">
            <div className="absolute top-6 right-6 flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              {currentTabInfo && <currentTabInfo.icon className="w-3.5 h-3.5 text-violet-500" />}
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">
                Editing: {currentTabInfo?.label}
              </span>
            </div>

            <div className="pt-6">
              {renderSubTabContent()}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
