/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ContactConfig } from '../types';
import { PhoneCall, Mail, MapPin, Clock, Facebook, Linkedin, Instagram, Phone, Save, Loader2, AlertCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { useConfirm } from './ConfirmDialog';

interface ContactSectionProps {
  contactData: ContactConfig | null;
  onSave: (newData: ContactConfig) => void;
}

export default function ContactSection({ contactData, onSave }: ContactSectionProps) {
  const { confirm } = useConfirm();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  
  // Social links
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contactData) {
      setEmail(contactData.email || '');
      setPhone(contactData.phone || '');
      setAddress(contactData.address || '');
      setHours(contactData.hours || '');
      if (contactData.social) {
        setFacebook(contactData.social.facebook || '');
        setLinkedin(contactData.social.linkedin || '');
        setInstagram(contactData.social.instagram || '');
        setWhatsapp(contactData.social.whatsapp || '');
      }
      setImageUrl(contactData.imageUrl || '');
    }
  }, [contactData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm({
      title: 'Save Contact Coordinates',
      message: 'Are you sure you want to write the modified contact details, social links, and business hours to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        try {
          const updatedContact: ContactConfig = {
            email,
            phone,
            address,
            hours,
            social: {
              facebook,
              linkedin,
              instagram,
              whatsapp
            },
            imageUrl
          };

          try {
            await setDoc(doc(db, 'siteConfig', 'contact'), updatedContact, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/contact');
          }
          onSave(updatedContact);
        } catch (err) {
          console.error('Error saving contact settings:', err);
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
            <h4 className="text-sm font-bold">Failed to Save Contact Information</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <PhoneCall className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Contact & Social Profiles
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Configure default email, phone numbers, location address, hours, and instant messenger integration handles.
          </p>
        </div>

        {/* Contact info fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Support Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@stonex.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone Number
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +966 50 123 4567"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Physical Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Office 102, Building A, Olaya District, Riyadh, Saudi Arabia"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Working Hours Description
            </label>
            <input
              type="text"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. Sat - Thu: 8:00 AM - 6:00 PM (Friday Closed)"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          {/* Contact Section Cover/Branding Image */}
          <div className="space-y-2 md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Contact Profile / Office Location Image
            </label>
            <div className="flex items-center gap-5 mt-2">
              {imageUrl ? (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt="Contact Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/20 flex-shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  id="contact-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const base64 = await compressAndEncodeImage(file, 600, 0.85);
                        setImageUrl(base64);
                      } catch (err) {
                        console.error("Error processing contact image upload:", err);
                        alert("Failed to process image. Make sure it's a valid image file.");
                      }
                    }
                  }}
                />
                <label
                  htmlFor="contact-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imageUrl ? 'Change Contact Image' : 'Upload Contact Image'}</span>
                </label>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Set a custom cover, QR code, or storefront photo for your contact details (Base64 optimized)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social media links */}
        <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Social Media Hyperlinks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Facebook className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                Facebook Link URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="e.g. https://facebook.com/stonex"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-slate-400 hover:text-blue-700" />
                LinkedIn Link URL
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="e.g. https://linkedin.com/company/stonex"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Instagram className="w-4 h-4 text-slate-400 hover:text-pink-600" />
                Instagram Link URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. https://instagram.com/stonex"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 hover:text-emerald-500" />
                WhatsApp Contact Number
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +966501234567"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-75 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Contact Details...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Contact Info</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
