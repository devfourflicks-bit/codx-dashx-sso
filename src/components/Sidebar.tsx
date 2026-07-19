/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { CustomRole } from '../types';
import {
  LayoutDashboard,
  Palette,
  Building2,
  Image,
  Package,
  ShoppingBag,
  Star,
  ClipboardList,
  PhoneCall,
  Megaphone,
  Users,
  LogOut,
  ShieldCheck,
  Truck,
  Globe,
  Search,
  Monitor,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logoUrl: string | null;
  logoType?: 'text' | 'image' | 'both';
  logoText?: string;
  logoSize?: number;
  userEmail: string | null;
  currentUserRole: string;
  developerMode: boolean;
  onToggleDeveloperMode: (val: boolean) => void;
  customRoles?: CustomRole[];
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  logoUrl,
  logoType = 'image',
  logoText = '',
  logoSize = 36,
  userEmail,
  currentUserRole,
  developerMode,
  onToggleDeveloperMode,
  customRoles = []
}: SidebarProps) {
  const allMenuItems = [
    { id: 'overview-section', label: 'Overview', icon: LayoutDashboard },
    { id: 'theme-section', label: 'Theme Panel', icon: Palette },
    { id: 'logistics-section', label: 'Logistics', icon: Truck },
    { id: 'leads-section', label: 'Chat Leads', icon: Users },
    { id: 'role-registry-section', label: 'Role Registry', icon: ShieldCheck },
    { id: 'local-frontend-section', label: 'View Local Frontend', icon: Monitor },
    { id: 'seo-section', label: 'SEO Settings', icon: Search },
    { id: 'domain-management', label: 'Domain Management', icon: Globe },
    { id: 'billing-invoice', label: 'Billing & Invoices', icon: Receipt },
  ];

  // Filter based on role and developer mode toggle
  let menuItems = allMenuItems;

  const foundRole = customRoles.find(r => r.name.toLowerCase() === currentUserRole.toLowerCase());

  if (currentUserRole === 'Developer') {
    if (!developerMode) {
      menuItems = allMenuItems.filter(item => 
        ['overview-section', 'theme-section', 'logistics-section', 'leads-section', 'role-registry-section', 'local-frontend-section', 'seo-section', 'domain-management', 'billing-invoice'].includes(item.id)
      );
    }
  } else if (foundRole) {
    // If the role specifies allowedTabs, map any of the older tabs to theme-section
    const allowed = foundRole.allowedTabs.map(tab => 
      ['company-info-section', 'hero-section', 'services-section', 'why-choose-section', 'process-section', 'products-section', 'contact-section', 'announcements-section'].includes(tab)
        ? 'theme-section'
        : tab
    );
    menuItems = allMenuItems.filter(item => allowed.includes(item.id) || ['local-frontend-section', 'billing-invoice'].includes(item.id));
  } else if (currentUserRole === 'Admin') {
    menuItems = allMenuItems.filter(item => 
      ['overview-section', 'theme-section', 'logistics-section', 'leads-section', 'role-registry-section', 'local-frontend-section', 'seo-section', 'domain-management', 'billing-invoice'].includes(item.id)
    );
  } else if (currentUserRole === 'Employee') {
    menuItems = allMenuItems.filter(item => 
      ['overview-section', 'logistics-section', 'leads-section', 'local-frontend-section', 'billing-invoice'].includes(item.id)
    );
  } else if (currentUserRole === 'Sales Associate') {
    menuItems = allMenuItems.filter(item => 
      ['overview-section', 'logistics-section', 'leads-section', 'local-frontend-section', 'billing-invoice'].includes(item.id)
    );
  } else if (currentUserRole === 'Marketing Associate') {
    menuItems = allMenuItems.filter(item => 
      ['overview-section', 'theme-section', 'logistics-section', 'local-frontend-section', 'seo-section', 'billing-invoice'].includes(item.id)
    );
  } else {
    // Custom role fallback during load or if not defined
    menuItems = allMenuItems.filter(item => 
      ['overview-section', 'logistics-section', 'leads-section', 'local-frontend-section', 'billing-invoice'].includes(item.id)
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 border-r border-slate-150 dark:border-slate-800 p-6 flex flex-col h-screen shrink-0 overflow-y-auto relative shadow-sm">
      <div className="flex flex-col items-center mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 w-full">
        {logoType === 'text' ? (
          <div className="text-xl font-black text-violet-600 dark:text-violet-400 tracking-wider uppercase mb-3 text-center truncate w-full font-display">
            {logoText || 'Stonex'}
          </div>
        ) : logoType === 'both' ? (
          <div className="flex flex-col items-center gap-3 mb-3 w-full">
            {logoUrl ? (
              <img src={logoUrl} alt="Stonex Logo" style={{ height: `${logoSize}px` }} className="object-contain filter drop-shadow-[0_2px_8px_rgba(124,58,237,0.1)]" />
            ) : (
              <div style={{ width: `${Math.max(36, logoSize)}px`, height: `${Math.max(36, logoSize)}px` }} className="rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/20">
                {logoText ? logoText.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div className="text-sm font-black text-slate-850 dark:text-slate-100 tracking-wide truncate max-w-full font-display">
              {logoText || 'Stonex'}
            </div>
          </div>
        ) : (
          /* image only */
          <div className="flex flex-col items-center mb-3 w-full">
            {logoUrl ? (
              <img src={logoUrl} alt="Stonex Logo" style={{ height: `${logoSize}px` }} className="object-contain filter drop-shadow-[0_2px_8px_rgba(124,58,237,0.1)]" />
            ) : (
              <div style={{ width: `${Math.max(36, logoSize)}px`, height: `${Math.max(36, logoSize)}px` }} className="rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/20">
                S
              </div>
            )}
          </div>
        )}
        {logoType !== 'both' && (
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-center">
            {currentUserRole === 'Developer' ? 'Developer Workspace' : 'Admin Console'}
          </h2>
        )}
      </div>

      {/* Developer Option Switch */}
      {currentUserRole === 'Developer' && (
        <div className="mb-6 px-4 py-3 bg-violet-50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/20 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Developer Option
            </span>
            <span className="text-[9px] bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md font-bold uppercase">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Developer Mode
            </label>
            <button
              type="button"
              onClick={() => onToggleDeveloperMode(!developerMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                developerMode ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  developerMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left cursor-pointer relative group ${
                isActive
                  ? 'bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-750 text-violet-600 dark:text-violet-400 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-violet-600 dark:bg-violet-500 rounded-r-full" />
              )}
              <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
        <div className="flex items-center gap-3.5 px-3 py-2 mb-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 shadow-sm">
            {userEmail ? userEmail.charAt(0) : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-display">
              {userEmail ? userEmail.split('@')[0] : 'Admin'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize font-semibold mt-0.5">
              Role: {currentUserRole}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-all duration-200 text-left cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
