/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Palette, 
  Image, 
  ShoppingBag, 
  Truck, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  ArrowUpRight,
  RefreshCw,
  PackageCheck,
  Calendar,
  MessageSquare,
  Globe,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Lead } from '../types';

interface Shipment {
  id: string;
  orderId: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: 'In Transit' | 'Out for Delivery' | 'Exception / Delay' | 'Delivered' | 'Pending Label';
  milestone: number; // 0: Label Created, 1: Picked Up, 2: Sorting, 3: In Transit, 4: Out for Delivery, 5: Delivered
  lastUpdate: string;
  weight: string;
  dimensions: string;
  recipient: string;
  address: string;
  shippingMethod: string;
  createdDate: string;
}

interface OverviewSectionProps {
  productsCount: number;
  leadsCount: number; // fallback count
  setActiveTab: (tab: string) => void;
  userEmail: string | null;
}

const DEFAULT_SHIPMENTS: Shipment[] = [
  {
    id: "SH-10482",
    orderId: "#10482",
    destination: "Mumbai, IN",
    carrier: "FedEx",
    trackingNumber: "773921849120",
    status: "In Transit",
    milestone: 3,
    lastUpdate: "Dispatched from warehouse. Vessel departure scheduled from Nhava Sheva Port, Mumbai.",
    weight: "12.5 Tons",
    dimensions: "20ft Flat Rack Container",
    recipient: "Ananta Infrastructure Private Limited",
    address: "Sector 5, Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076",
    shippingMethod: "Heavy Cargo Marine & Ground Freight",
    createdDate: "2026-07-14"
  },
  {
    id: "SH-10481",
    orderId: "#10481",
    destination: "Bangalore, IN",
    carrier: "DHL",
    trackingNumber: "JD0146382012",
    status: "Out for Delivery",
    milestone: 4,
    lastUpdate: "With delivery courier, Whitefield Industrial Hub, Bangalore.",
    weight: "4.8 Tons",
    dimensions: "400x240x180 cm Crates",
    recipient: "Larsen & Toubro (L&T) Construction",
    address: "Plot No. 12, KIADB Industrial Area, Whitefield, Bangalore, Karnataka 560066",
    shippingMethod: "DHL Express Heavy Surface Freight",
    createdDate: "2026-07-14"
  }
];

export default function OverviewSection({
  productsCount,
  leadsCount: fallbackLeadsCount,
  setActiveTab,
  userEmail
}: OverviewSectionProps) {
  const adminName = userEmail ? userEmail.split('@')[0] : 'Admin';

  // Real-time State
  const [realtimeLeads, setRealtimeLeads] = useState<Lead[]>([]);
  const [realtimeShipments, setRealtimeShipments] = useState<Shipment[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [systemSyncing, setSystemSyncing] = useState(false);

  // Quick Tracker Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedShipment, setSearchedShipment] = useState<Shipment | null>(null);
  const [searchError, setSearchError] = useState('');

  // Subscribe to real-time leads
  useEffect(() => {
    setSystemSyncing(true);
    const leadsCollection = collection(db, 'chatbot_leads');
    const unsubscribe = onSnapshot(leadsCollection, (snapshot) => {
      const items: Lead[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || 'Anonymous User',
          email: data.email,
          phone: data.phone,
          timestamp: data.timestamp || new Date().toISOString(),
          status: data.status || 'New'
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRealtimeLeads(items);
      setLoadingLeads(false);
      setSystemSyncing(false);
    }, (error) => {
      console.error("Real-time leads listener failed:", error);
      setLoadingLeads(false);
      setSystemSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time shipments
  useEffect(() => {
    setSystemSyncing(true);
    const configDocRef = doc(db, 'siteConfig', 'logistics');
    const unsubscribe = onSnapshot(configDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRealtimeShipments(data.shipments || DEFAULT_SHIPMENTS);
      } else {
        setRealtimeShipments(DEFAULT_SHIPMENTS);
      }
      setLoadingShipments(false);
      setSystemSyncing(false);
    }, (error) => {
      console.error("Real-time logistics listener failed:", error);
      setRealtimeShipments(DEFAULT_SHIPMENTS);
      setLoadingShipments(false);
      setSystemSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Search state if the queried shipment gets updated live
  useEffect(() => {
    if (searchedShipment) {
      const updated = realtimeShipments.find(s => s.id === searchedShipment.id || s.orderId === searchedShipment.orderId || s.trackingNumber === searchedShipment.trackingNumber);
      if (updated) {
        setSearchedShipment(updated);
      }
    }
  }, [realtimeShipments]);

  // Analytics Computations
  const leadsStats = useMemo(() => {
    const total = realtimeLeads.length;
    const newLeads = realtimeLeads.filter(l => l.status === 'New' || !l.status).length;
    const closed = realtimeLeads.filter(l => l.status === 'Closed').length;
    const inProgress = realtimeLeads.filter(l => l.status === 'In Progress' || l.status === 'Contacted').length;
    const conversionRate = total > 0 ? Math.round(((inProgress + closed) / total) * 100) : 0;
    return { total, newLeads, closed, inProgress, conversionRate };
  }, [realtimeLeads]);

  const shipmentStats = useMemo(() => {
    const total = realtimeShipments.length;
    const active = realtimeShipments.filter(s => s.status !== 'Delivered').length;
    const delivered = realtimeShipments.filter(s => s.status === 'Delivered').length;
    const exceptions = realtimeShipments.filter(s => s.status === 'Exception / Delay').length;
    return { total, active, delivered, exceptions };
  }, [realtimeShipments]);

  // Handle local tracker search
  const handleTrackerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchedShipment(null);

    if (!searchQuery.trim()) {
      setSearchError('Please enter a tracking code or Order ID.');
      return;
    }

    const cleanQuery = searchQuery.trim().toLowerCase();
    const found = realtimeShipments.find(s => 
      s.id.toLowerCase() === cleanQuery ||
      s.orderId.toLowerCase() === cleanQuery ||
      s.orderId.toLowerCase() === `#${cleanQuery}` ||
      s.trackingNumber.toLowerCase() === cleanQuery
    );

    if (found) {
      setSearchedShipment(found);
    } else {
      setSearchError('No matching active shipment found in our system.');
    }
  };

  const getMilestoneLabel = (milestone: number) => {
    const labels = [
      'Label Created',
      'Picked Up',
      'Sorting Hub',
      'In Transit',
      'Out for Delivery',
      'Delivered'
    ];
    return labels[milestone] || 'Unknown';
  };

  const quickActions = [
    {
      title: 'Edit Theme',
      desc: 'Customize colors & typography',
      tab: 'theme-section',
      icon: Palette,
      bgColor: 'bg-violet-500',
      glowColor: 'shadow-violet-500/10 hover:bg-violet-600'
    },
    {
      title: 'Manage Logistics',
      desc: 'Update shipments & couriers',
      tab: 'logistics-section',
      icon: Truck,
      bgColor: 'bg-emerald-500',
      glowColor: 'shadow-emerald-500/10 hover:bg-emerald-600'
    },
    {
      title: 'Manage Products',
      desc: 'Update stonework list',
      tab: 'products-section',
      icon: ShoppingBag,
      bgColor: 'bg-rose-500',
      glowColor: 'shadow-rose-500/10 hover:bg-rose-600'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Real-time Status Sync Notification Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 p-4 md:px-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white dark:border-slate-800" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Live System Connection</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Active Firestore WebSocket Stream</span>
              {systemSyncing && <RefreshCw className="w-3 h-3 text-violet-500 animate-spin" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 border border-slate-100 dark:border-slate-800 rounded-lg">
            <Users className="w-4 h-4 text-violet-500" />
            <span>Chat Streams: <strong className="text-slate-700 dark:text-white">{leadsStats.total}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 border border-slate-100 dark:border-slate-800 rounded-lg">
            <Truck className="w-4 h-4 text-emerald-500" />
            <span>Active Dispatches: <strong className="text-slate-700 dark:text-white">{shipmentStats.active}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custom Modern Banner */}
          <div className="relative bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 rounded-3xl p-8 md:p-10 text-white overflow-hidden shadow-lg shadow-violet-600/10">
            <div className="relative z-10 max-w-lg space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Live Control Suite
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Real-time Stonex Operator Center
              </h2>
              <p className="text-violet-100 text-sm md:text-base leading-relaxed">
                Your console automatically reflects inbound buyer inquiries, web metrics, and dispatch operations instantly as they occur on the public interface.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('logistics-section')}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-violet-700 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Logistics Hub</span>
                </button>
                <button
                  onClick={() => setActiveTab('leads-section')}
                  className="px-5 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white font-bold rounded-xl text-xs border border-white/10 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Chat Leads</span>
                </button>
              </div>
            </div>
            {/* Ambient Background Graphics */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-15 select-none pointer-events-none text-[12rem] leading-none">
              📦
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-6 rounded-2xl shadow-sm hover:border-violet-100 dark:hover:border-violet-900/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total leads</span>
                <span className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                  {leadsStats.newLeads ? `+${leadsStats.newLeads}` : 'Live'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {loadingLeads ? '...' : leadsStats.total}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                Inbound requests captured via web chatbots
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-6 rounded-2xl shadow-sm hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dispatches</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {shipmentStats.active}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {loadingShipments ? '...' : shipmentStats.total}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                  {shipmentStats.delivered} Delivered
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                Real-time tracking profiles registered
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-6 rounded-2xl shadow-sm hover:border-rose-100 dark:hover:border-rose-900/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Conversion</span>
                <span className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                  %
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {leadsStats.conversionRate}%
                </span>
                <span className="text-[10px] text-violet-600 font-bold">
                  Progressive
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                Ratio of pursued or contacted clients
              </p>
            </div>
          </div>

          {/* Interactive Core: Quick Live Tracker Lookup */}
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Quick Live Tracker Lookup</h3>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-150 dark:border-slate-800">
                Interactive Check
              </span>
            </div>

            <form onSubmit={handleTrackerSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. #10482) or Tracking Number (e.g. 773921849120)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl outline-none font-medium text-xs text-slate-800 dark:text-white transition-all focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs transition-all active:scale-[0.98] shadow-sm cursor-pointer shrink-0"
              >
                Track Live
              </button>
            </form>

            {searchError && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{searchError}</span>
              </p>
            )}

            {searchedShipment ? (
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mt-2 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white">{searchedShipment.orderId}</span>
                      <span className="text-[10px] bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold px-2 py-0.5 rounded-md">
                        {searchedShipment.carrier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      Recipient: <strong>{searchedShipment.recipient}</strong> • Dest: <strong>{searchedShipment.destination}</strong>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      searchedShipment.status === 'Delivered' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                        : searchedShipment.status === 'Exception / Delay'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                        : 'bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400'
                    }`}>
                      ● {searchedShipment.status}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">
                      Tracking: {searchedShipment.trackingNumber}
                    </p>
                  </div>
                </div>

                {/* Progress Visualizer Bar */}
                <div className="space-y-3">
                  <div className="relative pt-2">
                    {/* Background track line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full" />
                    {/* Active highlight line */}
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-violet-600 -translate-y-1/2 rounded-full transition-all duration-500" 
                      style={{ width: `${(searchedShipment.milestone / 5) * 100}%` }}
                    />
                    
                    {/* Stepper circles */}
                    <div className="relative flex justify-between">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const isActive = index <= searchedShipment.milestone;
                        const isCurrent = index === searchedShipment.milestone;
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div 
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold transition-all duration-300 ${
                                isCurrent 
                                  ? 'bg-violet-600 text-white ring-4 ring-violet-500/20 scale-110' 
                                  : isActive 
                                  ? 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 border-2 border-violet-600' 
                                  : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {index === 5 ? '✓' : index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-1">
                    <span>Label Created</span>
                    <span className="hidden sm:inline">Sorting Hub</span>
                    <span>In Transit</span>
                    <span>Delivered</span>
                  </div>
                </div>

                {/* Live Status Description box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-3 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-white">
                      {getMilestoneLabel(searchedShipment.milestone)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {searchedShipment.lastUpdate || "No status update recorded yet."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Search for any shipment or dispatch profile above.</p>
                <p className="text-[10px] opacity-75 mt-0.5">Supports real-time state synchronization.</p>
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Quick Console Routing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(action.tab)}
                    className="group bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 hover:border-violet-500/20 p-5 rounded-2xl flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-all text-left duration-200 cursor-pointer w-full"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${action.bgColor} shadow-lg ${action.glowColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white group-hover:text-violet-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
                        {action.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-time Side Panels */}
        <div className="space-y-8">
          {/* Admin User Profile Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-3xl overflow-hidden shadow-sm text-center pb-6">
            <div className="h-20 bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950/20 dark:to-indigo-950/20 relative" />
            <div className="flex justify-center -mt-8">
              <img
                src={`https://ui-avatars.com/api/?name=${adminName}&background=7854f7&color=fff&bold=true`}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 bg-white shadow-md"
              />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-white mt-3 capitalize">
              {adminName}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">
              Operator Account
            </p>
            <div className="flex justify-center gap-1.5 mt-3">
              <span className="text-[9px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                Level: Admin
              </span>
              <span className="text-[9px] bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                <span>Online</span>
              </span>
            </div>
          </div>

          {/* Real-time Milestone Status Distribution Panel */}
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Milestone Dist</h4>
              </div>
              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full font-bold">
                Live Stats
              </span>
            </div>

            {/* Custom Interactive SVG/Pure CSS bar chart representing Real-time Shipments state */}
            <div className="space-y-3.5 pt-2">
              {[
                { label: 'Label Created', count: realtimeShipments.filter(s => s.milestone === 0).length, color: 'bg-slate-300 dark:bg-slate-700' },
                { label: 'Picked Up', count: realtimeShipments.filter(s => s.milestone === 1).length, color: 'bg-indigo-300 dark:bg-indigo-900/50' },
                { label: 'Sorting Hub', count: realtimeShipments.filter(s => s.milestone === 2).length, color: 'bg-sky-400 dark:bg-sky-900/50' },
                { label: 'In Transit', count: realtimeShipments.filter(s => s.milestone === 3).length, color: 'bg-violet-500' },
                { label: 'Out for Delivery', count: realtimeShipments.filter(s => s.milestone === 4).length, color: 'bg-amber-500' },
                { label: 'Delivered', count: realtimeShipments.filter(s => s.milestone === 5).length, color: 'bg-emerald-500' }
              ].map((milestone, idx) => {
                const maxVal = Math.max(...[0, 1, 2, 3, 4, 5].map(m => realtimeShipments.filter(s => s.milestone === m).length), 1);
                const percent = Math.round((milestone.count / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1 group">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                        {idx + 1}. {milestone.label}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {milestone.count}
                      </span>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100/50 dark:border-slate-800 rounded-md h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${milestone.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Inquiries & Dispatches Ticker */}
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Live Inbound Stream</h4>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600" />
              </span>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {loadingLeads ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-5 h-5 mx-auto text-slate-300 animate-spin" />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">Streaming inbox...</p>
                </div>
              ) : realtimeLeads.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-[10px] font-semibold">No chatbot inquiries captured yet.</p>
                </div>
              ) : (
                realtimeLeads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl space-y-1.5 hover:border-violet-100 dark:hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-slate-800 dark:text-white max-w-[120px] truncate">{lead.name}</span>
                      <span className={`px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                        lead.status === 'New' 
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' 
                          : lead.status === 'Closed' 
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {lead.status || 'New'}
                      </span>
                    </div>
                    {lead.email && (
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">
                        Mail: <strong>{lead.email}</strong>
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[8px] text-slate-400 dark:text-slate-500 pt-0.5">
                      <span className="font-mono">Inquiry Channel</span>
                      <span>{new Date(lead.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
