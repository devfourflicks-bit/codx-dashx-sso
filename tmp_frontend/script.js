// ════════════════════════════════════════════════════════════════
//  STONEX PUBLIC SITE — script.js
//  Loads content from Firebase Firestore and applies it live
// ════════════════════════════════════════════════════════════════

import { initializeApp }      from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc }
                               from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { firebaseConfig }      from "./firebase-config.js";

// ─── Init ────────────────────────────────────────────────────
const siteLoadStartTime = performance.now();
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ════════════════════════════════════════════════════════════════
//  LOAD SITE CONFIG FROM FIRESTORE
// ════════════════════════════════════════════════════════════════
async function loadSiteConfig() {
  let hasCache = false;
  // 1. Instantly load from cache for blazing fast first-contentful paint
  try {
    const cachedConfigStr = localStorage.getItem('stonex_all_configs_cache');
    if (cachedConfigStr) {
      const cached = JSON.parse(cachedConfigStr);
      if (cached.companyInfo) applyCompanyInfo(cached.companyInfo);
      if (cached.hero)        applyHero(cached.hero);
      if (cached.services)    applyServices(cached.services);
      if (cached.contact)     applyContact(cached.contact);
      if (cached.theme)       applyTheme(cached.theme);
      if (cached.announcements) applyAnnouncements(cached.announcements);
      if (cached.whyChoose)   applyWhyChoose(cached.whyChoose);
      if (cached.process)     applyProcess(cached.process);
      console.log('Successfully loaded all site content instantly from local cache.');
      hasCache = true;
    }
  } catch (err) {
    console.warn('Error applying cached config:', err);
  }

  // Define the fetching process
  const fetchFreshConfig = async () => {
    try {
      const [companySnap, heroSnap, servicesSnap, contactSnap, themeSnap, announcementsSnap, whySnap, processSnap] =
        await Promise.all([
          getDoc(doc(db, 'siteConfig', 'companyInfo')),
          getDoc(doc(db, 'siteConfig', 'hero')),
          getDoc(doc(db, 'siteConfig', 'services')),
          getDoc(doc(db, 'siteConfig', 'contact')),
          getDoc(doc(db, 'siteConfig', 'theme')),
          getDoc(doc(db, 'siteConfig', 'announcements')),
          getDoc(doc(db, 'siteConfig', 'whyChoose')),
          getDoc(doc(db, 'siteConfig', 'process')),
        ]);

      const activeConfigs = {};

      if (companySnap.exists()) {
        const data = companySnap.data();
        applyCompanyInfo(data);
        activeConfigs.companyInfo = data;
      }
      if (heroSnap.exists()) {
        const data = heroSnap.data();
        applyHero(data);
        activeConfigs.hero = data;
      }
      if (servicesSnap.exists()) {
        const data = servicesSnap.data();
        applyServices(data);
        activeConfigs.services = data;
      }
      if (contactSnap.exists()) {
        const data = contactSnap.data();
        applyContact(data);
        activeConfigs.contact = data;
      }
      if (themeSnap.exists()) {
        const data = themeSnap.data();
        applyTheme(data);
        activeConfigs.theme = data;
      }
      if (announcementsSnap.exists()) {
        const data = announcementsSnap.data();
        applyAnnouncements(data);
        activeConfigs.announcements = data;
      }
      if (whySnap.exists()) {
        const data = whySnap.data();
        applyWhyChoose(data);
        activeConfigs.whyChoose = data;
      }
      if (processSnap.exists()) {
        const data = processSnap.data();
        applyProcess(data);
        activeConfigs.process = data;
      }

      // Save full package to cache
      try {
        localStorage.setItem('stonex_all_configs_cache', JSON.stringify(activeConfigs));
      } catch (e) {
        console.warn('Cache write limit or error:', e);
      }
      console.log('Successfully fetched and applied fresh config from Firestore.');
    } catch (e) {
      console.info('Firebase fetch error, falling back to cached/static content.', e.message);
    }
  };

  // 2. Fetch fresh content in background or foreground
  if (hasCache) {
    // If we have cached content, do not block the page load!
    // Fetch in the background so that the site is instantly interactive.
    fetchFreshConfig();
    return;
  }

  // If there's no cache, wait for the network fetch, but with a strict 1.5s timeout.
  // This ensures the site NEVER gets stuck on a white screen even on slow networks.
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
  await Promise.race([fetchFreshConfig(), timeoutPromise]);
}

// ─── Company Info ────────────────────────────────────────────
function applyCompanyInfo(d) {
  setAll('.company-name', d.name);
  setAll('.company-tagline', d.tagline);
  setAll('.company-phone', d.phone);
  setAll('.company-email', d.email);
  setAll('.company-address', d.address);
  setAll('.company-hours', d.hours);
  if (d.whatsapp) {
    document.querySelectorAll('a[id="whatsapp-float-btn"]').forEach(a => {
      a.href = `https://wa.me/${d.whatsapp.replace(/\D/g,'')}`;
    });
  }
  // Stats
  if (d.statProjects !== undefined) updateCounter('stat-projects-val', d.statProjects);
  if (d.statClients !== undefined)  updateCounter('stat-clients-val', d.statClients);
  if (d.statYears !== undefined)    updateCounter('stat-years-val', d.statYears);
  if (d.statProducts !== undefined) updateCounter('stat-products-val', d.statProducts);
  animateCounters();
  // About description
  const aboutDesc = document.querySelectorAll('.about-desc-dynamic, .about-desc');
  if (d.about && aboutDesc.length) {
    aboutDesc.forEach((el, index) => {
      // If there are multiple about descriptions (e.g. paragraph 1, paragraph 2)
      // we only replace the first one or replace all of them with the new text.
      // But let's only replace the first paragraph or update all elements so they show the real text.
      if (index === 0) {
        el.textContent = d.about;
      } else {
        // Hide secondary descriptions or keep them if they are static, or just let them stay.
        // Let's just update the first one or clear others if needed. Actually updating index 0 is safest, 
        // but let's update all that are dynamic.
        if (el.classList.contains('about-desc-dynamic')) {
          el.textContent = d.about;
        } else {
          // If it's a static secondary block, we can hide it or clear it so it doesn't duplicate info.
          el.style.display = 'none';
        }
      }
    });
  }
  // About Image
  const aboutImgs = document.querySelectorAll('.about-img, .about-img-dynamic');
  if (d.imageUrl && aboutImgs.length) {
    aboutImgs.forEach(img => {
      img.src = d.imageUrl;
    });
  }
}

// ─── Hero ────────────────────────────────────────────────────
function applyHero(d) {
  const t1 = document.getElementById('hero-title-line1');
  const t2 = document.getElementById('hero-title-line2');
  const sub = document.getElementById('hero-subtitle-text');
  const btn1 = document.getElementById('hero-explore-btn');
  const btn2 = document.getElementById('hero-contact-btn');
  const badge = document.getElementById('hero-badge-text');

  if (t1 && d.title1)   t1.textContent = d.title1;
  if (t2 && d.title2)   t2.textContent = d.title2;
  if (sub && d.subtitle) sub.textContent = d.subtitle;
  if (btn1 && d.btn1Text) btn1.textContent = d.btn1Text;
  if (btn2 && d.btn2Text) btn2.textContent = d.btn2Text;
  if (badge && d.badge)   badge.textContent = d.badge;

  const heroBg = document.querySelector('.hero-bg');
  const heroEl = document.querySelector('.hero');
  const bgImages = d.bgImages || [];

  if (heroBg) {
    // Rebuild the hero background with sliding images/video and overlay
    heroBg.innerHTML = '';

    let imgs = [];

    if (d.mediaType === 'video' && d.videoUrl) {
      // Clear any slideshow interval
      if (window.heroSliderInterval) {
        clearInterval(window.heroSliderInterval);
        window.heroSliderInterval = null;
      }
      let existingDots = heroEl ? heroEl.querySelector('.hero-dots') : null;
      if (existingDots) existingDots.remove();

      // Create video element
      const video = document.createElement('video');
      video.src = d.videoUrl;
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.className = 'hero-video';
      video.style.position = 'absolute';
      video.style.inset = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.zIndex = '0';
      heroBg.appendChild(video);

      // Force play and catch any browser restrictions
      video.load();
      video.play().catch(function(err) {
        console.warn('Autoplay prevented or video play failed, re-trying muted play:', err);
        video.muted = true;
        video.play().catch(function(e) {
          console.error('Video playback completely failed:', e);
        });
      });
    } else {
      const slideSources = bgImages.length > 0 ? bgImages : ['hero_banner.jpg'];
      imgs = slideSources.map((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Hero Slide ${index + 1}`;
        img.className = 'hero-img';
        img.style.position = 'absolute';
        img.style.inset = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.transition = 'opacity 1.2s ease-in-out, transform 8s ease-out';
        img.style.opacity = index === 0 ? '1' : '0';
        img.style.transform = index === 0 ? 'scale(1.05)' : 'scale(1)';
        img.style.zIndex = '0';
        heroBg.appendChild(img);
        return img;
      });
    }

    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.className = 'hero-overlay';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.zIndex = '1';
    heroBg.appendChild(overlay);

    // Apply overlay styles and trigger adaptive theme
    const type = d.overlayType || 'white';
    const opacityPct = d.overlayOpacity !== undefined ? d.overlayOpacity : (type === 'dark' ? 40 : 80);
    const opacity = opacityPct / 100;

    if (type === 'dark') {
      overlay.style.background = `linear-gradient(135deg, rgba(15, 23, 42, ${opacity}) 0%, rgba(15, 23, 42, ${Math.max(0, opacity - 0.15)}) 100%)`;
      if (heroEl) {
        heroEl.classList.add('hero-dark-overlay');
      }
    } else {
      overlay.style.background = `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}) 0%, rgba(255, 255, 255, ${Math.max(0, opacity - 0.15)}) 100%)`;
      if (heroEl) {
        heroEl.classList.remove('hero-dark-overlay');
      }
    }

    // Set up slideshow interval if multiple images (and not in video mode)
    if (d.mediaType !== 'video' && imgs.length > 1) {
      // Manage pagination dots (remove any that exist)
      let existingDots = heroEl ? heroEl.querySelector('.hero-dots') : null;
      if (existingDots) existingDots.remove();

      let currentIdx = 0;
      
      function goToSlide(nextIdx) {
        // Fade out current slide
        imgs[currentIdx].style.opacity = '0';
        imgs[currentIdx].style.transform = 'scale(1)';

        // Fade in next slide with scale
        imgs[nextIdx].style.opacity = '1';
        imgs[nextIdx].style.transform = 'scale(1.05)';

        currentIdx = nextIdx;
      }

      if (window.heroSliderInterval) {
        clearInterval(window.heroSliderInterval);
      }
      
      window.heroSliderInterval = setInterval(() => {
        const nextIdx = (currentIdx + 1) % imgs.length;
        goToSlide(nextIdx);
      }, 5000);
    } else {
      // Clear any existing slideshow intervals and dots if only 1 slide or in video mode
      if (window.heroSliderInterval) {
        clearInterval(window.heroSliderInterval);
        window.heroSliderInterval = null;
      }
      let existingDots = heroEl ? heroEl.querySelector('.hero-dots') : null;
      if (existingDots) existingDots.remove();
    }
  }
}

// ─── Services ────────────────────────────────────────────────
function applyServices(d) {
  if (!d.items || d.items.length === 0) return;
  const accordionContainer = document.getElementById('services-accordion');
  
  if (accordionContainer) {
    const defaultIcons = {
      industrial: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      equipment: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      civil: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg>`,
      ppe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    };
    const defaultIconsBig = {
      industrial: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      equipment: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      civil: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg>`,
      ppe: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
    };
    const defaultImages = {
      industrial: 'industrial_trading.jpg',
      equipment: 'equipment_rental.jpg',
      civil: 'civil_material.jpg',
      ppe: 'ppe_items.jpg'
    };
    const defaultSublists = {
      industrial: `<li>Civil Construction Items</li><li>Mechanical Components</li><li>Electrical Equipment</li><li>Pipes, Valves &amp; Fittings</li>`,
      equipment: `<li>Excavators &amp; Backhoes</li><li>Mobile Cranes &amp; Boom Lifts</li><li>Forklifts &amp; Skid Steers</li><li>Compactors &amp; Rollers</li>`,
      civil: `<li>Cement &amp; Aggregates</li><li>Steel Rebar &amp; Mesh</li><li>Sand, Gravel &amp; Blocks</li><li>Formwork &amp; Scaffolding</li>`,
      ppe: `<li>Safety Helmets &amp; Goggles</li><li>Hi-Vis Vests &amp; Coveralls</li><li>Gloves &amp; Safety Shoes</li><li>Fall Protection Gear</li>`
    };
    const defaultBadges = {
      industrial: 'Industrial Supplies',
      equipment: 'Heavy Equipment Rentals',
      civil: 'Civil Slabs &amp; Paving Stones',
      ppe: 'PPE Safety Materials'
    };

    // Get current active key from existing elements if any, else default to the first
    const activeItem = accordionContainer.querySelector('.accordion-item.active');
    const prevActiveKey = activeItem ? activeItem.dataset.service : null;
    let activeKey = prevActiveKey || d.items[0].key || 'industrial';
    
    // Ensure the active key actually exists in the new items; if not, fallback to the first item
    const exists = d.items.some((svc, i) => (svc.key || (i === 0 ? 'industrial' : i === 1 ? 'equipment' : i === 2 ? 'civil' : i === 3 ? 'ppe' : 'service-' + i)) === activeKey);
    if (!exists) {
      activeKey = d.items[0].key || 'industrial';
    }

    accordionContainer.innerHTML = d.items.map((svc, i) => {
      const key = svc.key || (i === 0 ? 'industrial' : i === 1 ? 'equipment' : i === 2 ? 'civil' : i === 3 ? 'ppe' : 'service-' + i);
      const imgUrl = svc.imageUrl || defaultImages[key] || 'industrial_trading.jpg';
      const iconSvg = defaultIcons[key] || `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
      const iconSvgBig = defaultIconsBig[key] || `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
      const listHtml = defaultSublists[key] || `<li>Premium Solutions</li><li>Compliance Guaranteed</li><li>24/7 Support Desk</li>`;
      const badgeText = defaultBadges[key] || 'Specialized Sourcing';
      const isActive = key === activeKey;

      const isVideo = imgUrl.toLowerCase().endsWith('.mp4') || imgUrl.toLowerCase().endsWith('.webm') || imgUrl.toLowerCase().endsWith('.ogg') || imgUrl.startsWith('data:video');
      const mediaHtml = isVideo 
        ? `<video src="${imgUrl}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
        : `<img src="${imgUrl}" alt="${svc.title || ''}" loading="lazy" />`;

      return `
        <div class="accordion-item ${isActive ? 'active' : ''}" id="accordion-item-${key}" data-service="${key}">
          <button class="accordion-header" aria-expanded="${isActive ? 'true' : 'false'}" aria-controls="accordion-panel-${key}">
            <span class="accordion-trigger-left">
              <span class="accordion-header-icon">
                ${iconSvg}
              </span>
              <span class="accordion-header-title">${svc.title || ''}</span>
            </span>
            <span class="accordion-chevron">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </button>
          <div class="accordion-collapse" id="accordion-panel-${key}">
            <div class="accordion-content">
              <div class="accordion-inner-body">
                <div class="service-showcase">
                  <div class="service-showcase-img-wrap">
                    ${mediaHtml}
                    <div class="service-showcase-badge">${badgeText}</div>
                  </div>
                  <div class="service-showcase-content">
                    <div class="service-showcase-header">
                      <div class="service-showcase-icon">
                        ${iconSvgBig}
                      </div>
                      <h3>${svc.title || ''}</h3>
                    </div>
                    <p>${svc.desc || ''}</p>
                    <div class="service-showcase-list-wrap">
                      <h4>Key Core Capabilities:</h4>
                      <ul class="service-list">
                        ${listHtml}
                      </ul>
                    </div>
                    <a href="#contact" class="btn btn-primary" id="service-btn-${key}">Request Quote →</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${i < d.items.length - 1 ? '<div class="accordion-divider"></div>' : ''}
      `;
    }).join('');

    reObserve();
  }
}

// Global delegated click listener for services accordion headers
document.addEventListener('click', (e) => {
  const header = e.target.closest('.accordion-header');
  if (header) {
    const item = header.closest('.accordion-item');
    if (item) {
      const isActive = item.classList.contains('active');
      const serviceKey = item.dataset.service;
      
      // Traditional accordion toggle: close all others, toggle clicked one
      document.querySelectorAll('.accordion-item').forEach(accItem => {
        const isThisItem = accItem === item;
        if (isThisItem) {
          const nextActive = !isActive;
          accItem.classList.toggle('active', nextActive);
          const btn = accItem.querySelector('.accordion-header');
          if (btn) btn.setAttribute('aria-expanded', nextActive.toString());
        } else {
          accItem.classList.remove('active');
          const btn = accItem.querySelector('.accordion-header');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Send interaction metrics to parent window
      const title = item.querySelector('.accordion-header-title')?.textContent || serviceKey;
      if (!isActive) {
        try {
          window.parent?.postMessage({ type: 'frontend-interaction', log: `Expanded Service Accordion: "${title}"` }, '*');
        } catch (err) {}
      }
    }
  }
});

// ─── Contact ─────────────────────────────────────────────────
function applyContact(d) {
  setAll('.contact-phone-val', d.phone);
  setAll('.contact-email-val', d.email);
  setAll('.contact-address-val', d.address);
  setAll('.contact-hours-val', d.hours);

  // Apply contact image if available
  const contactImg = document.getElementById('contact-image');
  const contactImgWrap = document.getElementById('contact-image-wrap');
  if (contactImg && contactImgWrap) {
    if (d.imageUrl) {
      contactImg.src = d.imageUrl;
      contactImgWrap.style.display = 'block';
    } else {
      contactImgWrap.style.display = 'none';
    }
  }

  // Social links
  const linkMap = {
    facebook:  d.social?.facebook,
    linkedin:  d.social?.linkedin,
    instagram: d.social?.instagram,
  };
  Object.entries(linkMap).forEach(([key, url]) => {
    if (url) {
      document.querySelectorAll(`[id*="social-${key}"], [id*="footer-${key.slice(0,2)}"]`).forEach(a => { a.href = url; });
    }
  });
  if (d.social?.whatsapp) {
    const wa = d.social.whatsapp.replace(/\D/g,'');
    document.querySelectorAll('[id*="whatsapp"]').forEach(a => { if (a.tagName === 'A') a.href = `https://wa.me/${wa}`; });
  }
}

// ─── Theme ───────────────────────────────────────────────────
function applyTheme(d) {
  const root = document.documentElement;
  if (d.primaryColor) {
    root.style.setProperty('--color-primary', d.primaryColor);
    root.style.setProperty('--color-primary-dark', adjustColor(d.primaryColor, -20));
  }
  if (d.accentColor) {
    root.style.setProperty('--color-accent', d.accentColor);
  }
  if (d.headerBg) {
    root.style.setProperty('--header-bg', d.headerBg);
  }
  if (d.font) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${d.font.replace(' ', '+')}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
    document.body.style.fontFamily = `'${d.font}', sans-serif`;
  }
  if (d.fontSizeBase) {
    let size = '16px';
    if (d.fontSizeBase === 'small') size = '14px';
    else if (d.fontSizeBase === 'normal') size = '16px';
    else if (d.fontSizeBase === 'large') size = '18px';
    else if (d.fontSizeBase === 'xlarge') size = '20px';
    root.style.fontSize = size;
  }
  if (d.menuTextSize) {
    let size = '14px';
    let mobSize = '16px';
    if (d.menuTextSize === 'small') {
      size = '12px';
      mobSize = '14px';
    } else if (d.menuTextSize === 'normal') {
      size = '14px';
      mobSize = '16px';
    } else if (d.menuTextSize === 'large') {
      size = '16px';
      mobSize = '18px';
    } else if (d.menuTextSize === 'xlarge') {
      size = '18px';
      mobSize = '20px';
    }
    document.querySelectorAll('.nav-link').forEach(el => {
      el.style.setProperty('font-size', size, 'important');
    });
    document.querySelectorAll('.mobile-nav-link').forEach(el => {
      el.style.setProperty('font-size', mobSize, 'important');
    });
  }
  if (d.sectionColors) {
    const sectionIdsMap = {
      hero: ['home', '.hero'],
      services: ['services', '#services'],
      about: ['about', '#about'],
      products: ['products', '#products'],
      why: ['why-us', '#why-us'],
      process: ['process', '#process'],
      contact: ['contact', '#contact']
    };
    Object.entries(d.sectionColors).forEach(([sectionId, colors]) => {
      const selectors = sectionIdsMap[sectionId] || [sectionId];
      selectors.forEach(sel => {
        let el = document.getElementById(sel);
        if (!el) {
          el = document.querySelector(sel);
        }
        if (el) {
          if (colors.bgImage) {
            el.style.setProperty('background-image', `url("${colors.bgImage}")`, 'important');
            el.style.setProperty('background-size', 'cover', 'important');
            el.style.setProperty('background-position', 'center', 'important');
            el.style.setProperty('background-repeat', 'no-repeat', 'important');
            if (colors.bg) {
              el.style.setProperty('background-color', colors.bg, 'important');
            }
          } else {
            el.style.setProperty('background-image', 'none', 'important');
            if (colors.bg) {
              el.style.setProperty('background', colors.bg, 'important');
              el.style.setProperty('background-color', colors.bg, 'important');
            }
          }
          if (colors.text) {
            el.style.setProperty('color', colors.text, 'important');
            el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, label').forEach(child => {
              if (!child.closest('.btn') && !child.closest('.logo-name')) {
                child.style.setProperty('color', colors.text, 'important');
              }
            });
            el.querySelectorAll('.section-subtitle, .section-desc, .text-muted, p').forEach(child => {
              child.style.setProperty('color', colors.text, 'important');
              child.style.setProperty('opacity', '0.85', 'important');
            });
          }
        }
      });
    });
  }

  // ─── Dynamic Glassmorphism Effects ───
  function isColorLight(hex) {
    if (!hex || !hex.startsWith('#')) return false;
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16);
    const g = ((num >> 8) & 0xff);
    const b = (num & 0xff);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return yiq >= 128;
  }

  if (d.glassEffects === true) {
    document.body.classList.add('glass-sections');
    
    const sectionIdsMap = {
      hero: ['.hero-stats'],
      services: ['.service-card'],
      why: ['.why-card'],
      whyChoose: ['.why-card'],
      process: ['.process-steps'],
      products: ['.product-card'],
      about: ['.about-badge-card'],
      contact: ['.contact-form-wrap']
    };
    
    Object.entries(sectionIdsMap).forEach(([secId, cardSelectors]) => {
      const colors = d.sectionColors?.[secId];
      const isLight = colors && colors.bg ? isColorLight(colors.bg) : false;
      
      cardSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(card => {
          if (isLight) {
            card.classList.add('glass-light');
            card.classList.remove('glass-dark');
          } else {
            card.classList.add('glass-dark');
            card.classList.remove('glass-light');
          }
        });
      });
    });
  } else {
    document.body.classList.remove('glass-sections');
    document.querySelectorAll('.service-card, .why-card, .product-card, .process-steps, .hero-stats, .about-badge-card, .contact-form-wrap').forEach(card => {
      card.classList.remove('glass-light', 'glass-dark');
    });
  }

  // Cache original HTML of logo-icon and original text of logo-name if not already cached
  document.querySelectorAll('.logo-icon').forEach(el => {
    if (!el.hasAttribute('data-original-html')) {
      el.setAttribute('data-original-html', el.innerHTML);
    }
  });
  document.querySelectorAll('.logo-name').forEach(el => {
    if (!el.hasAttribute('data-original-text')) {
      el.setAttribute('data-original-text', el.textContent);
    }
  });

  // Apply custom logo text if available
  if (d.logoText) {
    document.querySelectorAll('.logo-name').forEach(el => {
      el.textContent = d.logoText;
    });
  } else {
    document.querySelectorAll('.logo-name').forEach(el => {
      const orig = el.getAttribute('data-original-text');
      if (orig) el.textContent = orig;
    });
  }

  // Apply custom logo image if available, else restore original icon/SVG
  const logoHeightVal = d.logoSize || 36;
  if (d.logoUrl) {
    document.querySelectorAll('.logo-icon').forEach(el => {
      el.innerHTML = `<img src="${d.logoUrl}" alt="Company Logo" style="height:${logoHeightVal}px; width:auto; object-fit:contain;" />`;
    });
  } else {
    document.querySelectorAll('.logo-icon').forEach(el => {
      const orig = el.getAttribute('data-original-html');
      if (orig) el.innerHTML = orig;
      const svg = el.querySelector('svg');
      if (svg) {
        svg.style.height = `${logoHeightVal}px`;
        svg.style.width = 'auto';
        svg.setAttribute('height', logoHeightVal);
        svg.setAttribute('width', logoHeightVal);
      }
    });
  }

  // Handle Logo Display Mode (logoType: 'text' | 'image' | 'both')
  const displayMode = d.logoType || 'both';
  document.querySelectorAll('.logo-icon').forEach(el => {
    if (displayMode === 'text') {
      el.style.setProperty('display', 'none', 'important');
    } else {
      el.style.setProperty('display', '', 'important');
    }
  });
  document.querySelectorAll('.logo-name').forEach(el => {
    if (displayMode === 'image') {
      el.style.setProperty('display', 'none', 'important');
    } else {
      el.style.setProperty('display', '', 'important');
    }
  });

  // Toggles
  if (d.toggles) {
    const topbar = document.getElementById('topbar');
    const ticker = document.querySelector('.ticker-wrap');
    const heroStats = document.querySelector('.hero-stats');
    const whatsapp = document.getElementById('whatsapp-float-btn');
    const process = document.getElementById('process');

    if (topbar) {
      topbar.style.display = d.toggles.topbar === false ? 'none' : '';
    }
    if (ticker) {
      ticker.style.display = d.toggles.ticker === false ? 'none' : '';
    }
    if (heroStats) {
      heroStats.style.display = d.toggles.stats === false ? 'none' : '';
    }
    if (whatsapp) {
      whatsapp.style.display = d.toggles.whatsapp === false ? 'none' : '';
    }
    if (process) {
      process.style.display = d.toggles.process === false ? 'none' : '';
    }
  }

  // Footer Customization
  if (d.footer) {
    const footerEl = document.querySelector('.footer');
    if (footerEl) {
      if (d.footer.bg) {
        footerEl.style.setProperty('background', d.footer.bg, 'important');
        footerEl.style.setProperty('background-color', d.footer.bg, 'important');
      }
      if (d.footer.text) {
        footerEl.style.setProperty('color', d.footer.text, 'important');
        footerEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, label').forEach(child => {
          if (!child.closest('.btn') && !child.closest('.logo-name')) {
            child.style.setProperty('color', d.footer.text, 'important');
          }
        });
        footerEl.querySelectorAll('.footer-brand-desc, .footer-contact-list a, .footer-bottom-inner p, .footer-bottom-links a').forEach(child => {
          child.style.setProperty('color', d.footer.text, 'important');
          child.style.setProperty('opacity', '0.85', 'important');
        });
      }
      if (d.footer.iconColor) {
        footerEl.style.setProperty('--color-primary', d.footer.iconColor, 'important');
        footerEl.querySelectorAll('.footer-social-btn').forEach(btn => {
          btn.style.setProperty('color', d.footer.iconColor, 'important');
          btn.style.setProperty('border-color', d.footer.iconColor + '50', 'important');
        });
      }
    }

    // brandDesc
    const footerBrandDescEl = document.querySelector('.footer-brand-desc');
    if (footerBrandDescEl && d.footer.brandDesc !== undefined) {
      footerBrandDescEl.textContent = d.footer.brandDesc;
    }

    // copyright
    const footerCopyrightEl = document.querySelector('.footer-copyright-text');
    if (footerCopyrightEl && d.footer.copyright !== undefined) {
      footerCopyrightEl.textContent = d.footer.copyright;
    }

    // showSocial
    const footerSocialEl = document.querySelector('.footer-social');
    if (footerSocialEl) {
      if (d.footer.showSocial === false) {
        footerSocialEl.style.setProperty('display', 'none', 'important');
      } else {
        footerSocialEl.style.setProperty('display', 'flex', 'important');
      }
    }

    // showLogo
    const footerLogoEl = document.querySelector('.footer-brand-logo-wrap, .footer-brand .logo');
    if (footerLogoEl) {
      if (d.footer.showLogo === false) {
        footerLogoEl.style.setProperty('display', 'none', 'important');
      } else {
        footerLogoEl.style.setProperty('display', 'flex', 'important');
      }
    }
  }

  // Preloader styling and animation config
  applyPreloader(d.preloader, d);

  // Save to local storage for instant preloader hydration on next reload
  try {
    localStorage.setItem('stonex_theme_config', JSON.stringify(d));
  } catch (e) {
    console.warn('Failed to cache theme config in local storage:', e);
  }
}

// ─── Preloader Helper ────────────────────────────────────────
function applyPreloader(preloader, themeConfig) {
  const preloaderEl = document.getElementById('site-preloader');
  if (!preloaderEl) return;

  // 1. Check if disabled
  if (preloader && preloader.showPreloader === false) {
    preloaderEl.classList.add('fade-out');
    return;
  }

  // 1.5 Handle Backdrop theme & Custom backdrop colors
  const themeMap = {
    'black': '#000000',
    'white': '#000000',
    'dark-slate': '#0f172a',
    'midnight-blue': '#0b0f19',
    'deep-navy': '#020617',
    'charcoal': '#1e1e1e',
    'indigo': '#1e1b4b',
    'violet': '#2e1065',
    'teal': '#042f2e'
  };
  
  const selectedTheme = (preloader && preloader.preloaderTheme) || 'black';
  const bgHex = themeMap[selectedTheme] || selectedTheme;
  
  preloaderEl.style.setProperty('background', bgHex, 'important');
  preloaderEl.style.setProperty('background-color', bgHex, 'important');

  const isWhite = selectedTheme === 'white';
  if (isWhite) {
    preloaderEl.classList.add('theme-white');
  } else {
    preloaderEl.classList.remove('theme-white');
  }

  // 2. Dynamic logo
  const logoContainer = document.getElementById('preloader-logo-container');
  if (logoContainer) {
    let logoUrl = '';
    if (preloader && preloader.preloaderLogoUrl) {
      logoUrl = preloader.preloaderLogoUrl;
    } else if (themeConfig && themeConfig.logoUrl) {
      logoUrl = themeConfig.logoUrl;
    }

    const animType = (preloader && preloader.preloaderAnimation) || 'pulse';
    let animClass = 'preloader-logo-pulse';
    if (animType === 'spin') animClass = 'preloader-logo-spin';
    else if (animType === 'glow') animClass = 'preloader-logo-glow';
    else if (animType === 'bounce') animClass = 'preloader-logo-bounce';
    else if (animType === 'flip') animClass = 'preloader-logo-flip';

    const textFallbackColor = isWhite ? '#0f172a' : '#ffffff';

    if (logoUrl) {
      logoContainer.innerHTML = `<img src="${logoUrl}" alt="Loading Logo" class="${animClass}" style="height: 70px; width: auto; object-fit: contain;" />`;
    } else if (themeConfig && themeConfig.logoText) {
      logoContainer.innerHTML = `<span class="${animClass}" style="font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: ${textFallbackColor}; letter-spacing: 0.1em; display: inline-block;">${themeConfig.logoText}</span>`;
    } else {
      const defaultSvg = document.getElementById('preloader-default-svg');
      if (defaultSvg) {
        defaultSvg.className = '';
        defaultSvg.classList.add(animClass);
        if (isWhite) {
          defaultSvg.style.color = '#0f172a';
          defaultSvg.querySelectorAll('polygon').forEach(p => p.setAttribute('fill', '#0f172a'));
        } else {
          defaultSvg.style.color = '';
          defaultSvg.querySelectorAll('polygon').forEach(p => p.setAttribute('fill', 'url(#preloaderLogoGrad)'));
        }
      }
    }
  }

  // 3. Dynamic progress style
  const indicatorBox = document.getElementById('preloader-indicator-box');
  if (indicatorBox) {
    const styleType = (preloader && preloader.preloaderStyle) || 'linear';
    if (styleType === 'linear') {
      indicatorBox.innerHTML = `<div class="preloader-bar"><div class="preloader-bar-fill"></div></div>`;
    } else if (styleType === 'circle') {
      indicatorBox.innerHTML = `<div class="preloader-spinner"></div>`;
    } else {
      indicatorBox.innerHTML = '';
    }
  }
}

// ─── Announcements ───────────────────────────────────────────
function applyAnnouncements(d) {
  if (!d.items || !d.items.length) return;
  const tickerInner = document.querySelector('.ticker-items');
  if (!tickerInner) return;
  const html = d.items.map(t => `<span>${t}</span>`).join('');
  document.querySelectorAll('.ticker-items').forEach(el => el.innerHTML = html);
}

// ─── Why Choose Us ───────────────────────────────────────────
const defaultWhyIcons = [
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
];
const defaultStarIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

function applyWhyChoose(d) {
  if (!d.items || d.items.length === 0) return;
  const whyGrid = document.querySelector('.why-grid');
  if (whyGrid) {
    whyGrid.innerHTML = d.items.map((item, i) => {
      let iconHtml = defaultWhyIcons[i] || defaultStarIcon;
      if (item.imageUrl) {
        const isVideo = item.imageUrl.toLowerCase().endsWith('.mp4') || item.imageUrl.toLowerCase().endsWith('.webm') || item.imageUrl.toLowerCase().endsWith('.ogg') || item.imageUrl.startsWith('data:video');
        if (isVideo) {
          iconHtml = `<video src="${item.imageUrl}" autoplay muted loop playsinline style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;"></video>`;
        } else {
          iconHtml = `<img src="${item.imageUrl}" alt="${item.title || ''}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" />`;
        }
      }
      return `
        <div class="why-card" id="why-card-${i + 1}">
          <div class="why-icon" style="overflow: hidden; display: flex; align-items: center; justify-content: center; ${item.imageUrl ? 'padding: 0;' : ''}">
            ${iconHtml}
          </div>
          <h3>${item.title || ''}</h3>
          <p>${item.desc || ''}</p>
        </div>
      `;
    }).join('');
    reObserve();
  }
}

function reObserve() {
  if (typeof revealObserver !== 'undefined' && revealObserver) {
    document.querySelectorAll('.service-card, .why-card, .process-step, .about-feature, .product-card, .stat-card-item').forEach(el => {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
        revealObserver.observe(el);
      }
    });
  }
}

// ─── Process ─────────────────────────────────────────────────
function applyProcess(d) {
  if (!d.items || d.items.length === 0) return;
  const processStepsContainer = document.querySelector('.process-steps');
  if (processStepsContainer) {
    processStepsContainer.innerHTML = d.items.map((item, i) => {
      const stepNum = String(i + 1).padStart(2, '0');
      return `
        <div class="process-step" id="process-step-${i + 1}">
          <div class="step-num-col">
            <span class="step-huge-num">${stepNum}</span>
            <div class="step-curve"></div>
          </div>
          <div class="step-title-col">
            <h3 class="step-row-title">${item.title || ''}</h3>
          </div>
          <div class="step-desc-col">
            <p class="step-row-desc">${item.desc || ''}</p>
          </div>
        </div>
      `;
    }).join('');
    reObserve();
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function setAll(selector, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach(el => el.textContent = value);
  // Also update href for emails/phones
  document.querySelectorAll(`a${selector}`).forEach(a => {
    if (a.href.startsWith('mailto:')) a.href = `mailto:${value}`;
    else if (a.href.startsWith('tel:')) a.href = `tel:${value.replace(/\s/g,'')}`;
  });
}

function updateCounter(id, target) {
  const el = document.getElementById(id);
  if (el) {
    el.setAttribute('data-count', target);
    el.textContent = Number(target).toLocaleString();
  }
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ════════════════════════════════════════════════════════════════
//  STATIC UI LOGIC (runs regardless of Firebase)
// ════════════════════════════════════════════════════════════════

// ─── Navbar scroll ───────────────────────────────────────────
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ─── Mobile hamburger ────────────────────────────────────────
const hamburger  = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
    mobileMenu.setAttribute('aria-hidden', !open);
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
  
  // Close button listener
  const closeBtn = document.getElementById('close-mobile-menu-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  }
}

// ─── Product Tabs ────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
  });
});

// ─── Smooth scroll for nav links ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = header ? header.offsetHeight : 0;
      window.scrollTo({ top: target.offsetTop - offset - 8, behavior: 'smooth' });
    }
  });
});

// ─── Hero Scroll Down click handler ──────────────────────────
const scrollIndicator = document.querySelector('.hero-scroll-indicator');
if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const target = document.querySelector('#services');
    if (target) {
      const offset = header ? header.offsetHeight : 0;
      window.scrollTo({ top: target.offsetTop - offset - 8, behavior: 'smooth' });
    }
  });
}

// ─── Active nav highlight ────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

// ─── Counter animation ───────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.count || el.textContent, 10);
    if (isNaN(target)) return;
    if (el.getAttribute('data-animated-target') === String(target)) return;
    el.setAttribute('data-animated-target', target);
    
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}
const heroSection = document.getElementById('home');
if (heroSection) {
  const heroObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
  }, { threshold: 0.3 });
  heroObs.observe(heroSection);
}

// ─── Back to top ─────────────────────────────────────────────
const bttBtn = document.getElementById('back-to-top-btn');
window.addEventListener('scroll', () => {
  if (bttBtn) bttBtn.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
if (bttBtn) bttBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ─── Contact form & Floating Service Menu ───────────────────────
const quoteButtons = document.querySelectorAll('.quote-menu-btn');
const contactServiceSelect = document.getElementById('contact-service');
const selectedServiceText = document.getElementById('quote-selected-service-text');
const contactMessageTextarea = document.getElementById('contact-message');

const serviceDisplayNames = {
  'industrial-trading': 'Industrial Trading',
  'equipment-rental': 'Heavy Equipment Rental',
  'civil-material': 'Civil Material Supply',
  'ppe': 'PPE Items',
  'multiple': 'Multiple Services'
};

const servicePlaceholders = {
  'industrial-trading': 'List the industrial trading items, specifications, or quantities you need...',
  'equipment-rental': 'List the rental equipment required, duration of hire, and mobilization site details...',
  'civil-material': 'List civil materials needed (aggregates, sand, road-base, sub-base) and tonnage required...',
  'ppe': 'List the PPE items, safety wear, or tools needed and quantities...',
  'multiple': 'Describe your requirements across multiple divisions in detail...'
};

if (quoteButtons && contactServiceSelect) {
  quoteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // 1. Set active class
      quoteButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 2. Update select value
      const serviceVal = btn.getAttribute('data-service');
      contactServiceSelect.value = serviceVal;

      // 3. Update active text display with premium animations
      if (selectedServiceText) {
        selectedServiceText.innerHTML = `Interested in: <strong class="highlight-service">${serviceDisplayNames[serviceVal] || serviceVal}</strong>`;
      }

      // 4. Update textarea placeholder dynamically
      if (contactMessageTextarea && servicePlaceholders[serviceVal]) {
        contactMessageTextarea.placeholder = servicePlaceholders[serviceVal];
      }

      // 5. Trigger transition animations inside form fields
      const formFields = document.querySelectorAll('.contact-form .form-row, .contact-form .form-group, .contact-form button, .contact-form .form-note, .form-header-wrap');
      formFields.forEach(field => {
        field.style.animation = 'none';
        // Force reflow
        void field.offsetWidth;
        field.style.animation = 'quoteContentAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) both';
      });
    });
  });
}

// Global delegated listener for Request Quote clicks in Services section
document.addEventListener('click', (e) => {
  const serviceBtn = e.target.closest('[id^="service-btn-"]');
  if (serviceBtn) {
    const btnId = serviceBtn.id;
    let targetService = '';
    if (btnId.includes('industrial')) targetService = 'industrial-trading';
    else if (btnId.includes('equipment')) targetService = 'equipment-rental';
    else if (btnId.includes('civil')) targetService = 'civil-material';
    else if (btnId.includes('ppe')) targetService = 'ppe';
    
    if (targetService) {
      const quoteTab = document.querySelector(`.quote-menu-btn[data-service="${targetService}"]`);
      if (quoteTab) {
        quoteTab.click();
      }
    }
  }
});

const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    if (btn) { btn.innerHTML = '<span class="btn-text">Sending…</span>'; btn.disabled = true; }
    // Simulate (or replace with emailjs / Firebase Functions)
    await new Promise(r => setTimeout(r, 1200));
    contactForm.style.display = 'none';
    if (formSuccess) formSuccess.hidden = false;
  });
}

// ─── Custom Chatbot Logic ────────────────────────────────────
const chatFloat = document.getElementById('whatsapp-float-btn');
const chatContainer = document.getElementById('chatbot-container');
const chatClose = document.getElementById('chatbot-close-btn');
const chatForm = document.getElementById('chatbot-form');
const chatSuccess = document.getElementById('chat-success');
const chatSubmitBtn = document.getElementById('chat-submit-btn');

if (chatFloat && chatContainer && chatClose) {
  chatFloat.addEventListener('click', (e) => {
    e.preventDefault();
    chatContainer.style.display = window.getComputedStyle(chatContainer).display === 'none' ? 'flex' : 'none'; console.log('Chatbot toggled', chatContainer.style.display);
  });
  chatClose.addEventListener('click', () => {
    chatContainer.style.display = 'none';
  });
}

if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (chatSubmitBtn) {
      chatSubmitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
      chatSubmitBtn.disabled = true;
    }
    
    const name = document.getElementById('chat-name').value;
    const email = document.getElementById('chat-email').value;
    const phone = document.getElementById('chat-phone').value;
    
    try {
      await addDoc(collection(db, 'chatbot_leads'), {
        name, email, phone, timestamp: new Date().toISOString()
      });
      chatForm.style.display = 'none';
      if (chatSuccess) chatSuccess.style.display = 'block';
    } catch (err) {
      console.error("Chat lead save failed:", err);
      if (chatSubmitBtn) {
        chatSubmitBtn.innerHTML = '<span class="btn-text">Send Message</span>';
        chatSubmitBtn.disabled = false;
      }
    }
  });
}

// ─── Shipment Tracking Modal & Firebase Integration ───────────
function initTrackingModal() {
  const openBtn = document.getElementById('nav-track-btn');
  const mobileOpenBtn = document.getElementById('mobile-nav-track');
  const floatOpenBtn = document.getElementById('tracking-float-btn');
  const modal = document.getElementById('tracking-modal');
  const closeBtn = document.getElementById('close-tracking-modal');
  const searchForm = document.getElementById('tracking-search-form');
  const trackingInput = document.getElementById('tracking-input');
  const loadingDiv = document.getElementById('tracking-loading');
  const errorDiv = document.getElementById('tracking-error');
  const resultDiv = document.getElementById('tracking-result');

  if (!modal) return;

  // Open modal
  const openModal = () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    trackingInput.focus();
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      if (hamburgerBtn) {
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    }
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (mobileOpenBtn) mobileOpenBtn.addEventListener('click', openModal);
  if (floatOpenBtn) floatOpenBtn.addEventListener('click', openModal);

  // Close modal
  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Reset state
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
    trackingInput.value = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Track search action
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = trackingInput.value.trim();
    if (!query) return;

    // Reset layout
    errorDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
      // Get shipments document
      const snap = await getDoc(doc(db, 'siteConfig', 'logistics'));
      
      let shipments = [];
      if (snap.exists() && snap.data().shipments) {
        shipments = snap.data().shipments;
      }

      // Find shipment by tracking, order, or ID
      const queryLower = query.toLowerCase();
      const found = shipments.find(s => 
        (s.trackingNumber && s.trackingNumber.toLowerCase() === queryLower) ||
        (s.orderId && s.orderId.toLowerCase() === queryLower) ||
        (s.id && s.id.toLowerCase() === queryLower)
      );

      loadingDiv.style.display = 'none';

      if (!found) {
        errorDiv.textContent = `No active shipment found matching "${query}". Verify your tracking ID / order ID and try again.`;
        errorDiv.style.display = 'block';
        return;
      }

      // Found shipment! Populate modal contents
      const statusBadge = document.getElementById('tracking-result-status-badge');
      const orderIdEl = document.getElementById('tracking-result-order-id');
      const refEl = document.getElementById('tracking-result-ref');
      const carrierEl = document.getElementById('tracking-result-carrier');
      const methodEl = document.getElementById('tracking-result-method');
      const destEl = document.getElementById('tracking-result-destination');
      const addressEl = document.getElementById('tracking-result-address');
      const specsEl = document.getElementById('tracking-result-specs');
      const createdEl = document.getElementById('tracking-result-created');
      const milestoneContainer = document.getElementById('tracking-milestones-container');

      // 1. Badge status styles
      statusBadge.textContent = found.status;
      if (found.status === 'Delivered') {
        statusBadge.style.background = '#e6fffa';
        statusBadge.style.color = '#00875a';
        statusBadge.style.border = '1px solid #b2f5ea';
      } else if (found.status === 'Out for Delivery') {
        statusBadge.style.background = '#e0f2fe';
        statusBadge.style.color = '#0369a1';
        statusBadge.style.border = '1px solid #bae6fd';
      } else if (found.status === 'Exception / Delay') {
        statusBadge.style.background = '#fef2f2';
        statusBadge.style.color = '#b91c1c';
        statusBadge.style.border = '1px solid #fecaca';
      } else { // In Transit, Label Created, etc.
        statusBadge.style.background = '#eef2f6';
        statusBadge.style.color = '#334155';
        statusBadge.style.border = '1px solid #cbd5e1';
      }

      // 2. Info text fields
      orderIdEl.textContent = `Order #${found.orderId || 'N/A'}`;
      refEl.textContent = found.trackingNumber || found.id || 'N/A';
      carrierEl.textContent = found.carrier || 'Stonex Delivery';
      methodEl.textContent = found.shippingMethod || 'Standard Dispatch';
      destEl.textContent = found.recipient || 'Stonex Project Site';
      addressEl.textContent = found.destination || 'Delivery Location';
      specsEl.textContent = `${found.weight || 'Standard Cargo'} / ${found.dimensions || 'Bulk Supply'}`;
      createdEl.textContent = `Registered: ${found.createdDate || 'Recently'}`;

      // 3. Milestones Timeline
      const milestoneVal = Number(found.milestone ?? 0);
      const steps = [
        { key: 0, title: 'Label Created / Registered', desc: 'Stonex booked cargo dispatch reservation. Ready for handoff.' },
        { key: 1, title: 'Picked Up by Carrier', desc: `Cargo picked up by ${found.carrier || 'Logistics Partner'} and departed Stonex yard.` },
        { key: 2, title: 'Sorting & Loading Hub', desc: 'Processed through departure sorting terminal and loaded on heavy carrier.' },
        { key: 3, title: 'In Transit', desc: 'Cargo dispatched and en route to client delivery address.' },
        { key: 4, title: 'Out for Delivery', desc: 'Cargo arrived at local destination hub. Dispatched for final dropoff.' },
        { key: 5, title: 'Successfully Delivered', desc: 'Delivery completed. Cargo accepted and inspected by client representative.' }
      ];

      milestoneContainer.innerHTML = steps.map((step) => {
        const isDone = milestoneVal >= step.key;
        const isCurrent = milestoneVal === step.key;
        
        let circleStyle = 'background: white; border: 2px solid #cbd5e1; color: #64748b;';
        if (isDone) {
          circleStyle = 'background: #4f46e5; border: 2px solid #4f46e5; color: white;';
        } else if (isCurrent) {
          circleStyle = 'background: white; border: 2.5px solid #4f46e5; color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15); font-weight: 700;';
        }

        const iconHtml = isDone 
          ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>`
          : `<span style="font-size: 10px; line-height: 1;">${step.key + 1}</span>`;

        return `
          <div style="position: relative; display: flex; gap: 15px; align-items: flex-start;">
            <!-- Connector Line -->
            ${step.key < 5 ? `
              <div style="position: absolute; left: 11px; top: 22px; bottom: -20px; width: 2px; 
                background: ${milestoneVal > step.key ? '#4f46e5' : '#e2e8f0'}; 
                border-left: ${milestoneVal > step.key ? 'none' : '2px dashed #cbd5e1'};">
              </div>
            ` : ''}

            <!-- Step Circle Icon -->
            <div style="width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 1; flex-shrink: 0; font-family: sans-serif; transition: all 0.3s; ${circleStyle}">
              ${iconHtml}
            </div>

            <!-- Step text -->
            <div style="flex: 1; min-width: 0;">
              <h5 style="margin: 0; font-size: 12.5px; font-weight: ${isDone || isCurrent ? '700' : '600'}; color: ${isDone || isCurrent ? '#1e293b' : '#94a3b8'};">${step.title}</h5>
              <p style="margin: 3px 0 0; font-size: 11px; font-weight: 500; color: ${isDone || isCurrent ? '#64748b' : '#cbd5e1'}; line-height: 1.4;">${step.desc}</p>
              ${isCurrent && found.lastUpdate ? `
                <div style="margin-top: 5px; display: inline-flex; align-items: center; gap: 4px; background: #e0e7ff; color: #4f46e5; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
                  <span>Last Update:</span>
                  <span style="font-weight: 700;">${found.lastUpdate}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Show result
      resultDiv.style.display = 'block';

    } catch (err) {
      console.error("Tracking query error:", err);
      loadingDiv.style.display = 'none';
      errorDiv.textContent = "An error occurred while connecting to the dispatch network. Please try again later.";
      errorDiv.style.display = 'block';
    }
  });

  // Check if track query parameter is present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const trackId = urlParams.get('track');
  if (trackId) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    trackingInput.value = trackId;
    // Trigger submit after listeners are fully ready
    setTimeout(() => {
      searchForm.dispatchEvent(new Event('submit'));
    }, 300);
  }
}

// ─── Front-End 3D Parallax Tilt Cards ───────────────────────
function init3DTiltCards() {
  const cards = document.querySelectorAll('.service-card, .why-card, .product-card, .about-badge-card, .about-experience-tag');
  cards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease';
    });
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
      
      const maxTilt = 8; // Max angle in degrees
      const rotateX = -y * maxTilt;
      const rotateY = x * maxTilt;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease';
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });
}

// ─── Front-End Parallax Scrolling Engine ──────────────────────
function initScrollParallax() {
  const heroImg = document.querySelector('.hero-img');
  const gear1 = document.querySelector('.floating-decor.gear-1');
  const gear2 = document.querySelector('.floating-decor.gear-2');
  const hex1 = document.querySelector('.floating-decor.hex-1');
  const hex2 = document.querySelector('.floating-decor.hex-2');
  const whyUsBg = document.querySelector('.why-us-bg');
  
  let ticking = false;

  function updateParallax() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 1. Hero Image Background Parallax (slides slower on scroll)
    if (heroImg) {
      const offset = scrollY * 0.32; // speed multiplier
      heroImg.style.transform = `translate3d(0, ${offset}px, 0)`;
    }

    // 2. Background Decor Floating Elements Parallax
    if (gear1) {
      gear1.style.transform = `translate3d(0, ${scrollY * 0.18}px, 0) rotate(${scrollY * 0.08}deg)`;
    }
    if (gear2) {
      gear2.style.transform = `translate3d(0, ${scrollY * -0.12}px, 0) rotate(${scrollY * -0.05}deg)`;
    }
    if (hex1) {
      hex1.style.transform = `translate3d(0, ${scrollY * 0.22}px, 0) rotate(${scrollY * 0.03}deg)`;
    }
    if (hex2) {
      hex2.style.transform = `translate3d(0, ${scrollY * -0.18}px, 0) rotate(${scrollY * -0.04}deg)`;
    }

    // 3. Why-Us section background parallax
    if (whyUsBg) {
      const rect = whyUsBg.getBoundingClientRect();
      const relativeY = rect.top + scrollY;
      const offset = (scrollY - relativeY) * 0.08;
      whyUsBg.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
    
    // 4. Staggered parallax translation for section titles
    document.querySelectorAll('.section-header').forEach((header) => {
      const rect = header.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const scrolledIntoSection = window.innerHeight - rect.top;
        const offset = scrolledIntoSection * 0.035;
        const title = header.querySelector('.section-title');
        const desc = header.querySelector('.section-desc');
        if (title) title.style.transform = `translate3d(0, ${-offset}px, 0)`;
        if (desc) desc.style.transform = `translate3d(0, ${-offset * 0.5}px, 0)`;
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

// ─── Scroll-reveal animations ────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.service-card, .why-card, .process-step, .about-feature, .product-card, .stat-card-item').forEach(el => {
  el.classList.add('reveal-on-scroll');
  revealObserver.observe(el);
});

// Initialize shipment tracking modal listeners
initTrackingModal();

// Initialize 3D tilt interaction and scroll parallax engines
init3DTiltCards();
initScrollParallax();

// ─── Init Firebase content load ──────────────────────────────
loadSiteConfig().finally(() => {
  const elapsed = performance.now() - siteLoadStartTime;
  let duration = 350;
  try {
    const cached = localStorage.getItem('stonex_theme_config');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.preloader && parsed.preloader.preloaderDuration !== undefined) {
        duration = Math.min(60000, Number(parsed.preloader.preloaderDuration));
      }
    }
  } catch(e) {}

  const remaining = Math.max(0, duration - elapsed);
  setTimeout(() => {
    document.body.classList.add('loaded');
    const preloaderEl = document.getElementById('site-preloader');
    if (preloaderEl) {
      preloaderEl.classList.add('fade-out');
    }
  }, remaining);
});

// ─── Realtime Admin Console Sync & Simulation Support ──────────
window.addEventListener('message', (event) => {
  if (event.data === 'reload-config') {
    console.log('Realtime reload event received from Admin Dashboard!');
    
    // Temporarily bring back the preloader so the user can see their changes
    const preloaderEl = document.getElementById('site-preloader');
    if (preloaderEl) {
      preloaderEl.classList.remove('fade-out');
    }
    
    loadSiteConfig().finally(() => {
      let duration = 350;
      try {
        const cached = localStorage.getItem('stonex_theme_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.preloader && parsed.preloader.preloaderDuration !== undefined) {
            duration = Math.min(60000, Number(parsed.preloader.preloaderDuration));
          }
        }
      } catch(e) {}
      
      // Let the user view the beautiful customized preloader for their selected duration before fading out
      setTimeout(() => {
        if (preloaderEl) {
          preloaderEl.classList.add('fade-out');
        }
      }, duration);
    });
  } else if (event.data === 'simulate-scroll-hero') {
    document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
  } else if (event.data === 'simulate-scroll-services') {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  } else if (event.data === 'simulate-scroll-products') {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  } else if (event.data === 'simulate-scroll-contact') {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  } else if (event.data === 'simulate-open-chat') {
    document.getElementById('chatbot-toggle-btn')?.click();
  } else if (event.data === 'simulate-open-tracking') {
    document.getElementById('tracking-float-btn')?.click();
  }
});

// Post a ready signal back to the parent window
try {
  window.parent?.postMessage({ type: 'frontend-ready', url: window.location.href }, '*');
} catch (e) {
  console.warn('Could not post parent ready signal:', e);
}

// Capture client clicks and send logs back to parent to display in real-time
document.addEventListener('click', (e) => {
  try {
    const target = e.target;
    if (!target) return;
    
    let label = '';
    if (target.closest('.btn')) {
      label = `Clicked Button: "${target.closest('.btn').textContent.trim()}"`;
    } else if (target.closest('.product-card')) {
      label = `Viewed Product: "${target.closest('.product-card').querySelector('h4')?.textContent.trim() || 'Product'}"`;
    } else if (target.closest('.service-card')) {
      label = `Explored Service: "${target.closest('.service-card').querySelector('h3')?.textContent.trim() || 'Service'}"`;
    } else if (target.closest('#tracking-float-btn')) {
      label = `Opened Shipment Tracker Floating Action Button`;
    } else if (target.closest('#chatbot-toggle-btn')) {
      label = `Opened AI Chatbot Assistant`;
    }
    
    if (label) {
      window.parent?.postMessage({ type: 'frontend-interaction', log: label }, '*');
    }
  } catch (err) {
    // Silent ignore
  }
});



