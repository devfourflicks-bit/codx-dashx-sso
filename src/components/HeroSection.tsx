/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { compressAndEncodeImage } from '../lib/imageUtils';
import { HeroConfig } from '../types';
import { Image, Upload, Save, Loader2, PlayCircle, Eye, AlertCircle, Sliders, Sun, Moon, Monitor, Video, Film, Boxes } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';

interface HeroSectionProps {
  heroData: HeroConfig | null;
  onSave: (newData: HeroConfig) => void;
}

export default function HeroSection({ heroData, onSave }: HeroSectionProps) {
  const { confirm } = useConfirm();
  const [title1, setTitle1] = useState('');
  const [title2, setTitle2] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [btn1Text, setBtn1Text] = useState('');
  const [badge, setBadge] = useState('');
  const [overlayType, setOverlayType] = useState<'white' | 'dark'>('white');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(80);
  
  // Media configuration
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'spline'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  const [splineUrl, setSplineUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'storage' | 'base64'>('base64');

  // Carousel background images
  const [bgImages, setBgImages] = useState<string[]>(['', '', '']);
  const [imageFiles, setImageFiles] = useState<Array<File | null>>([null, null, null]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (heroData) {
      setTitle1(heroData.title1 || '');
      setTitle2(heroData.title2 || '');
      setSubtitle(heroData.subtitle || '');
      setBtn1Text(heroData.btn1Text || '');
      setBadge(heroData.badge || '');
      setOverlayType(heroData.overlayType || 'white');
      setOverlayOpacity(
        heroData.overlayOpacity !== undefined 
          ? heroData.overlayOpacity 
          : (heroData.overlayType === 'dark' ? 40 : 80)
      );
      setMediaType(heroData.mediaType || 'image');
      setVideoUrl(heroData.videoUrl || '');
      setSplineUrl(heroData.splineUrl || '');
      if (heroData.videoUrl?.startsWith('data:')) {
        setUploadMethod('base64');
      } else if (heroData.videoUrl) {
        setUploadMethod('storage');
      }
      
      const imgs = ['', '', ''];
      if (heroData.bgImages && heroData.bgImages.length > 0) {
        heroData.bgImages.forEach((img, idx) => {
          if (idx < 3) imgs[idx] = img;
        });
      }
      setBgImages(imgs);
    }
  }, [heroData]);

  const handleImageChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFiles = [...imageFiles];
      newFiles[idx] = file;
      setImageFiles(newFiles);

      const newUrls = [...bgImages];
      newUrls[idx] = URL.createObjectURL(file);
      setBgImages(newUrls);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setError(null);
      
      if (uploadMethod === 'base64') {
        // Direct Base64 Mode
        if (file.size > 800 * 1024) {
          setError('Video file size exceeds 800KB. To prevent Firestore document size limit overflows (which are strictly limited to 1MB per document by Google Cloud), please compress your video loop under 800KB, switch to "Cloud Storage" mode, or use our pre-configured Stock Video presets below.');
          return;
        }

        setUploadingVideo(true);
        setUploadProgress(25);

        try {
          const reader = new FileReader();
          reader.onload = () => {
            setVideoUrl(reader.result as string);
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(null), 1000);
            setUploadingVideo(false);
          };
          reader.onerror = () => {
            setError('Failed to read video file format.');
            setUploadProgress(null);
            setUploadingVideo(false);
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error('Error starting video read:', err);
          setError('Failed to encode video as base64 data.');
          setUploadProgress(null);
          setUploadingVideo(false);
        }
      } else {
        // Cloud Storage Mode
        if (file.size > 60 * 1024 * 1024) {
          setError('Video file size exceeds 60MB. Please upload a compressed clip or provide a streaming link.');
          return;
        }

        setUploadingVideo(true);
        setUploadProgress(0);

        try {
          const storageRef = ref(storage, `videos/hero_${Date.now()}_${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (err) => {
              console.error('Video upload failed:', err);
              setError('Failed to upload video to Firebase Storage. Your Firebase storage might be unprovisioned or restricted. Please switch to "Direct Base64" mode for files <2MB.');
              setUploadProgress(null);
              setUploadingVideo(false);
            },
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setVideoUrl(downloadUrl);
              setUploadProgress(null);
              setUploadingVideo(false);
            }
          );
        } catch (err) {
          console.error('Error starting video upload:', err);
          setError('Failed to initiate video upload. Try using "Direct Base64" mode for a 100% reliable local fallback.');
          setUploadProgress(null);
          setUploadingVideo(false);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingVideo) {
      setError('Please wait until the background video finish uploading before saving.');
      return;
    }

    confirm({
      title: 'Save Hero Configuration',
      message: 'Are you sure you want to write the modified Hero section banners, media type, and tagline copywriting to Firestore?',
      type: 'save',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        try {
          const finalBgImages = [...bgImages];

          // Compress and convert files sequentially (only if image mode is active)
          if (mediaType === 'image') {
            for (let i = 0; i < 3; i++) {
              const file = imageFiles[i];
              if (file) {
                try {
                  // Compress background images to max 1000px and good quality to optimize loading speeds
                  const base64Url = await compressAndEncodeImage(file, 1000, 0.75);
                  finalBgImages[i] = base64Url;
                } catch (storageErr) {
                  console.error(`Error encoding slide ${i + 1}: `, storageErr);
                  throw new Error(`Failed to encode slide image ${i + 1}. Detail: ` + (storageErr instanceof Error ? storageErr.message : String(storageErr)));
                }
              }
            }
          }

          // Filter out any empty strings
          const filteredBg = finalBgImages.filter(img => img !== '');

          const updatedHero: HeroConfig = {
            title1,
            title2,
            subtitle,
            btn1Text,
            badge,
            bgImages: filteredBg,
            mediaType,
            videoUrl,
            splineUrl,
            overlayType,
            overlayOpacity
          };

          try {
            await setDoc(doc(db, 'siteConfig', 'hero'), updatedHero, { merge: true });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.WRITE, 'siteConfig/hero');
          }

          onSave(updatedHero);
        } catch (err) {
          console.error('Error saving hero content config:', err);
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
            <h4 className="text-sm font-bold">Failed to Save Hero Content</h4>
            <p className="text-xs mt-1 leading-relaxed break-words font-mono">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-100 dark:border-slate-700 pb-5">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Image className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Hero Content & Slideshow
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Edit titles, call-to-action details, badges, and upload slideshow background images for the landing banner.
          </p>
        </div>

        {/* Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Header Line 1</label>
            <input
              type="text"
              required
              value={title1}
              onChange={(e) => setTitle1(e.target.value)}
              placeholder="e.g. Modern Architecture"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Header Line 2</label>
            <input
              type="text"
              required
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              placeholder="e.g. Elegant Stoneworks"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Short Subtitle</label>
            <textarea
              required
              rows={3}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. High-quality natural granite, marble, and paving stones custom crafted for luxury interior and landscape designs..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Primary Button Label</label>
            <input
              type="text"
              required
              value={btn1Text}
              onChange={(e) => setBtn1Text(e.target.value)}
              placeholder="e.g. Explore Catalog"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pill Badge Text</label>
            <input
              type="text"
              required
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="e.g. 100% PREMIUM ORIGINAL"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Media Background Configuration */}
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <PlayCircle className="w-4.5 h-4.5 text-violet-500" />
                Hero Section Background Media
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Choose whether you want a sliding image gallery or a background video loop.
              </p>
            </div>
            
            {/* Segmented Tabs Control */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'image'
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                Image Gallery
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'video'
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Background Video
              </button>
              <button
                type="button"
                onClick={() => setMediaType('spline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'spline'
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                Spline 3D Scene
              </button>
            </div>
          </div>

          {mediaType === 'image' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-150 dark:border-slate-700 rounded-2xl flex flex-col items-stretch">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Slide Image {idx + 1}</span>
                  
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-white dark:hover:bg-slate-800 p-4 rounded-xl cursor-pointer transition-all text-center group">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-violet-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 group-hover:text-violet-600">
                      Upload Image File
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleImageChange(idx, e)}
                      className="hidden"
                    />
                  </label>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">Or Paste Image Link (URL)</span>
                    <input
                      type="url"
                      value={bgImages[idx]?.startsWith('data:') ? '' : bgImages[idx] || ''}
                      onChange={(e) => {
                        const newUrls = [...bgImages];
                        newUrls[idx] = e.target.value;
                        setBgImages(newUrls);
                        // Clear file
                        const newFiles = [...imageFiles];
                        newFiles[idx] = null;
                        setImageFiles(newFiles);
                      }}
                      placeholder="e.g. https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] outline-none focus:border-violet-500"
                    />
                  </div>

                  {bgImages[idx] ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group mt-auto">
                      <img src={bgImages[idx]} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-full">
                          <Eye className="w-3 h-3" />
                          Preview Active
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-slate-100/50 dark:bg-slate-950/30 border border-slate-150 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 font-semibold italic mt-auto">
                      No image uploaded
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : mediaType === 'video' ? (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700 rounded-2xl p-5 md:p-6 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                 {/* Video Upload Control */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Option A: Upload Video File</span>
                    
                    {/* Method Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadMethod('base64');
                          setError(null);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          uploadMethod === 'base64'
                            ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                        title="Stores video as Base64 in Firestore directly. 100% reliable, no storage setup required."
                      >
                        Direct Base64 (Under 2MB)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadMethod('storage');
                          setError(null);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          uploadMethod === 'storage'
                            ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                        title="Uploads video file to Firebase Storage. Recommended for larger/longer videos."
                      >
                        Cloud Storage (Max 60MB)
                      </button>
                    </div>
                  </div>
                  
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-white dark:hover:bg-slate-800 p-6 rounded-2xl cursor-pointer transition-all text-center group min-h-[150px]">
                    <Film className={`w-8 h-8 mb-2 ${uploadingVideo ? 'text-violet-500 animate-pulse' : 'text-slate-400 group-hover:text-violet-500'}`} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-violet-600">
                      {uploadingVideo ? 'Processing Background Video...' : 'Drag & Drop or Click to Upload'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {uploadMethod === 'base64'
                        ? 'Direct Base64 mode: Max file size 2MB for Firestore'
                        : 'Cloud Storage mode: Supports MP4, WebM, OGG up to 60MB'}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4, video/webm, video/ogg"
                      disabled={uploadingVideo}
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                  </label>

                  {uploadProgress !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-violet-600 dark:text-violet-400">
                        <span>Uploading file...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video URL Manual Entry */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Option B: Streaming / Background Video URL</span>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Video Link / Source URL</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="e.g. https://example.com/videos/bg_loop.mp4"
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Uploading a video will automatically host it securely inside your cloud project and populate this field. Alternatively, you can paste any direct web link to an MP4 video or CDN asset.
                  </p>
                </div>

                {/* Video Preset Stock Loops */}
                <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Option C: High-Speed Stock Video Loops (Recommended)</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Don't have a video file or facing uploader limits? Click to instantly apply one of our hand-picked, lightweight industrial video loops hosted on high-speed CDNs. These are 100% optimized for hero sections and guaranteed to autoplay.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      {
                        name: 'Heavy Machinery',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-heavy-excavator-working-on-a-construction-site-41525-large.mp4',
                        desc: 'Cranes & Excavators'
                      },
                      {
                        name: 'Industrial Trading',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-welder-working-with-metal-and-sparks-41530-large.mp4',
                        desc: 'Welding & Fabrication'
                      },
                      {
                        name: 'Cargo Logistics',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-cargo-ship-loaded-with-containers-in-the-sea-41551-large.mp4',
                        desc: 'Freight & Dispatch'
                      },
                      {
                        name: 'Steel Production',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-molten-steel-being-poured-in-a-metallurgy-plant-41535-large.mp4',
                        desc: 'Materials & Castings'
                      }
                    ].map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setVideoUrl(preset.url);
                          setError(null);
                        }}
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          videoUrl === preset.url
                            ? 'bg-violet-500/5 dark:bg-violet-500/10 border-violet-500 ring-2 ring-violet-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className={`text-xs font-extrabold ${videoUrl === preset.url ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {preset.name}
                        </span>
                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 leading-snug">
                          {preset.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video Preview Player */}
              {videoUrl && (
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-violet-500" />
                    Uploaded Video Active Preview
                  </span>
                  <div className="aspect-video max-w-md rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black relative">
                    <video
                      key={videoUrl}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                      loop
                      playsInline
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700 rounded-2xl p-5 md:p-6 space-y-6 animate-fade-in">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Spline 3D Scene Configuration</span>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                  Your website frontend implements interactive 3D elements powered by <strong className="text-slate-600 dark:text-slate-300">Spline</strong>. You can configure the URL of the exported Spline scene here. The frontend will dynamically fetch and render this 3D model.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Spline Viewer URL / Embed Link</label>
                  <input
                    type="url"
                    value={splineUrl}
                    onChange={(e) => setSplineUrl(e.target.value)}
                    placeholder="e.g. https://my.spline.design/stonex-scene-id/ or .splinecode link"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-violet-500"
                  />
                </div>

                <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 p-4 rounded-xl text-xs text-violet-700 dark:text-violet-400 leading-relaxed space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-violet-800 dark:text-violet-300">
                    <Boxes className="w-4 h-4 shrink-0" />
                    How to get your Spline URL:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open your design scene in <strong>Spline (spline.design)</strong>.</li>
                    <li>Click the <strong>Export</strong> button in the top toolbar.</li>
                    <li>Choose the <strong>Public URL</strong> or <strong>Viewer</strong> tab.</li>
                    <li>Click <strong>Update</strong> / <strong>Publish</strong>, then copy the generated link (e.g., <code className="bg-white/60 dark:bg-black/40 px-1 py-0.5 rounded text-[10px] font-mono">https://my.spline.design/yourdesign-...</code>).</li>
                  </ol>
                </div>
              </div>

              {/* Spline Live Preview Player */}
              {splineUrl && (
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-violet-500" />
                    Spline 3D Live Interactive Preview
                  </span>
                  <div className="aspect-video max-w-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
                    <iframe
                      key={splineUrl}
                      src={splineUrl.replace('.splinecode', '')}
                      className="w-full h-full border-0"
                      title="Spline 3D Scene Preview"
                      allow="autoplay; fullscreen"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hero Overlay & Contrast Options */}
        <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-violet-500" />
              Overlay Theme & Opacity Controls
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md text-slate-500 font-mono">
              REAL-TIME ADAPTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Toggles */}
            <div className="space-y-5 bg-slate-50 dark:bg-slate-900/40 p-5 border border-slate-150 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Background Overlay Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOverlayType('white');
                      setOverlayOpacity(80);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      overlayType === 'white'
                        ? 'bg-white dark:bg-slate-800 border-violet-500 text-violet-600 dark:text-violet-400 shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Sun className="w-4 h-4 shrink-0" />
                    Fade White (Light)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOverlayType('dark');
                      setOverlayOpacity(40);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      overlayType === 'dark'
                        ? 'bg-white dark:bg-slate-800 border-violet-500 text-violet-600 dark:text-violet-400 shadow-sm'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Moon className="w-4 h-4 shrink-0" />
                    40% Dark (Modern)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Choosing <span className="font-semibold text-slate-600 dark:text-slate-300">Fade White</span> applies high contrast dark slate typography. Choosing <span className="font-semibold text-slate-600 dark:text-slate-300">40% Dark</span> triggers modern ultra-readable light text overrides automatically.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Overlay Opacity
                  </label>
                  <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400 font-mono">
                    {overlayOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                  className="w-full accent-violet-600 dark:accent-violet-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Transparent (0%)</span>
                  <span>Opaque (100%)</span>
                </div>
              </div>
            </div>

            {/* Right: Live Miniature Mockup Card */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-violet-500" />
                Live Screen Mockup (Instant Preview)
              </span>
              
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 font-sans shadow-md bg-slate-950">
                {/* Simulated Hero Slideshow / Video Backing */}
                <div className="absolute inset-0">
                  {mediaType === 'spline' ? (
                    splineUrl ? (
                      <iframe
                        key={splineUrl}
                        src={splineUrl.replace('.splinecode', '')}
                        className="w-full h-full border-0 pointer-events-none select-none"
                        title="Spline Mockup"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-[10px] text-slate-500 italic p-4 text-center">
                        <Boxes className="w-5 h-5 mb-1 text-slate-600 animate-pulse" />
                        No Spline Viewer URL provided
                      </div>
                    )
                  ) : mediaType === 'video' ? (
                    videoUrl ? (
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-[10px] text-slate-500 italic p-4 text-center">
                        <Video className="w-5 h-5 mb-1 text-slate-600 animate-pulse" />
                        No video URL provided
                      </div>
                    )
                  ) : bgImages[0] ? (
                    <img
                      src={bgImages[0]}
                      alt="Mockup Slide"
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-500 italic">
                      No slides uploaded
                    </div>
                  )}
                </div>

                {/* Simulated Overlay */}
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{
                    background: overlayType === 'dark'
                      ? `linear-gradient(135deg, rgba(15, 23, 42, ${overlayOpacity / 100}) 0%, rgba(15, 23, 42, ${Math.max(0, overlayOpacity / 100 - 0.15)}) 100%)`
                      : `linear-gradient(135deg, rgba(255, 255, 255, ${overlayOpacity / 100}) 0%, rgba(255, 255, 255, ${Math.max(0, overlayOpacity / 100 - 0.15)}) 100%)`
                  }}
                />

                {/* Simulated Hero Text Content */}
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center z-10 select-none">
                  <div className="space-y-1 sm:space-y-2 max-w-[85%]">
                    {badge && (
                      <span className={`inline-block text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        overlayType === 'dark' 
                          ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300' 
                          : 'bg-violet-50 border border-violet-100 text-violet-600'
                      }`}>
                        {badge}
                      </span>
                    )}
                    
                    <h1 className={`text-[11px] sm:text-[14px] font-extrabold leading-tight ${
                      overlayType === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {title1 || 'Line 1'} <br />
                      <span className="text-orange-500">{title2 || 'Line 2'}</span>
                    </h1>

                    <p className={`text-[8px] leading-relaxed line-clamp-2 ${
                      overlayType === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {subtitle || 'Short description tags...'}
                    </p>

                    <div className="flex gap-1.5 pt-1">
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-[7px] font-bold rounded">
                        {btn1Text || 'Button'}
                      </span>
                      <span className={`px-2 py-0.5 text-[7px] font-bold rounded border ${
                        overlayType === 'dark' ? 'text-white border-white/30' : 'text-slate-600 border-slate-300'
                      }`}>
                        Contact
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicators Mockup */}
                <div className="absolute bottom-2 right-4 flex gap-1 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className={`w-1.5 h-1.5 rounded-full ${overlayType === 'dark' ? 'bg-white/40' : 'bg-slate-300'}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${overlayType === 'dark' ? 'bg-white/40' : 'bg-slate-300'}`} />
                </div>
              </div>
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
              <span>Saving Slideshow Config...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Hero Content</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
