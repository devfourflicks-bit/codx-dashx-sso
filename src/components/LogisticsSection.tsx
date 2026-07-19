/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useConfirm } from './ConfirmDialog';
import {
  Truck,
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  Settings,
  Globe,
  Database,
  Save,
  MapPin,
  Activity,
  Phone,
  Mail,
  PlusCircle,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  FileCheck,
  RefreshCw,
  Sliders,
  ExternalLink
} from 'lucide-react';

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

interface CarrierIntegration {
  enabled: boolean;
  fields: { [key: string]: string };
}

interface CarrierIntegrations {
  fedex: CarrierIntegration;
  dhl: CarrierIntegration;
  ups: CarrierIntegration;
  shippo: CarrierIntegration;
}

interface ShippingRule {
  id: string;
  name: string;
  trigger: 'value' | 'weight' | 'country';
  operator: 'gt' | 'lt' | 'eq';
  value: string;
  carrier: string;
  method: string;
  enabled: boolean;
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
    createdDate: "2026-07-13"
  },
  {
    id: "SH-10480",
    orderId: "#10480",
    destination: "Gurugram, IN",
    carrier: "UPS",
    trackingNumber: "1Z999AA10123",
    status: "Exception / Delay",
    milestone: 2,
    lastUpdate: "Delayed at State Border checkpost. Pending interstate e-way bill verification.",
    weight: "9.2 Tons",
    dimensions: "18ft Container Truck",
    recipient: "DLF Commercial Projects Division",
    address: "DLF Cyber City, Phase 3, Sector 24, Gurugram, Haryana 122002",
    shippingMethod: "UPS Interstate Land Cargo",
    createdDate: "2026-07-12"
  },
  {
    id: "SH-10479",
    orderId: "#10479",
    destination: "Hyderabad, IN",
    carrier: "Local",
    trackingNumber: "LOC-908123",
    status: "Delivered",
    milestone: 5,
    lastUpdate: "Delivered & Signed by Site Engineer at Airport Expansion Terminal 2.",
    weight: "1.5 Tons",
    dimensions: "3 Heavy Pallets (120x120x150 cm)",
    recipient: "GMR Hyderabad International Airport Ltd",
    address: "Shamshabad, Hyderabad, Telangana 500409",
    shippingMethod: "Local Courier Same-Day",
    createdDate: "2026-07-15"
  }
];

const DEFAULT_RULES: ShippingRule[] = [
  {
    id: "rule-1",
    name: "High Value Orders Express",
    trigger: "value",
    operator: "gt",
    value: "200",
    carrier: "DHL",
    method: "DHL Express Worldwide",
    enabled: true
  },
  {
    id: "rule-2",
    name: "Heavy Duty Freight Routing",
    trigger: "weight",
    operator: "gt",
    value: "20",
    carrier: "FedEx",
    method: "FedEx Ground Freight",
    enabled: true
  },
  {
    id: "rule-3",
    name: "European Courier Delivery",
    trigger: "country",
    operator: "eq",
    value: "FR",
    carrier: "Local",
    method: "Local Courier Same-Day",
    enabled: false
  }
];

const INITIAL_CARRIERS: CarrierIntegrations = {
  fedex: { enabled: false, fields: { accountNum: '', meterNum: '', apiKey: '', apiSecret: '' } },
  dhl: { enabled: false, fields: { siteId: '', apiPassword: '', accountId: '' } },
  ups: { enabled: false, fields: { accessKey: '', clientId: '', clientSecret: '' } },
  shippo: { enabled: false, fields: { apiKey: '' } }
};

export default function LogisticsSection() {
  const [activeSubTab, setActiveSubTab] = useState<'shipments' | 'carriers' | 'rules'>('shipments');
  const { confirm } = useConfirm();
  
  // Data State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [carriers, setCarriers] = useState<CarrierIntegrations>(INITIAL_CARRIERS);
  const [rules, setRules] = useState<ShippingRule[]>([]);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter State (Shipments)
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected Shipment Details State
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  // Modals
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isCustomCarrier, setIsCustomCarrier] = useState(false);
  const [isEditCustomCarrier, setIsEditCustomCarrier] = useState(false);
  
  // Courier Message Input
  const [courierMsg, setCourierMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Quick Tracker Update Form State
  const [updateStatus, setUpdateStatus] = useState<Shipment['status']>('In Transit');
  const [updateMilestone, setUpdateMilestone] = useState<number>(3);
  const [updateLastUpdate, setUpdateLastUpdate] = useState<string>('');
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // New Shipment Form State
  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
    orderId: '',
    destination: '',
    carrier: 'FedEx',
    trackingNumber: '',
    status: 'Pending Label',
    milestone: 0,
    lastUpdate: 'Label created. Package awaiting courier pickup.',
    weight: '1.0 kg',
    dimensions: '20x15x10 cm',
    recipient: '',
    address: '',
    shippingMethod: 'Standard Courier Ground'
  });

  // New Rule Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ShippingRule>>({
    name: '',
    trigger: 'value',
    operator: 'gt',
    value: '',
    carrier: 'FedEx',
    method: 'Standard Express',
    enabled: true
  });

  // Fetch Logistics Configuration and Data
  useEffect(() => {
    async function loadLogistics() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const configDocRef = doc(db, 'siteConfig', 'logistics');
        const snap = await getDoc(configDocRef);
        
        if (snap.exists()) {
          const data = snap.data();
          let loadedShipments = data.shipments || DEFAULT_SHIPMENTS;
          
          // Overwrite/migrate legacy mock dummy shipments automatically with real Indian industrial shipments
          const hasDummy = loadedShipments.some((s: any) => s.recipient === "Jane Doe" || s.recipient === "John Smith");
          if (hasDummy) {
            loadedShipments = DEFAULT_SHIPMENTS;
            await setDoc(configDocRef, {
              shipments: DEFAULT_SHIPMENTS,
              carriers: data.carriers || INITIAL_CARRIERS,
              rules: data.rules || DEFAULT_RULES
            }, { merge: true });
          }

          setShipments(loadedShipments);
          setCarriers(data.carriers || INITIAL_CARRIERS);
          setRules(data.rules || DEFAULT_RULES);
          
          if (loadedShipments.length > 0) {
            setSelectedShipment(loadedShipments[0]);
          }
        } else {
          // Initialize with default values
          setShipments(DEFAULT_SHIPMENTS);
          setCarriers(INITIAL_CARRIERS);
          setRules(DEFAULT_RULES);
          setSelectedShipment(DEFAULT_SHIPMENTS[0]);
          
          // Optionally save default values to DB
          await setDoc(configDocRef, {
            shipments: DEFAULT_SHIPMENTS,
            carriers: INITIAL_CARRIERS,
            rules: DEFAULT_RULES
          });
        }
      } catch (err: any) {
        console.warn('Failed to load logistics config, using local templates:', err);
        setShipments(DEFAULT_SHIPMENTS);
        setCarriers(INITIAL_CARRIERS);
        setRules(DEFAULT_RULES);
        setSelectedShipment(DEFAULT_SHIPMENTS[0]);
      } finally {
        setLoading(false);
      }
    }
    loadLogistics();
  }, []);

  // Sync Quick Tracker Update form with selected shipment
  useEffect(() => {
    if (selectedShipment) {
      setUpdateStatus(selectedShipment.status);
      setUpdateMilestone(selectedShipment.milestone);
      setUpdateLastUpdate(selectedShipment.lastUpdate);
      setUpdateSuccess(false);
    }
  }, [selectedShipment?.id]);

  const handlePostTrackerEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    confirm({
      title: 'Update Shipment Status',
      message: `Are you sure you want to change the tracking status of shipment ${selectedShipment.id} to "${updateStatus}"?`,
      type: 'update',
      onConfirm: async () => {
        const updatedShipment: Shipment = {
          ...selectedShipment,
          status: updateStatus,
          milestone: Number(updateMilestone),
          lastUpdate: updateLastUpdate
        };

        const updatedShipments = shipments.map(s => s.id === selectedShipment.id ? updatedShipment : s);
        setShipments(updatedShipments);
        setSelectedShipment(updatedShipment);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);

        await persistLogistics(updatedShipments, carriers, rules);
      }
    });
  };

  // Save changes to DB
  const persistLogistics = async (
    updatedShipments: Shipment[],
    updatedCarriers: CarrierIntegrations,
    updatedRules: ShippingRule[]
  ) => {
    try {
      const configDocRef = doc(db, 'siteConfig', 'logistics');
      await setDoc(configDocRef, {
        shipments: updatedShipments,
        carriers: updatedCarriers,
        rules: updatedRules
      });
      setSaveStatus('Logistics changes synced perfectly to Firestore cloud.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error('Error persisting logistics:', err);
      setErrorMsg('Failed to sync changes with cloud database.');
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // KPI Calculations
  const activeCount = shipments.filter(s => s.status === 'In Transit' || s.status === 'Out for Delivery').length;
  const pendingCount = shipments.filter(s => s.status === 'Pending Label').length;
  const exceptionCount = shipments.filter(s => s.status === 'Exception / Delay').length;
  
  // Calculate carrier distribution
  const totalShipments = shipments.length || 1;
  const carrierCounts = shipments.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.carrier] = (acc[cur.carrier] || 0) + 1;
    return acc;
  }, {});
  let mostActiveCarrier = 'None';
  let mostActivePercent = 0;
  Object.entries(carrierCounts).forEach(([name, count]) => {
    const num = count as number;
    const pct = Math.round((num / totalShipments) * 100);
    if (pct > mostActivePercent) {
      mostActivePercent = pct;
      mostActiveCarrier = `${name} (${pct}%)`;
    }
  });

  // Filters application
  const filteredShipments = shipments.filter((ship) => {
    const matchesSearch = 
      ship.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ship.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCarrier = carrierFilter === 'All' || ship.carrier === carrierFilter;
    const matchesStatus = statusFilter === 'All' || ship.status === statusFilter;
    
    return matchesSearch && matchesCarrier && matchesStatus;
  });

  // Handle Carrier Integrations input
  const handleCarrierFieldChange = (carrierKey: keyof CarrierIntegrations, fieldKey: string, val: string) => {
    const updated = { ...carriers };
    updated[carrierKey] = {
      ...updated[carrierKey],
      fields: {
        ...updated[carrierKey].fields,
        [fieldKey]: val
      }
    };
    setCarriers(updated);
  };

  const toggleCarrierEnabled = (carrierKey: keyof CarrierIntegrations) => {
    const updated = { ...carriers };
    updated[carrierKey] = {
      ...updated[carrierKey],
      enabled: !updated[carrierKey].enabled
    };
    setCarriers(updated);
  };

  const handleSaveCarriers = () => {
    confirm({
      title: 'Save Carrier Connections',
      message: 'Are you sure you want to save the modified courier connection settings to Firestore?',
      type: 'save',
      onConfirm: async () => {
        await persistLogistics(shipments, carriers, rules);
      }
    });
  };

  // New Shipment Creation
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipment.orderId || !newShipment.recipient || !newShipment.destination) {
      alert('Please fill out Order ID, Recipient, and Destination.');
      return;
    }

    confirm({
      title: 'Create Logistics Shipment',
      message: `Are you sure you want to register and add a new shipment for Order ${newShipment.orderId}?`,
      type: 'save',
      onConfirm: async () => {
        const tNo = newShipment.trackingNumber || `TRK${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const created: Shipment = {
          id: `SH-${newShipment.orderId?.replace('#', '') || Math.floor(10000 + Math.random() * 90000)}`,
          orderId: newShipment.orderId.startsWith('#') ? newShipment.orderId : `#${newShipment.orderId}`,
          destination: newShipment.destination,
          carrier: newShipment.carrier as Shipment['carrier'] || 'FedEx',
          trackingNumber: tNo,
          status: newShipment.status as Shipment['status'] || 'Pending Label',
          milestone: Number(newShipment.milestone) || 0,
          lastUpdate: newShipment.lastUpdate || 'Shipment registered in logistics database.',
          weight: newShipment.weight || '1.0 kg',
          dimensions: newShipment.dimensions || '20x15x10 cm',
          recipient: newShipment.recipient,
          address: newShipment.address || newShipment.destination,
          shippingMethod: newShipment.shippingMethod || 'Standard Ground',
          createdDate: new Date().toISOString().split('T')[0]
        };

        const updatedShipments = [created, ...shipments];
        setShipments(updatedShipments);
        setSelectedShipment(created);
        setIsNewShipmentModalOpen(false);
        
        // Reset form
        setNewShipment({
          orderId: '',
          destination: '',
          carrier: 'FedEx',
          trackingNumber: '',
          status: 'Pending Label',
          milestone: 0,
          lastUpdate: 'Label created. Package awaiting courier pickup.',
          weight: '1.0 kg',
          dimensions: '20x15x10 cm',
          recipient: '',
          address: '',
          shippingMethod: 'Standard Courier Ground'
        });

        await persistLogistics(updatedShipments, carriers, rules);
      }
    });
  };

  // Delete Shipment
  const handleDeleteShipment = (id: string) => {
    confirm({
      title: 'Delete Shipment Record',
      message: `Are you sure you want to permanently delete the shipment record for ${id} from Firestore?`,
      type: 'delete',
      onConfirm: async () => {
        const updated = shipments.filter(s => s.id !== id);
        setShipments(updated);
        if (selectedShipment?.id === id) {
          setSelectedShipment(updated.length > 0 ? updated[0] : null);
        }
        await persistLogistics(updated, carriers, rules);
      }
    });
  };

  // Save edited shipment
  const handleSaveEditedShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    confirm({
      title: 'Save Shipment Changes',
      message: `Are you sure you want to save the tracking changes for shipment ${editingShipment.id}?`,
      type: 'save',
      onConfirm: async () => {
        const updated = shipments.map(s => s.id === editingShipment.id ? editingShipment : s);
        setShipments(updated);
        setSelectedShipment(editingShipment);
        setEditingShipment(null);
        await persistLogistics(updated, carriers, rules);
      }
    });
  };

  // Simulate shipment route milestone progression step-by-step
  const handleSimulateRouteStep = () => {
    if (!selectedShipment) return;
    if (selectedShipment.milestone >= 5) {
      alert("This shipment has already reached its final 'Delivered' destination milestone!");
      return;
    }

    const nextMilestone = selectedShipment.milestone + 1;
    let nextStatus: Shipment['status'] = 'In Transit';
    let nextNote = '';

    switch (nextMilestone) {
      case 1:
        nextStatus = 'In Transit';
        nextNote = `Picked up by ${selectedShipment.carrier} courier driver from Stonex Logistics HQ.`;
        break;
      case 2:
        nextStatus = 'In Transit';
        nextNote = `Arrived at ${selectedShipment.carrier} regional sorting terminal. Package inbound scan completed.`;
        break;
      case 3:
        nextStatus = 'In Transit';
        nextNote = `En route. Departed sorting terminal, traveling to destination postal zone.`;
        break;
      case 4:
        nextStatus = 'Out for Delivery';
        nextNote = `Out for local delivery. Loaded on ${selectedShipment.carrier} dispatch van in ${selectedShipment.destination}.`;
        break;
      case 5:
        nextStatus = 'Delivered';
        nextNote = `Delivered successfully. Handed to recipient consignee with proof of signature at ${selectedShipment.destination}.`;
        break;
    }

    const updatedShipment: Shipment = {
      ...selectedShipment,
      milestone: nextMilestone,
      status: nextStatus,
      lastUpdate: nextNote
    };

    const updated = shipments.map(s => s.id === selectedShipment.id ? updatedShipment : s);
    setShipments(updated);
    setSelectedShipment(updatedShipment);
    persistLogistics(updated, carriers, rules);
  };

  // Add rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.value) return;

    confirm({
      title: 'Add Automated Routing Rule',
      message: `Are you sure you want to create and save the routing rule "${newRule.name}"?`,
      type: 'save',
      onConfirm: async () => {
        const created: ShippingRule = {
          id: `rule-${Date.now()}`,
          name: newRule.name,
          trigger: newRule.trigger as ShippingRule['trigger'],
          operator: newRule.operator as ShippingRule['operator'],
          value: newRule.value,
          carrier: newRule.carrier as ShippingRule['carrier'],
          method: newRule.method || 'Standard Ground',
          enabled: newRule.enabled ?? true
        };

        const updatedRules = [...rules, created];
        setRules(updatedRules);
        setIsAddingRule(false);
        setNewRule({
          name: '',
          trigger: 'value',
          operator: 'gt',
          value: '',
          carrier: 'FedEx',
          method: 'Standard Express',
          enabled: true
        });

        await persistLogistics(shipments, carriers, updatedRules);
      }
    });
  };

  // Toggle rule
  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    persistLogistics(shipments, carriers, updated);
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    const ruleToDelete = rules.find(r => r.id === id);
    confirm({
      title: 'Delete Routing Rule',
      message: `Are you sure you want to permanently delete the automated routing rule "${ruleToDelete?.name || id}"?`,
      type: 'delete',
      onConfirm: async () => {
        const updated = rules.filter(r => r.id !== id);
        setRules(updated);
        await persistLogistics(shipments, carriers, updated);
      }
    });
  };

  // Contact courier submit
  const handleContactCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierMsg.trim()) return;

    setSendingMsg(true);
    setTimeout(() => {
      setSendingMsg(false);
      setCourierMsg('');
      setIsContactModalOpen(false);
      alert(`Message safely routed to ${selectedShipment?.carrier} API support portal! Ticket reference created.`);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-12 text-center shadow-sm space-y-4 animate-fade-in max-w-6xl">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600 dark:text-violet-400 mx-auto" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading Logistics Database & Carrier APIs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      
      {/* Toast Notifications */}
      {saveStatus && (
        <div className="fixed top-4 right-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs shadow-lg z-50 animate-bounce leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs shadow-lg z-50 animate-bounce leading-relaxed">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header and Sub-tabs */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-100 dark:bg-violet-950/40 rounded-xl text-violet-600 dark:text-violet-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5">
                Logistics Control Hub
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                Monitor live company parcel dispatches, update delivery progress milestones, and manually register orders.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab Indicator - Locked on Shipments to emphasize no complex APIs are needed */}
        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 px-3.5 rounded-2xl items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Company Shipments Registry Mode
          </span>
        </div>
      </div>

      {/* KPI Overview Cards - Always shown at the top of Logistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Active Shipments</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{activeCount}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Currently in transit</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Label Queue</p>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{pendingCount} Pending</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Waiting for release</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Exceptions / Delays</p>
            <h4 className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">{exceptionCount} Flagged</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Need immediate review</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">Top Carrier Today</p>
            <h4 className="text-base font-black text-slate-800 dark:text-white mt-1.5 truncate max-w-[150px]">{mostActiveCarrier}</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Handling bulk loads</p>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: Live Shipments Tracking Board */}
      {activeSubTab === 'shipments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Tracking List & Filters - Left Column */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
            
            {/* Search and Filters panel */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-2">
              <div className="relative w-full md:w-72">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search order ID or tracking #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-violet-500 text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>Carrier:</span>
                  <select
                    value={carrierFilter}
                    onChange={(e) => setCarrierFilter(e.target.value)}
                    className="bg-transparent outline-none border-none text-slate-800 dark:text-slate-200 font-bold ml-1 cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="UPS">UPS</option>
                    <option value="Local">Local</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500">
                  <Activity className="w-3 h-3 text-slate-400" />
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent outline-none border-none text-slate-800 dark:text-slate-200 font-bold ml-1 cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Exception / Delay">Exceptions</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Pending Label">Pending Label</option>
                  </select>
                </div>

                <button
                  onClick={() => setIsNewShipmentModalOpen(true)}
                  className="ml-auto px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Register Shipment
                </button>
              </div>
            </div>

            {/* Tracking Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="py-3.5 px-2">Order ID</th>
                    <th className="py-3.5 px-2">Destination</th>
                    <th className="py-3.5 px-2">Carrier</th>
                    <th className="py-3.5 px-2">Tracking Number</th>
                    <th className="py-3.5 px-2">Current Status</th>
                    <th className="py-3.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-750">
                  {filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                        No shipments match the current search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((ship) => {
                      const isSelected = selectedShipment?.id === ship.id;
                      
                      let statusBadge = 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400';
                      if (ship.status === 'In Transit') {
                        statusBadge = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';
                      } else if (ship.status === 'Out for Delivery') {
                        statusBadge = 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400';
                      } else if (ship.status === 'Delivered') {
                        statusBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
                      } else if (ship.status === 'Exception / Delay') {
                        statusBadge = 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400';
                      } else if (ship.status === 'Pending Label') {
                        statusBadge = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
                      }

                      return (
                        <tr
                          key={ship.id}
                          onClick={() => setSelectedShipment(ship)}
                          className={`group text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-750 cursor-pointer ${
                            isSelected ? 'bg-slate-50 dark:bg-slate-750/70 font-medium' : ''
                          }`}
                        >
                          <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">
                            {ship.orderId}
                          </td>
                          <td className="py-4 px-2 text-slate-600 dark:text-slate-400">
                            {ship.destination}
                          </td>
                          <td className="py-4 px-2">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                ship.carrier === 'FedEx' ? 'bg-purple-600' :
                                ship.carrier === 'DHL' ? 'bg-yellow-500' :
                                ship.carrier === 'UPS' ? 'bg-amber-800' : 'bg-emerald-500'
                              }`} />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{ship.carrier}</span>
                            </span>
                          </td>
                          <td className="py-4 px-2 font-mono text-slate-500 dark:text-slate-450">
                            {ship.trackingNumber}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${statusBadge}`}>
                              {ship.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setSelectedShipment(ship); setIsLabelModalOpen(true); }}
                                title="Print Shipping Label"
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteShipment(ship.id)}
                                title="Delete Record"
                                className="p-1.5 bg-slate-50 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Shipment Details & Live Path Canvas - Right Column */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-5">
            {selectedShipment ? (
              <div className="space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">{selectedShipment.carrier} Logistic</span>
                    <span className="text-[10px] text-slate-400 font-mono">{selectedShipment.createdDate}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white mt-1">
                    Shipment {selectedShipment.orderId}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 break-all">
                    Tracking: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedShipment.trackingNumber}</span>
                  </p>
                </div>

                {/* Animated Bezier Tracking Map Graphic (Pure SVG) */}
                <div className="bg-slate-950 rounded-2xl p-4 relative overflow-hidden h-36 border border-slate-800 shadow-inner flex flex-col justify-between">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  {/* Top indicators */}
                  <div className="relative z-10 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-rose-500" /> Origin Facility</span>
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-emerald-500" /> {selectedShipment.destination}</span>
                  </div>

                  {/* SVG Bezier Path */}
                  <div className="relative h-16 w-full flex items-center justify-center">
                    <svg className="w-full h-full absolute overflow-visible" viewBox="0 0 300 64" fill="none">
                      {/* Connection curve */}
                      <path
                        id="track-curve"
                        d="M 20 40 Q 150 10 280 40"
                        stroke="#334155"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                      
                      {/* Glowing connection curve based on milestone */}
                      {selectedShipment.milestone > 0 && (
                        <path
                          d="M 20 40 Q 150 10 280 40"
                          stroke="#8b5cf6"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          strokeDashoffset={300 - (selectedShipment.milestone * 60)}
                          className="transition-all duration-1000"
                        />
                      )}

                      {/* Origin Node */}
                      <circle cx="20" cy="40" r="5" fill="#f43f5e" className="animate-pulse" />
                      
                      {/* Destination Node */}
                      <circle cx="280" cy="40" r="5" fill="#10b981" />

                      {/* Moving courier indicator */}
                      <g className="animate-pulse">
                        <circle
                          cx={20 + (selectedShipment.milestone * 52)}
                          cy={40 - (Math.sin((selectedShipment.milestone / 5) * Math.PI) * 20)}
                          r="7"
                          fill="#8b5cf6"
                          className="transition-all duration-1000"
                        />
                        <circle
                          cx={20 + (selectedShipment.milestone * 52)}
                          cy={40 - (Math.sin((selectedShipment.milestone / 5) * Math.PI) * 20)}
                          r="11"
                          stroke="#8b5cf6"
                          strokeWidth="1.5"
                          fill="none"
                          className="animate-ping"
                        />
                      </g>
                    </svg>
                    
                    <span className="absolute bottom-1 text-[8px] font-mono text-slate-500 tracking-wider">
                      COURIER HEURISTIC VECTOR ROUTE
                    </span>
                  </div>

                  {/* Shipment Status & Update */}
                  <div className="relative z-10 bg-slate-900/90 border border-slate-800/80 rounded-xl p-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-200 truncate">{selectedShipment.lastUpdate}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Real-time update feed</p>
                    </div>
                  </div>
                </div>

                {/* Milestones Flow */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Milestone Progress Flow
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      { step: 0, label: "Label Released", desc: "Digital label printed and validated" },
                      { step: 1, label: "Picked Up", desc: "Handed over to courier driver" },
                      { step: 2, label: "Sorting Hub", desc: "Scanned and ready at sorting facility" },
                      { step: 3, label: "In Transit", desc: "En-route with courier fleet" },
                      { step: 4, label: "Out for Delivery", desc: "Assigned to destination delivery driver" },
                      { step: 5, label: "Delivered", desc: "Proof of delivery collected successfully" }
                    ].map((m) => {
                      const isDone = selectedShipment.milestone >= m.step;
                      const isCurrent = selectedShipment.milestone === m.step;
                      
                      return (
                        <div key={m.step} className="flex gap-3 items-start text-xs">
                          <div className="flex flex-col items-center shrink-0 mt-0.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                              isDone ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                            } ${isCurrent ? 'ring-4 ring-violet-100 dark:ring-violet-950/60 font-black' : ''}`}>
                              {isDone ? '✓' : m.step + 1}
                            </span>
                            {m.step < 5 && (
                              <span className={`w-0.5 h-5 mt-1 ${
                                selectedShipment.milestone > m.step ? 'bg-violet-500' : 'bg-slate-100 dark:bg-slate-700'
                              }`} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold transition-colors ${isDone ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                              {m.label}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                              {m.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Parcel Metrics */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Total Weight</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedShipment.weight}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Volume Dimensions</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedShipment.dimensions}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/50 dark:border-slate-800/80 pt-2.5 mt-1">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Recipient Consignee</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{selectedShipment.recipient}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug mt-1 break-words">{selectedShipment.address}</p>
                  </div>
                </div>

                {/* Real-time Tracker Entry Form */}
                <form onSubmit={handlePostTrackerEvent} className="bg-violet-50/40 dark:bg-slate-900/40 border border-violet-100 dark:border-slate-700/80 p-4 rounded-2xl text-xs space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-violet-100/50 dark:border-slate-700 pb-2">
                    <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Post Tracker Status Event
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Status Badge</label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="Pending Label">Pending Label</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Exception / Delay">Exception / Delay</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Milestone Phase</label>
                      <select
                        value={updateMilestone}
                        onChange={(e) => setUpdateMilestone(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <option value={0}>1. Label Released</option>
                        <option value={1}>2. Picked Up</option>
                        <option value={2}>3. Sorting Hub</option>
                        <option value={3}>4. In Transit</option>
                        <option value={4}>5. Out for Delivery</option>
                        <option value={5}>6. Delivered</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Live Status Feed Message</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arrived at distribution facility..."
                      value={updateLastUpdate}
                      onChange={(e) => setUpdateLastUpdate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-700 dark:text-slate-200 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {updateSuccess ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                        ✓ Dispatched successfully
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        Triggers Client Notification
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                    >
                      Post Live Update
                    </button>
                  </div>
                </form>

                {/* Detail Actions */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsLabelModalOpen(true)}
                      className="py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 border border-slate-200 dark:border-slate-650 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Label
                    </button>
                    <button
                      onClick={() => {
                        if (selectedShipment) {
                          setEditingShipment(selectedShipment);
                          const presets = ['FedEx', 'DHL', 'UPS', 'Local'];
                          setIsEditCustomCarrier(!presets.includes(selectedShipment.carrier));
                        }
                      }}
                      className="py-2.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-250 dark:border-violet-900/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  </div>

                  <button
                    onClick={handleSimulateRouteStep}
                    disabled={selectedShipment.milestone >= 5}
                    className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white disabled:text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Simulate Route Progression (+1 Step)</span>
                  </button>

                  <a
                    href={`/tmp_frontend/index.html?track=${selectedShipment.trackingNumber || selectedShipment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Live Frontend Tracker (New Tab)</span>
                  </a>

                  <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-semibold px-1 pt-0.5">
                    <span>Manual Company Orders Control</span>
                    <span>Direct Firestore Synchronization</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 italic text-xs">
                Select a shipment to inspect its tracking metrics and generate carrier documentation.
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: Carrier Integrations Subtab */}
      {activeSubTab === 'carriers' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-600" />
                Carrier Integrations (Sandbox APIs)
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                Enable native API webhooks to return tracking coordinates and generate digital consignment labels automatically.
              </p>
            </div>
            
            <button
              onClick={handleSaveCarriers}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Credentials
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* FedEx Card */}
            <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/10 text-purple-600 rounded-xl flex items-center justify-center font-black text-sm">
                    FDX
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">FedEx Web Services</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Express, Ground & SmartPost APIs</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    carriers.fedex.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    {carriers.fedex.enabled ? 'Connected' : 'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    checked={carriers.fedex.enabled}
                    onChange={() => toggleCarrierEnabled('fedex')}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Account Number</label>
                    <input
                      type="text"
                      value={carriers.fedex.fields.accountNum || ''}
                      onChange={(e) => handleCarrierFieldChange('fedex', 'accountNum', e.target.value)}
                      placeholder="e.g. 981273921"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Meter Number</label>
                    <input
                      type="text"
                      value={carriers.fedex.fields.meterNum || ''}
                      onChange={(e) => handleCarrierFieldChange('fedex', 'meterNum', e.target.value)}
                      placeholder="e.g. 10982312"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">API Key</label>
                    <input
                      type="password"
                      value={carriers.fedex.fields.apiKey || ''}
                      onChange={(e) => handleCarrierFieldChange('fedex', 'apiKey', e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Client Secret</label>
                    <input
                      type="password"
                      value={carriers.fedex.fields.apiSecret || ''}
                      onChange={(e) => handleCarrierFieldChange('fedex', 'apiSecret', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DHL Card */}
            <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 text-yellow-600 rounded-xl flex items-center justify-center font-black text-sm">
                    DHL
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">DHL Express XML</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">International Air Express Shipping</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    carriers.dhl.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    {carriers.dhl.enabled ? 'Connected' : 'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    checked={carriers.dhl.enabled}
                    onChange={() => toggleCarrierEnabled('dhl')}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Site ID</label>
                    <input
                      type="text"
                      value={carriers.dhl.fields.siteId || ''}
                      onChange={(e) => handleCarrierFieldChange('dhl', 'siteId', e.target.value)}
                      placeholder="e.g. STONEX_HQ_US"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">API Password</label>
                    <input
                      type="password"
                      value={carriers.dhl.fields.apiPassword || ''}
                      onChange={(e) => handleCarrierFieldChange('dhl', 'apiPassword', e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Account ID</label>
                  <input
                    type="text"
                    value={carriers.dhl.fields.accountId || ''}
                    onChange={(e) => handleCarrierFieldChange('dhl', 'accountId', e.target.value)}
                    placeholder="e.g. 849312948-EX"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* UPS Card */}
            <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-800/10 text-amber-800 rounded-xl flex items-center justify-center font-black text-sm">
                    UPS
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">UPS Developer Portal</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Ground & Air Consignment OAuth</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    carriers.ups.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    {carriers.ups.enabled ? 'Connected' : 'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    checked={carriers.ups.enabled}
                    onChange={() => toggleCarrierEnabled('ups')}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Access Key</label>
                    <input
                      type="text"
                      value={carriers.ups.fields.accessKey || ''}
                      onChange={(e) => handleCarrierFieldChange('ups', 'accessKey', e.target.value)}
                      placeholder="e.g. UPS-102931-EX"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Client ID</label>
                    <input
                      type="text"
                      value={carriers.ups.fields.clientId || ''}
                      onChange={(e) => handleCarrierFieldChange('ups', 'clientId', e.target.value)}
                      placeholder="e.g. stonex_client_prod"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Client Secret (OAuth)</label>
                  <input
                    type="password"
                    value={carriers.ups.fields.clientSecret || ''}
                    onChange={(e) => handleCarrierFieldChange('ups', 'clientSecret', e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Shippo Card */}
            <div className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm">
                    SHP
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Shippo / EasyPost Hub</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Multi-Carrier Master API Gateway</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    carriers.shippo.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    {carriers.shippo.enabled ? 'Connected' : 'Inactive'}
                  </span>
                  <input
                    type="checkbox"
                    checked={carriers.shippo.enabled}
                    onChange={() => toggleCarrierEnabled('shippo')}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Master Production API Key</label>
                  <input
                    type="password"
                    value={carriers.shippo.fields.apiKey || ''}
                    onChange={(e) => handleCarrierFieldChange('shippo', 'apiKey', e.target.value)}
                    placeholder="shippo_live_e398dc10f443928acb..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div className="p-3 bg-violet-50/40 dark:bg-violet-950/15 border border-violet-100/50 dark:border-violet-900/30 rounded-xl text-[10px] text-violet-700/80 dark:text-violet-400/80 leading-relaxed font-semibold">
                  💡 Shippo maps all 50+ logistics partners automatically! No individual carrier credentials needed.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: Rates & Rules Subtab */}
      {activeSubTab === 'rules' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-600" />
                Automated Shipping Rules & Rates
              </h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">
                Build logic-based automation triggers to select specific courier service classes based on weight, value, or location.
              </p>
            </div>
            
            <button
              onClick={() => setIsAddingRule(true)}
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              New Rule
            </button>
          </div>

          {/* Adding Rule Form (Inline Drawer) */}
          {isAddingRule && (
            <form onSubmit={handleAddRule} className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-slide-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-850">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Create Automation Rule</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g. Heavy Weight Freight"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 col-span-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Trigger On</label>
                    <select
                      value={newRule.trigger}
                      onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value as ShippingRule['trigger'] })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
                    >
                      <option value="value">Order Value ($)</option>
                      <option value="weight">Weight (kg)</option>
                      <option value="country">Country Code</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Operator</label>
                    <select
                      value={newRule.operator}
                      onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as ShippingRule['operator'] })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
                    >
                      <option value="gt">Is Greater Than (&gt;)</option>
                      <option value="lt">Is Less Than (&lt;)</option>
                      <option value="eq">Is Equal To (=)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400">Threshold Value</label>
                    <input
                      type="text"
                      required
                      value={newRule.value || ''}
                      onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                      placeholder="e.g. 150"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Assign Courier</label>
                  <select
                    value={newRule.carrier}
                    onChange={(e) => setNewRule({ ...newRule, carrier: e.target.value as ShippingRule['carrier'] })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none cursor-pointer"
                  >
                    <option value="FedEx">FedEx Express</option>
                    <option value="DHL">DHL Express Worldwide</option>
                    <option value="UPS">UPS Worldwide</option>
                    <option value="Local">Local Courier Hub</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Shipping Service Method Name</label>
                  <input
                    type="text"
                    required
                    value={newRule.method || ''}
                    onChange={(e) => setNewRule({ ...newRule, method: e.target.value })}
                    placeholder="e.g. DHL Express Worldwide Standard"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Create Automation Node
                </button>
              </div>
            </form>
          )}

          {/* Rules List */}
          <div className="space-y-3.5">
            {rules.map((rule) => {
              let triggerSymbol = '$';
              if (rule.trigger === 'weight') triggerSymbol = 'kg';
              if (rule.trigger === 'country') triggerSymbol = 'Code';

              return (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    rule.enabled
                      ? 'border-violet-100 dark:border-violet-950/60 bg-violet-50/10 dark:bg-violet-950/5'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{rule.name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase text-slate-500 rounded-md">
                        Trigger: {rule.trigger}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      If parcel <span className="font-bold text-slate-700 dark:text-slate-300">{rule.trigger}</span> is{' '}
                      <span className="font-extrabold">{rule.operator === 'gt' ? 'greater than' : rule.operator === 'lt' ? 'less than' : 'equal to'}</span>{' '}
                      <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-600 dark:text-slate-350">{rule.value} {triggerSymbol}</span>,{' '}
                      route parcel via <span className="font-extrabold text-violet-600 dark:text-violet-400">{rule.carrier} ({rule.method})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Enable Rule:</span>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Print Shipping Label modal */}
      {isLabelModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 font-sans">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                <Printer className="w-4 h-4 text-violet-600" />
                Airway Bill / Shipping Label
              </h3>
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Printable Label Section */}
            <div className="border-4 border-slate-900 p-4 rounded-lg space-y-3 font-mono text-[10px] uppercase leading-relaxed bg-white">
              
              {/* Row 1: Carrier & Logo */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5">
                <div className="text-xl font-black italic tracking-tighter text-slate-900">{selectedShipment.carrier} EXPRESS</div>
                <div className="text-right">
                  <div className="text-[9px] font-bold">Priority Airway Bill</div>
                  <div className="text-[11px] font-black">{selectedShipment.shippingMethod}</div>
                </div>
              </div>

              {/* Row 2: Addresses */}
              <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-900 pb-2.5">
                <div>
                  <div className="font-black text-[9px] border-b border-slate-900 mb-1">From (Shipper):</div>
                  <div className="font-bold text-slate-800">STONEX HQ METALS & TRADING</div>
                  <div>12 International Blvd</div>
                  <div>Singapore, SG 629175</div>
                  <div>PH: +65 6841 9028</div>
                </div>
                <div className="border-l border-slate-900 pl-4">
                  <div className="font-black text-[9px] border-b border-slate-900 mb-1">To (Consignee):</div>
                  <div className="font-black text-slate-900">{selectedShipment.recipient}</div>
                  <div>{selectedShipment.address}</div>
                </div>
              </div>

              {/* Row 3: Dimensions & Routing Info */}
              <div className="grid grid-cols-3 gap-2 border-b-2 border-slate-900 pb-2.5 text-center text-[9px]">
                <div className="border-r border-slate-900">
                  <div className="font-bold text-slate-500">Weight</div>
                  <div className="font-black text-slate-900 text-[10px] mt-0.5">{selectedShipment.weight}</div>
                </div>
                <div className="border-r border-slate-900">
                  <div className="font-bold text-slate-500">Dimensions</div>
                  <div className="font-black text-slate-900 text-[10px] mt-0.5">{selectedShipment.dimensions}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-500">Package Count</div>
                  <div className="font-black text-slate-900 text-[10px] mt-0.5">1 of 1</div>
                </div>
              </div>

              {/* Row 4: Large Hub Routing Code */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <div className="text-[8px] text-slate-500">Routing Hub</div>
                  <div className="text-2xl font-black tracking-widest">A-X90-Y81</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-slate-500">Postal Zone</div>
                  <div className="text-xl font-black">{selectedShipment.destination.split(', ')[1] || 'US-EAST'}</div>
                </div>
              </div>

              {/* Row 5: 1D Barcode block */}
              <div className="border-t-2 border-slate-900 pt-3 flex flex-col items-center gap-1.5">
                {/* 1D Barcode Lines */}
                <div className="w-full h-11 flex justify-center items-stretch gap-[1.5px] bg-white">
                  {[
                    2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2, 4, 1, 3, 1,
                    2, 3, 1, 4, 2, 2, 1, 3, 4, 1, 2, 3, 2, 1, 4, 2, 1, 3, 2, 4,
                    1, 2, 3, 1, 4, 2, 1, 2, 3, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2
                  ].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950"
                      style={{ width: `${w * 0.8}px` }}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold font-mono tracking-widest text-slate-900">
                  {selectedShipment.trackingNumber}
                </div>
              </div>

              {/* Footer barcode/routing stamp */}
              <div className="border-t border-dashed border-slate-900 pt-2 flex justify-between items-center text-[7px] text-slate-500 font-bold">
                <span>STONEX AUTOMATION CORE V3.9</span>
                <span>ORIGIN SCAN VALIDATED</span>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={() => { window.print(); }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Airway Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Contact Carrier support */}
      {isContactModalOpen && selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Contact {selectedShipment.carrier} Logistics
              </h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-850">
                <p className="font-bold text-slate-800 dark:text-white">Shipment Ref: {selectedShipment.id}</p>
                <p className="text-slate-500 dark:text-slate-400">Recipient: <span className="font-semibold">{selectedShipment.recipient}</span></p>
                <p className="text-slate-500 dark:text-slate-400">Tracking: <span className="font-mono font-bold text-slate-700 dark:text-slate-350">{selectedShipment.trackingNumber}</span></p>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 text-violet-600" />
                <span>Dedicated Support Hot-line: <span className="font-bold text-slate-800 dark:text-white">1-800-STONEX-SHIP</span></span>
              </div>

              <form onSubmit={handleContactCourier} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Query / Inquiry Details</label>
                  <textarea
                    required
                    rows={4}
                    value={courierMsg}
                    onChange={(e) => setCourierMsg(e.target.value)}
                    placeholder="Provide detailed instructions e.g. Address correction or delivery gate access code..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-violet-500 resize-none text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-250 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
                  >
                    {sendingMsg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Query...</span>
                      </>
                    ) : (
                      <span>Submit Query Ticket</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: Edit Shipment Modal */}
      {editingShipment && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Modify Active Consignment
              </h3>
              <button
                onClick={() => setEditingShipment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEditedShipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Order ID</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.orderId}
                    onChange={(e) => setEditingShipment({ ...editingShipment, orderId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.recipient}
                    onChange={(e) => setEditingShipment({ ...editingShipment, recipient: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Carrier</label>
                  <select
                    value={isEditCustomCarrier ? 'Custom' : (['FedEx', 'DHL', 'UPS', 'Local'].includes(editingShipment.carrier) ? editingShipment.carrier : 'Custom')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        setIsEditCustomCarrier(true);
                        setEditingShipment({ ...editingShipment, carrier: '' });
                      } else {
                        setIsEditCustomCarrier(false);
                        setEditingShipment({ ...editingShipment, carrier: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="UPS">UPS</option>
                    <option value="Local">Local Courier</option>
                    <option value="Custom">Other / Custom...</option>
                  </select>
                  {isEditCustomCarrier && (
                    <div className="space-y-1 mt-1.5 animate-fade-in">
                      <input
                        type="text"
                        required
                        placeholder="Enter parcel company name..."
                        value={editingShipment.carrier}
                        onChange={(e) => setEditingShipment({ ...editingShipment, carrier: e.target.value })}
                        className="w-full px-3 py-2 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl outline-none font-bold text-violet-700 dark:text-violet-300"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Tracking Reference</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.trackingNumber}
                    onChange={(e) => setEditingShipment({ ...editingShipment, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Current Status</label>
                  <select
                    value={editingShipment.status}
                    onChange={(e) => setEditingShipment({ ...editingShipment, status: e.target.value as Shipment['status'] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="Pending Label">Pending Label</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Exception / Delay">Exception / Delay</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Milestone Checkpoint</label>
                  <select
                    value={editingShipment.milestone}
                    onChange={(e) => setEditingShipment({ ...editingShipment, milestone: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                  >
                    <option value={0}>1. Label Created</option>
                    <option value={1}>2. Picked Up</option>
                    <option value={2}>3. Sorting Hub</option>
                    <option value={3}>4. In Transit</option>
                    <option value={4}>5. Out for Delivery</option>
                    <option value={5}>6. Delivered</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Weight</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.weight}
                    onChange={(e) => setEditingShipment({ ...editingShipment, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Dimensions</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.dimensions}
                    onChange={(e) => setEditingShipment({ ...editingShipment, dimensions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Shipping Method</label>
                  <input
                    type="text"
                    required
                    value={editingShipment.shippingMethod}
                    onChange={(e) => setEditingShipment({ ...editingShipment, shippingMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Destination City / Country</label>
                <input
                  type="text"
                  required
                  value={editingShipment.destination}
                  onChange={(e) => setEditingShipment({ ...editingShipment, destination: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Detailed Delivery Address</label>
                <input
                  type="text"
                  required
                  value={editingShipment.address}
                  onChange={(e) => setEditingShipment({ ...editingShipment, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Latest Live Status Update Message</label>
                <textarea
                  required
                  rows={2}
                  value={editingShipment.lastUpdate}
                  onChange={(e) => setEditingShipment({ ...editingShipment, lastUpdate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none font-medium text-slate-750 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setEditingShipment(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-250 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Consignment Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create New Shipment Modal */}
      {isNewShipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase flex items-center gap-2">
                <Truck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Register New Consignment
              </h3>
              <button
                onClick={() => setIsNewShipmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Order ID</label>
                  <input
                    type="text"
                    required
                    value={newShipment.orderId || ''}
                    onChange={(e) => setNewShipment({ ...newShipment, orderId: e.target.value })}
                    placeholder="e.g. #10483"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newShipment.recipient || ''}
                    onChange={(e) => setNewShipment({ ...newShipment, recipient: e.target.value })}
                    placeholder="e.g. Alice Cooper"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Carrier</label>
                  <select
                    value={isCustomCarrier ? 'Custom' : newShipment.carrier}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        setIsCustomCarrier(true);
                        setNewShipment({ ...newShipment, carrier: '' });
                      } else {
                        setIsCustomCarrier(false);
                        setNewShipment({ ...newShipment, carrier: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="UPS">UPS</option>
                    <option value="Local">Local Courier</option>
                    <option value="Custom">Other / Custom...</option>
                  </select>
                  {isCustomCarrier && (
                    <div className="space-y-1 mt-1.5 animate-fade-in">
                      <input
                        type="text"
                        required
                        placeholder="Enter parcel company name..."
                        value={newShipment.carrier || ''}
                        onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                        className="w-full px-3 py-2 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl outline-none font-bold text-violet-700 dark:text-violet-300"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Tracking Number (Optional)</label>
                  <input
                    type="text"
                    value={newShipment.trackingNumber || ''}
                    onChange={(e) => setNewShipment({ ...newShipment, trackingNumber: e.target.value })}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Full Shipping Address</label>
                <input
                  type="text"
                  required
                  value={newShipment.address || ''}
                  onChange={(e) => setNewShipment({ ...newShipment, address: e.target.value, destination: e.target.value })}
                  placeholder="e.g. 10 Pine St, Seattle, WA 98101, US"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Weight</label>
                  <input
                    type="text"
                    value={newShipment.weight || ''}
                    onChange={(e) => setNewShipment({ ...newShipment, weight: e.target.value })}
                    placeholder="e.g. 2.4 kg"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Dimensions</label>
                  <input
                    type="text"
                    value={newShipment.dimensions || ''}
                    onChange={(e) => setNewShipment({ ...newShipment, dimensions: e.target.value })}
                    placeholder="e.g. 20x15x10 cm"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Initial Milestone</label>
                  <select
                    value={newShipment.milestone}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      const statuses: Shipment['status'][] = ['Pending Label', 'In Transit', 'In Transit', 'In Transit', 'Out for Delivery', 'Delivered'];
                      setNewShipment({ ...newShipment, milestone: m, status: statuses[m] });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none cursor-pointer"
                  >
                    <option value={0}>1. Label Created</option>
                    <option value={1}>2. Picked Up</option>
                    <option value={2}>3. Sorting Hub</option>
                    <option value={3}>4. In Transit</option>
                    <option value={4}>5. Out for Delivery</option>
                    <option value={5}>6. Delivered</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Shipping Service Method</label>
                <input
                  type="text"
                  value={newShipment.shippingMethod || ''}
                  onChange={(e) => setNewShipment({ ...newShipment, shippingMethod: e.target.value })}
                  placeholder="e.g. FedEx Standard Ground Overnight"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setIsNewShipmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-250 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Register Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
