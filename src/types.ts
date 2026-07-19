/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThemeToggles {
  whatsapp: boolean;
  topbar: boolean;
  ticker: boolean;
  process: boolean;
  stats?: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  headerBg: string;
  font: string;
  logoUrl: string | null;
  logoType?: 'text' | 'image' | 'both';
  logoText?: string;
  logoSize?: number;
  fontSizeBase?: 'small' | 'normal' | 'large' | 'xlarge';
  menuTextSize?: 'small' | 'normal' | 'large' | 'xlarge';
  sectionColors?: {
    [sectionId: string]: {
      bg?: string;
      text?: string;
      bgImage?: string;
    };
  };
  toggles: ThemeToggles;
  preloader?: {
    showPreloader: boolean;
    preloaderStyle: 'linear' | 'circle' | 'bouncing';
    preloaderAnimation: 'pulse' | 'spin' | 'glow' | 'bounce' | 'flip';
    preloaderLogoUrl?: string;
    preloaderTheme?: string;
    preloaderDuration?: number;
  };
  footer?: {
    bg?: string;
    text?: string;
    iconColor?: string;
    brandDesc?: string;
    copyright?: string;
    showSocial?: boolean;
    showLogo?: boolean;
  };
  glassEffects?: boolean;
  loginTheme?: {
    bgUrl?: string;
    overlayColor?: string;
    overlayOpacity?: number;
    blurLevel?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    cardBg?: string;
    cardBorder?: string;
    primaryBtnBg?: string;
    primaryBtnText?: string;
  };
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  about: string;
  statProjects: number;
  statClients: number;
  statYears: number;
  statProducts: number;
  imageUrl?: string;
}

export interface HeroConfig {
  title1: string;
  title2: string;
  subtitle: string;
  btn1Text: string;
  badge: string;
  bgImages: string[];
  videoUrl?: string;
  splineUrl?: string;
  mediaType?: 'image' | 'video' | 'spline';
  overlayType?: 'white' | 'dark';
  overlayOpacity?: number;
}

export interface ListItem {
  key?: string;
  title: string;
  desc: string;
  imageUrl?: string;
}

export interface ListConfig {
  items: ListItem[];
}

export interface SocialLinks {
  facebook: string;
  linkedin: string;
  instagram: string;
  whatsapp: string;
}

export interface ContactConfig {
  email: string;
  phone: string;
  address: string;
  hours: string;
  social: SocialLinks;
  imageUrl?: string;
}

export interface AnnouncementsConfig {
  items: string[];
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  icon: string;
  desc: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  timestamp: string;
  status?: 'New' | 'In Progress' | 'Contacted' | 'Closed';
}

export interface Shipment {
  id: string;
  orderId: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: 'In Transit' | 'Out for Delivery' | 'Exception / Delay' | 'Delivered' | 'Pending';
  lastUpdated: string;
  recipientName?: string;
  notes?: string;
}

export interface CarrierIntegration {
  id: string; // 'fedex' | 'dhl' | 'shippo' | 'ups'
  name: string;
  isEnabled: boolean;
  apiKey?: string;
  accountNumber?: string;
  meterNumber?: string;
  siteId?: string;
  apiPassword?: string;
}

export interface ShippingRule {
  id: string;
  name: string;
  trigger: string;
  carrier: string;
  rate: number;
}

export interface CustomRole {
  name: string;
  description: string;
  allowedTabs: string[];
}

export const DEFAULT_CUSTOM_ROLES: CustomRole[] = [
  {
    name: 'Developer',
    description: 'System creator with absolute access to all sections and backend setups.',
    allowedTabs: [
      'overview-section',
      'theme-section',
      'company-info-section',
      'hero-section',
      'services-section',
      'products-section',
      'logistics-section',
      'why-choose-section',
      'process-section',
      'contact-section',
      'announcements-section',
      'leads-section',
      'role-registry-section',
      'local-frontend-section',
      'seo-section'
    ]
  },
  {
    name: 'Admin',
    description: 'Company administrator with management, product mapping, and registration privileges.',
    allowedTabs: [
      'overview-section',
      'products-section',
      'logistics-section',
      'why-choose-section',
      'contact-section',
      'leads-section',
      'role-registry-section',
      'local-frontend-section',
      'seo-section'
    ]
  },
  {
    name: 'Employee',
    description: 'Standard staff with basic operation tracking and catalog view access.',
    allowedTabs: [
      'overview-section',
      'products-section',
      'logistics-section',
      'leads-section',
      'local-frontend-section'
    ]
  },
  {
    name: 'Sales Associate',
    description: 'Frontline sales representative focused on products catalog and lead conversions.',
    allowedTabs: [
      'overview-section',
      'products-section',
      'logistics-section',
      'leads-section',
      'local-frontend-section'
    ]
  },
  {
    name: 'Marketing Associate',
    description: 'Sourcing and content manager for website copy, media sliders, and corporate alerts.',
    allowedTabs: [
      'overview-section',
      'hero-section',
      'services-section',
      'process-section',
      'announcements-section',
      'logistics-section',
      'local-frontend-section',
      'seo-section'
    ]
  }
];



