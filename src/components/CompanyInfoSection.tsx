/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CompanyInfo } from '../types';
import { Building2, Save, Loader2, Award, Briefcase, Sparkles, ShoppingBag, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { useConfirm } from './ConfirmDialog';

interface CompanyInfoSectionProps {
  companyData: CompanyInfo | null;
  onSave: (newData: CompanyInfo) => void;
}

export default function CompanyInfoSection({ companyData, onSave }: CompanyInfoSectionProps) {
  const { confirm } = useConfirm();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  const [statProjects, setStatProjects] = useState(0);
  const [statClients, setStatClients] = useState(0);
  const [statYears, setStatYears] = useState(0);
  const [statProducts, setStatProducts] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyData) {
      setName(companyData.name || '');
      setTagline(companyData.tagline || '');
      setAbout(companyData.about || '');
      setStatProjects(companyData.statProjects || 0);
      setStatClients(companyData.statClients || 0);
      setStatYears(companyData.statYears || 0);
      setStatProducts(companyData.statProducts || 0);
      setImageUrl(companyData.imageUrl || '');
    }
  }, [companyData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm({
      title: 'Save Company Information',
      message: 'Are you sure you want to write the updated company profile, tagline, and statistics to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        try {
          const updatedInfo: CompanyInfo = {
            name,
            tagline,
            about,
            statProjects: Number(statProjects),
            statClients: Number(statClients),
            statYears: Number(statYears),
            statProducts: Number(statProducts),
            imageUrl
          };

          try {
            await setDoc(doc(db, 'siteConfig', 'companyInfo'), updatedInfo, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/companyInfo');
          }
          onSave(updatedInfo);
        } catch (err) {
          console.error('Error saving company profile info:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setSaving(false);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-4xl">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold">Failed to Save Profile Settings</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            About Stonex (Company Profile)
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Update your company profile information, primary values, tagline, and success metrics displayed on the live site.
          </p>
        </div>

        {/* General Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stonex Supplies Co."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Company Tagline</label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Leading Distributor of Premium Engineering Supplies"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">About Us / Description</label>
            <textarea
              required
              rows={5}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Provide a detailed overview of your company, history, expertise, and operations..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm leading-relaxed outline-none"
            />
          </div>

          {/* About Us Page Branding/Cover Image */}
          <div className="space-y-2 md:col-span-2 border-t border-slate-100 dark:border-slate-700/60 pt-5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              About Section Showcase Image
            </label>
            <div className="flex items-center gap-5 mt-2">
              {imageUrl ? (
                <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex-shrink-0 shadow-sm">
                  <img
                    src={imageUrl}
                    alt="About Stonex Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer shadow"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-36 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/20 flex-shrink-0">
                  <ImageIcon className="w-8 h-8 animate-pulse text-slate-300" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  id="about-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await compressAndEncodeImage(file, 800, 0.85);
                        setImageUrl(base64);
                      } catch (err) {
                        console.error("Error processing company about image:", err);
                        alert("Failed to process image. Make sure it's a valid image file.");
                      }
                    }
                  }}
                />
                <label
                  htmlFor="about-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imageUrl ? 'Change About Image' : 'Upload About Image'}</span>
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                  Upload an image representing your company team, facility, or storefront. Supported in high resolution.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Metric Fields */}
        <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-violet-500" />
            Performance & Track Record Metrics
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Projects Done
              </label>
              <input
                type="number"
                required
                min={0}
                value={statProjects}
                onChange={(e) => setStatProjects(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                Happy Clients
              </label>
              <input
                type="number"
                required
                min={0}
                value={statClients}
                onChange={(e) => setStatClients(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                Years Active
              </label>
              <input
                type="number"
                required
                min={0}
                value={statYears}
                onChange={(e) => setStatYears(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                Products
              </label>
              <input
                type="number"
                required
                min={0}
                value={statProducts}
                onChange={(e) => setStatProducts(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-75 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Profile Info...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save About Info</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
