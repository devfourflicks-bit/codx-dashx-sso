/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import {
  ThemeConfig,
  CompanyInfo,
  HeroConfig,
  ListItem,
  ContactConfig,
  Product,
  Lead,
  CustomRole,
  DEFAULT_CUSTOM_ROLES,
  SeoConfig
} from './types';

// Component imports
import LoginOverlay from './components/LoginOverlay';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewSection from './components/OverviewSection';
import ThemeSection from './components/ThemeSection';
import CompanyInfoSection from './components/CompanyInfoSection';
import HeroSection from './components/HeroSection';
import ListSection from './components/ListSection';
import ProductsSection from './components/ProductsSection';
import ContactSection from './components/ContactSection';
import AnnouncementsSection from './components/AnnouncementsSection';
import LeadsSection from './components/LeadsSection';
import RoleRegistrySection from './components/RoleRegistrySection';
import LogisticsSection from './components/LogisticsSection';
import LocalFrontendSection from './components/LocalFrontendSection';
import SeoSection from './components/SeoSection';
import DomainManagementSection from './components/DomainManagementSection';
import InvoiceSection from './components/InvoiceSection';
import { ConfirmProvider } from './components/ConfirmDialog';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('overview-section');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Firestore Loaded Configs
  const [themeData, setThemeData] = useState<ThemeConfig | null>(null);
  const [companyData, setCompanyData] = useState<CompanyInfo | null>(null);
  const [heroData, setHeroData] = useState<HeroConfig | null>(null);
  const [servicesData, setServicesData] = useState<ListItem[] | null>(null);
  const [whyChooseData, setWhyChooseData] = useState<ListItem[] | null>(null);
  const [processData, setProcessData] = useState<ListItem[] | null>(null);
  const [contactData, setContactData] = useState<ContactConfig | null>(null);
  const [announcementsData, setAnnouncementsData] = useState<string[] | null>(null);
  const [seoData, setSeoData] = useState<SeoConfig | null>(null);
  
  // Collections lists
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // User Role & Developer Mode States
  const [currentUserRole, setCurrentUserRole] = useState<string>('Employee');
  const [developerMode, setDeveloperMode] = useState<boolean>(true);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(DEFAULT_CUSTOM_ROLES);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        fetchUserRole(currentUser.email);
      } else {
        setAuthChecking(false);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserRole = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'sanjoobjayamohan@gmail.com') {
      setCurrentUserRole('Developer');
      setDeveloperMode(true);
      setAuthChecking(false);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'siteConfig', 'userRoles'));
      if (snap.exists() && snap.data()[cleanEmail]) {
        const role = snap.data()[cleanEmail];
        setCurrentUserRole(role);
        setDeveloperMode(role === 'Developer');
      } else {
        if (cleanEmail.includes('admin') || cleanEmail.includes('stonex')) {
          setCurrentUserRole('Admin');
        } else {
          setCurrentUserRole('Employee');
        }
        setDeveloperMode(false);
      }
    } catch (err) {
      console.warn('Could not read userRoles document from siteConfig. Using client-side defaults.', err);
      if (cleanEmail.includes('admin') || cleanEmail.includes('stonex')) {
        setCurrentUserRole('Admin');
      } else {
        setCurrentUserRole('Employee');
      }
      setDeveloperMode(false);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch Firestore Data when authenticated
  useEffect(() => {
    if (user) {
      loadAllConfigs();
      loadProducts();
      loadLeads();
    }
  }, [user]);

  const loadAllConfigs = async () => {
    try {
      // Theme
      const themeSnap = await getDoc(doc(db, 'siteConfig', 'theme'));
      if (themeSnap.exists()) {
        setThemeData(themeSnap.data() as ThemeConfig);
      }

      // Company Info
      const companySnap = await getDoc(doc(db, 'siteConfig', 'companyInfo'));
      if (companySnap.exists()) {
        setCompanyData(companySnap.data() as CompanyInfo);
      }

      // Hero
      const heroSnap = await getDoc(doc(db, 'siteConfig', 'hero'));
      if (heroSnap.exists()) {
        setHeroData(heroSnap.data() as HeroConfig);
      }

      // Services
      const servicesSnap = await getDoc(doc(db, 'siteConfig', 'services'));
      if (servicesSnap.exists()) {
        setServicesData(servicesSnap.data().items as ListItem[]);
      }

      // Why Choose Us
      const whySnap = await getDoc(doc(db, 'siteConfig', 'whyChoose'));
      if (whySnap.exists()) {
        setWhyChooseData(whySnap.data().items as ListItem[]);
      }

      // Process
      const processSnap = await getDoc(doc(db, 'siteConfig', 'process'));
      if (processSnap.exists()) {
        setProcessData(processSnap.data().items as ListItem[]);
      }

      // Contact
      const contactSnap = await getDoc(doc(db, 'siteConfig', 'contact'));
      if (contactSnap.exists()) {
        setContactData(contactSnap.data() as ContactConfig);
      }

      // Announcements
      const announcementsSnap = await getDoc(doc(db, 'siteConfig', 'announcements'));
      if (announcementsSnap.exists()) {
        setAnnouncementsData(announcementsSnap.data().items as string[]);
      }

      // SEO Settings
      const seoSnap = await getDoc(doc(db, 'siteConfig', 'seo'));
      if (seoSnap.exists()) {
        setSeoData(seoSnap.data() as SeoConfig);
      }

      // Custom Roles Definitions
      const rolesConfigSnap = await getDoc(doc(db, 'siteConfig', 'rolesConfig'));
      if (rolesConfigSnap.exists() && rolesConfigSnap.data().roles) {
        setCustomRoles(rolesConfigSnap.data().roles as CustomRole[]);
      }
    } catch (err) {
      console.error('Error fetching site configuration templates:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const q = await getDocs(collection(db, 'products'));
      const list: Product[] = [];
      q.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(list);
    } catch (err) {
      console.error('Error loading product catalog documents:', err);
    }
  };

  const loadLeads = async () => {
    try {
      const q = await getDocs(collection(db, 'chatbot_leads'));
      const list: Lead[] = [];
      q.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Lead);
      });
      // Sort descending by timestamp
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLeads(list);
    } catch (err) {
      console.error('Error loading chatbot leads inquiries:', err);
    }
  };

  const triggerSaveNotification = (message: string = 'All changes saved successfully.') => {
    setSaveStatus(message);
    setTimeout(() => {
      setSaveStatus(null);
    }, 4000);
  };

  const handleConfigSave = (key: string, data: any) => {
    if (key === 'theme') setThemeData(data);
    else if (key === 'companyInfo') setCompanyData(data);
    else if (key === 'hero') setHeroData(data);
    else if (key === 'contact') setContactData(data);
    else if (key === 'announcements') setAnnouncementsData(data);
    else if (key === 'seo') setSeoData(data);
    
    triggerSaveNotification();
  };

  const handleListSave = (key: 'services' | 'whyChoose' | 'process', items: ListItem[]) => {
    if (key === 'services') setServicesData(items);
    else if (key === 'whyChoose') setWhyChooseData(items);
    else if (key === 'process') setProcessData(items);

    triggerSaveNotification();
  };

  if (authChecking) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border-4 border-violet-100 dark:border-violet-950 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Loading System
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginOverlay onLoginSuccess={loadAllConfigs} />;
  }

  // Active Tab View Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview-section':
        return (
          <OverviewSection
            productsCount={products.length}
            leadsCount={leads.length}
            setActiveTab={setActiveTab}
            userEmail={user.email}
          />
        );
      case 'theme-section':
        return (
          <ThemeSection
            themeData={themeData}
            onSave={(data) => handleConfigSave('theme', data)}
            companyData={companyData}
            onSaveCompany={(data) => handleConfigSave('companyInfo', data)}
            heroData={heroData}
            onSaveHero={(data) => handleConfigSave('hero', data)}
            servicesData={servicesData}
            onSaveServices={handleListSave}
            products={products}
            onRefreshProducts={loadProducts}
            whyChooseData={whyChooseData}
            onSaveWhyChoose={handleListSave}
            processData={processData}
            onSaveProcess={handleListSave}
            contactData={contactData}
            onSaveContact={(data) => handleConfigSave('contact', data)}
            announcementsData={announcementsData}
            onSaveAnnouncements={(items) => handleConfigSave('announcements', items)}
          />
        );
      case 'company-info-section':
        return (
          <CompanyInfoSection
            companyData={companyData}
            onSave={(data) => handleConfigSave('companyInfo', data)}
          />
        );
      case 'hero-section':
        return (
          <HeroSection
            heroData={heroData}
            onSave={(data) => handleConfigSave('hero', data)}
          />
        );
      case 'services-section':
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
            onSave={handleListSave}
          />
        );
      case 'why-choose-section':
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
            onSave={handleListSave}
          />
        );
      case 'process-section':
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
            onSave={handleListSave}
          />
        );
      case 'products-section':
        return <ProductsSection products={products} onRefresh={loadProducts} />;
      case 'contact-section':
        return (
          <ContactSection
            contactData={contactData}
            onSave={(data) => handleConfigSave('contact', data)}
          />
        );
      case 'announcements-section':
        return (
          <AnnouncementsSection
            announcementsData={announcementsData}
            onSave={(items) => handleConfigSave('announcements', items)}
          />
        );
      case 'leads-section':
        return <LeadsSection leads={leads} onUpdateLead={loadLeads} />;
      case 'role-registry-section':
        return (
          <RoleRegistrySection
            currentUserEmail={user.email}
            currentUserRole={currentUserRole}
            customRoles={customRoles}
            onRolesUpdated={(updated) => setCustomRoles(updated)}
          />
        );
      case 'logistics-section':
        return <LogisticsSection />;
      case 'local-frontend-section':
        return <LocalFrontendSection onNotifySync={loadAllConfigs} />;
      case 'seo-section':
        return (
          <SeoSection
            seoData={seoData}
            onSave={(data) => handleConfigSave('seo', data)}
          />
        );
      case 'domain-management':
        return (
          <DomainManagementSection />
        );
      case 'billing-invoice':
        return (
          <InvoiceSection />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400 italic">
            Tab component is under development.
          </div>
        );
    }
  };

  return (
    <ConfirmProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logoUrl={themeData?.logoUrl || null}
          logoType={themeData?.logoType}
          logoText={themeData?.logoText}
          logoSize={themeData?.logoSize}
          userEmail={user.email}
          currentUserRole={currentUserRole}
          developerMode={developerMode}
          onToggleDeveloperMode={setDeveloperMode}
          customRoles={customRoles}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header toolbar */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            saveStatus={saveStatus}
            userEmail={user.email}
            liveSiteUrl="https://stonexx-test.vercel.app/"
          />

          {/* Dynamic section views */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
