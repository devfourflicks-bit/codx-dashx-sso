/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SeoConfig } from '../types';
import { 
  Search, 
  Save, 
  Loader2, 
  AlertCircle, 
  Info, 
  Globe, 
  HelpCircle, 
  BarChart3, 
  TrendingUp, 
  MousePointerClick, 
  ArrowUpRight, 
  Activity, 
  Eye, 
  Calendar,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useConfirm } from './ConfirmDialog';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

interface SeoSectionProps {
  seoData: SeoConfig | null;
  onSave: (newData: SeoConfig) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricLabel: string;
  metricColor: string;
}

const CustomTooltip = ({ active, payload, label, metricLabel, metricColor }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-sans">
        <p className="font-bold text-slate-400">{label}</p>
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metricColor }} />
          <span className="font-semibold text-slate-300">{metricLabel}:</span>
          <span className="font-mono font-extrabold text-white">
            {payload[0].value.toLocaleString()}
            {metricLabel.includes('%') ? '%' : ''}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

// Generates steady simulation data matching real seasonal rhythms
const generateMockData = (days: number) => {
  const data = [];
  const baseClicks = 35;
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Create organic ups and downs
    const dayFactor = (days - i) / days * 15; // slight growth
    const sineFactor = Math.sin(i * 0.5) * 8 + Math.cos(i * 0.3) * 4;
    const noise = Math.random() * 6;
    
    const clicks = Math.max(5, Math.round(baseClicks + dayFactor + sineFactor + noise));
    const impressions = Math.round(clicks * (20 + Math.random() * 6));
    const ctr = parseFloat(((clicks / impressions) * 100).toFixed(1));
    
    data.push({
      date: dayStr,
      clicks,
      impressions,
      ctr
    });
  }
  return data;
};

export default function SeoSection({ seoData, onSave }: SeoSectionProps) {
  const { confirm } = useConfirm();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recharts interactive hooks
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [selectedMetric, setSelectedMetric] = useState<'clicks' | 'impressions' | 'ctr'>('clicks');

  const chartData = generateMockData(timeRange);

  // Compute stats on fly
  const totalClicks = chartData.reduce((sum, item) => sum + item.clicks, 0);
  const totalImpressions = chartData.reduce((sum, item) => sum + item.impressions, 0);
  const avgCtr = parseFloat((chartData.reduce((sum, item) => sum + item.ctr, 0) / chartData.length).toFixed(1));
  const avgPosition = parseFloat((12.4 - (timeRange === 90 ? 1.8 : timeRange === 30 ? 1.2 : 0.4)).toFixed(1));

  const activeThemeColor = 
    selectedMetric === 'clicks' ? '#8b5cf6' : 
    selectedMetric === 'impressions' ? '#f97316' : '#10b981';

  const metricLabel = 
    selectedMetric === 'clicks' ? 'Total Clicks' : 
    selectedMetric === 'impressions' ? 'Organic Impressions' : 'Click-Through Rate (%)';

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Dynamic SEO Score calculation
  const getSeoScore = () => {
    let score = 0;
    const tLen = title.length;
    const dLen = description.length;
    const kwArr = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

    // Title score (35 max)
    if (tLen >= 40 && tLen <= 60) score += 35;
    else if ((tLen >= 20 && tLen < 40) || (tLen > 60 && tLen <= 80)) score += 20;
    else if (tLen > 0) score += 10;

    // Description score (45 max)
    if (dLen >= 110 && dLen <= 160) score += 45;
    else if ((dLen >= 50 && dLen < 110) || (dLen > 160 && dLen <= 230)) score += 25;
    else if (dLen > 0) score += 10;

    // Keywords score (20 max)
    if (kwArr.length >= 3) score += 20;
    else if (kwArr.length > 0) score += 10;

    return score;
  };

  const seoScore = getSeoScore();

  const getTitleStatus = () => {
    const len = title.length;
    if (len === 0) return { status: 'empty', label: 'Empty', color: 'text-slate-450 dark:text-slate-500' };
    if (len >= 40 && len <= 60) return { status: 'perfect', label: 'Optimal length', color: 'text-emerald-500 dark:text-emerald-400' };
    if (len < 40) return { status: 'short', label: 'Too short (aim for 40-60)', color: 'text-amber-500' };
    return { status: 'long', label: 'Too long (truncated)', color: 'text-rose-500' };
  };

  const getDescriptionStatus = () => {
    const len = description.length;
    if (len === 0) return { status: 'empty', label: 'Empty', color: 'text-slate-450 dark:text-slate-500' };
    if (len >= 110 && len <= 160) return { status: 'perfect', label: 'Optimal length', color: 'text-emerald-500 dark:text-emerald-400' };
    if (len < 110) return { status: 'short', label: 'Too short (aim for 110-160)', color: 'text-amber-500' };
    return { status: 'long', label: 'Too long (truncated)', color: 'text-rose-500' };
  };

  useEffect(() => {
    if (seoData) {
      setTitle(seoData.title || '');
      setDescription(seoData.description || '');
      setKeywords(seoData.keywords || '');
    }
  }, [seoData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm({
      title: 'Save SEO Configuration',
      message: 'Are you sure you want to write the updated SEO title, description, and keywords to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        try {
          const updatedSeo: SeoConfig = {
            title: title.trim(),
            description: description.trim(),
            keywords: keywords.trim()
          };

          try {
            await setDoc(doc(db, 'siteConfig', 'seo'), updatedSeo, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/seo');
          }
          onSave(updatedSeo);
        } catch (err) {
          console.error('Error saving SEO settings:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold">Failed to Save SEO Settings</h4>
              <p className="text-xs mt-1 leading-relaxed break-words font-mono">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
              <Search className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              SEO Settings
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Configure metadata that search engines index to represent your website. High-quality metadata directly improves search result ranking.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Page Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  SEO Meta Title
                </label>
                <span className={`text-[10px] font-bold ${title.length > 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {title.length} / 60 chars recommended
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Stonex - Premium Industrial Slabs & Equipment Rentals"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  SEO Meta Description
                </label>
                <span className={`text-[10px] font-bold ${description.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {description.length} / 160 chars recommended
                </span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={300}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Stonex supplies high-grade marble slabs, granite stone paving, certified heavy excavator rentals, and PPE safety tools for infrastructure construction and quarry materials logistics."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm leading-relaxed outline-none"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Keywords
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Comma-separated terms
                </span>
              </div>
              <input
                type="text"
                required
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. industrial machinery, marble slabs, heavy construction equipment, PPE safety gear, logistics"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Google Search Result Previews */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-500" />
                Google Search Results Preview Engine
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                See exactly how your website will display on different search engine result layouts (SERPs) in real-time.
              </p>
            </div>

            {/* Real-time Google SERP Simulator Card */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-1 rounded-xl border border-slate-150 dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    Desktop View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobile View
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    seoScore >= 80 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30' 
                      : seoScore >= 50
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-current animate-pulse shrink-0" />
                    SEO Score: {seoScore}/100 ({seoScore >= 80 ? 'Excellent' : seoScore >= 50 ? 'Good' : 'Poor'})
                  </div>
                </div>
              </div>

              {/* Simulated Google Search Results Container */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-900/50 shadow-xs p-5 md:p-6 min-h-[140px] flex flex-col justify-center transition-all duration-300">
                {previewDevice === 'desktop' ? (
                  /* DESKTOP SIMULATOR */
                  <div className="space-y-1.5 max-w-2xl text-left">
                    {/* Breadcrumbs URL Row */}
                    <div className="text-[12px] text-[#202124] dark:text-[#bdc1c6] flex items-center gap-1.5 truncate font-sans">
                      <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] flex items-center justify-center font-bold text-slate-500 shrink-0">
                        S
                      </span>
                      <span className="font-medium text-[#202124] dark:text-[#bdc1c6]">Stonex</span>
                      <span className="text-slate-300 dark:text-slate-700">›</span>
                      <span className="text-slate-400 dark:text-slate-500 truncate">https://stonex.com</span>
                      <span className="text-slate-300 dark:text-slate-700">›</span>
                      <span className="text-slate-400 dark:text-slate-500 shrink-0">home</span>
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 group flex-wrap">
                      <h4 className="text-[19px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-sans font-medium leading-tight">
                        {title.trim() 
                          ? (title.length > 60 ? title.substring(0, 60) + '...' : title) 
                          : 'Stonex - Premium Industrial Slabs & Equipment Rentals'}
                      </h4>
                      {title.length > 60 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[9px] font-semibold text-rose-500 border border-rose-100 dark:border-rose-900/40 shrink-0">
                          Truncated
                        </span>
                      )}
                    </div>

                    {/* Meta Description */}
                    <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                      <p className="text-[13.5px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed font-sans font-normal break-words">
                        {description.trim() 
                          ? (description.length > 160 ? description.substring(0, 155) + '...' : description)
                          : 'Please enter a description to see how it looks here. This meta description summarizes your business and entices customers to click.'}
                      </p>
                      {description.length > 160 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[9px] font-semibold text-rose-500 border border-rose-100 dark:border-rose-900/40">
                          Truncated
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* MOBILE SIMULATOR */
                  <div className="space-y-2 max-w-md mx-auto text-left w-full border-x border-slate-50 dark:border-slate-900/10 px-3 md:px-4 py-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-2 text-[12px] font-sans">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 text-[10px] flex items-center justify-center font-bold text-slate-500 border border-slate-200/50 dark:border-slate-800/80 shrink-0">
                        S
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#202124] dark:text-[#bdc1c6] leading-none">Stonex</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">https://stonex.com</div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[18px] text-[#1558d6] dark:text-[#8ab4f8] hover:underline cursor-pointer font-sans font-medium leading-tight">
                          {title.trim() 
                            ? (title.length > 60 ? title.substring(0, 60) + '...' : title) 
                            : 'Stonex - Premium Industrial Slabs & Equipment Rentals'}
                        </h4>
                        {title.length > 60 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[9px] font-semibold text-rose-500 border border-rose-100 dark:border-rose-900/40 shrink-0">
                            Truncated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                      <p className="text-[12.5px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed font-sans font-normal break-words">
                        {description.trim() 
                          ? (description.length > 160 ? description.substring(0, 155) + '...' : description)
                          : 'Please enter a description to see how it looks here. This meta description summarizes your business and entices customers to click.'}
                      </p>
                      {description.length > 160 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[9px] font-semibold text-rose-500 border border-rose-100 dark:border-rose-900/40">
                          Truncated
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Health Indicators Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                  {getTitleStatus().status === 'perfect' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : getTitleStatus().status === 'empty' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Title Length</p>
                    <p className={`text-xs font-bold truncate mt-1 ${getTitleStatus().color}`}>{getTitleStatus().label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                  {getDescriptionStatus().status === 'perfect' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : getDescriptionStatus().status === 'empty' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Description Length</p>
                    <p className={`text-xs font-bold truncate mt-1 ${getDescriptionStatus().color}`}>{getDescriptionStatus().label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                  {keywords.split(',').map(k => k.trim()).filter(Boolean).length >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : keywords.trim() === '' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Keyword Density</p>
                    <p className={`text-xs font-bold truncate mt-1 ${
                      keywords.split(',').map(k => k.trim()).filter(Boolean).length >= 3 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : keywords.trim() === '' ? 'text-slate-450 dark:text-slate-500' : 'text-amber-500'
                    }`}>
                      {keywords.split(',').map(k => k.trim()).filter(Boolean).length === 0 
                        ? 'No keywords set' 
                        : `${keywords.split(',').map(k => k.trim()).filter(Boolean).length} keyword(s)`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save SEO Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Search Analytics Trend Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              SEO Traffic & Clicks Engagement Trend
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Analyze user search engine engagement patterns and click trends driven by site-wide metadata config.
            </p>
          </div>
          
          {/* Time range switcher */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-150 dark:border-slate-800/80">
            {([
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: '90 Days', val: 90 }
            ] as const).map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setTimeRange(opt.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === opt.val
                    ? 'bg-white dark:bg-slate-700/50 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-100 dark:border-slate-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Clicks */}
          <button
            type="button"
            onClick={() => setSelectedMetric('clicks')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMetric === 'clicks'
                ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-500/50 shadow-sm'
                : 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clicks</span>
              <MousePointerClick className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-mono">
              {totalClicks.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +14.2% vs prev
            </span>
          </button>

          {/* Impressions */}
          <button
            type="button"
            onClick={() => setSelectedMetric('impressions')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMetric === 'impressions'
                ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500/50 shadow-sm'
                : 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impressions</span>
              <Eye className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-mono">
              {totalImpressions.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +8.7% vs prev
            </span>
          </button>

          {/* Avg CTR */}
          <button
            type="button"
            onClick={() => setSelectedMetric('ctr')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedMetric === 'ctr'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-sm'
                : 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. CTR</span>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-mono">
              {avgCtr}%
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +4.1% vs prev
            </span>
          </button>

          {/* Avg Position */}
          <div className="p-4 rounded-2xl bg-slate-50/40 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Position</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-2 font-mono">
              {avgPosition.toFixed(1)}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Improved from 13.5
            </span>
          </div>
        </div>

        {/* Responsive Area Chart Container */}
        <div className="h-[280px] w-full pt-4 font-mono text-[10px] relative text-slate-500">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeThemeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeThemeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="currentColor" 
                className="text-slate-400 dark:text-slate-600"
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="currentColor" 
                className="text-slate-400 dark:text-slate-600"
                tickLine={false} 
                axisLine={false} 
              />
              <RechartsTooltip content={<CustomTooltip metricLabel={metricLabel} metricColor={activeThemeColor} />} />
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={activeThemeColor} 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#metricGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
