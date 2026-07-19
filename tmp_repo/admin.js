import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const saveStatus = document.getElementById('save-status');

// Forms
const themeForm = document.getElementById('theme-form');
const companyInfoForm = document.getElementById('company-info-form');
const heroForm = document.getElementById('hero-form');
const servicesForm = document.getElementById('services-form');
const whyChooseForm = document.getElementById('why-choose-form');
const processForm = document.getElementById('process-form');
const contactFormAdmin = document.getElementById('contact-form-admin');
const announcementsForm = document.getElementById('announcements-form');
const addProductForm = document.getElementById('add-product-form');

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginOverlay.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email;
    const disp = document.getElementById('user-email-display');
    if (disp) disp.textContent = user.email.split('@')[0];
    loadData();
    loadProducts();
    loadLeads();
  } else {
    loginOverlay.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
  } catch (error) {
    document.getElementById('login-error').textContent = 'Login failed: ' + error.message;
  }
});
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// Navigation Handler
const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.admin-section');
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    sections.forEach(sec => {
      sec.classList.toggle('active', sec.id === targetId);
      sec.classList.toggle('hidden', sec.id !== targetId);
    });
  });
});

function showSaveSuccess() {
  saveStatus.classList.add('show');
  setTimeout(() => saveStatus.classList.remove('show'), 3000);
}

// ─── LOAD DATA ──────────────────────────────────────────
async function loadData() {
  try {
    // Theme
    const themeSnap = await getDoc(doc(db, 'siteConfig', 'theme'));
    if (themeSnap.exists()) {
      const d = themeSnap.data();
      if(d.primaryColor) document.getElementById('theme-primary').value = d.primaryColor;
      if(d.accentColor) document.getElementById('theme-accent').value = d.accentColor;
            if(d.headerBg) {
        if(d.headerBg.startsWith('#') || !d.headerBg.includes('gradient')) {
          document.getElementById('theme-header-type').value = 'solid';
          document.getElementById('theme-header-color').value = d.headerBg;
          document.getElementById('header-gradient-group').style.display = 'none';
          document.getElementById('header-solid-group').style.display = 'block';
        } else {
          document.getElementById('theme-header-type').value = 'gradient';
          document.getElementById('theme-headerbg').value = d.headerBg;
          document.getElementById('header-gradient-group').style.display = 'block';
          document.getElementById('header-solid-group').style.display = 'none';
        }
      }
      if(d.font) document.getElementById('theme-font').value = d.font;
      if(d.logoUrl) {
        const preview = document.getElementById('theme-logo-preview');
        preview.src = d.logoUrl;
        preview.style.display = 'block';
        
        const sidebarLogo = document.getElementById('admin-sidebar-logo');
        if (sidebarLogo) {
          sidebarLogo.src = d.logoUrl;
          sidebarLogo.style.display = 'block';
        }
      }
      if(d.toggles) {
        document.getElementById('toggle-whatsapp').checked = d.toggles.whatsapp !== false;
        document.getElementById('toggle-topbar').checked = d.toggles.topbar !== false;
        document.getElementById('toggle-ticker').checked = d.toggles.ticker !== false;
        document.getElementById('toggle-process').checked = d.toggles.process !== false;
      }
    }

    // Company Info
    const ciSnap = await getDoc(doc(db, 'siteConfig', 'companyInfo'));
    if (ciSnap.exists()) {
      const d = ciSnap.data();
      document.getElementById('ci-name').value = d.name || '';
      document.getElementById('ci-tagline').value = d.tagline || '';
      document.getElementById('ci-about').value = d.about || '';
      document.getElementById('ci-stat-projects').value = d.statProjects || 0;
      document.getElementById('ci-stat-clients').value = d.statClients || 0;
      document.getElementById('ci-stat-years').value = d.statYears || 0;
      document.getElementById('ci-stat-products').value = d.statProducts || 0;
    }

    // Hero
    const heroSnap = await getDoc(doc(db, 'siteConfig', 'hero'));
    if (heroSnap.exists()) {
      const d = heroSnap.data();
      document.getElementById('hero-title1').value = d.title1 || '';
      document.getElementById('hero-title2').value = d.title2 || '';
      document.getElementById('hero-subtitle').value = d.subtitle || '';
      document.getElementById('hero-btn1').value = d.btn1Text || '';
      document.getElementById('hero-badge').value = d.badge || '';
            if(d.bgImages && d.bgImages.length > 0) {
        d.bgImages.forEach((imgUrl, idx) => {
          if(idx < 3) {
            const preview = document.getElementById('hero-bgImage' + (idx+1) + '-preview');
            if(preview) { preview.src = imgUrl; preview.style.display = 'block'; }
          }
        });
      }
    }

    // Services
    const srvSnap = await getDoc(doc(db, 'siteConfig', 'services'));
    renderDynamicList('services-container', srvSnap.exists() ? srvSnap.data().items : [
      {key:'industrial', title:'Industrial Trading', desc:''},
      {key:'equipment', title:'Heavy Equipment Rentals', desc:''},
      {key:'civil', title:'Civil Material Supply', desc:''},
      {key:'ppe', title:'PPE Items', desc:''}
    ], 'svc');

    // Why Choose Us (creating if not exists)
    const whySnap = await getDoc(doc(db, 'siteConfig', 'whyChoose'));
    renderDynamicList('why-choose-container', whySnap.exists() ? whySnap.data().items : [
      {title:'15+ Years Experience', desc:''},
      {title:'Global Partnerships', desc:''},
      {title:'24/7 Support', desc:''},
      {title:'Quality Guaranteed', desc:''}
    ], 'why');

    // Process
    const processSnap = await getDoc(doc(db, 'siteConfig', 'process'));
    renderDynamicList('process-container', processSnap.exists() ? processSnap.data().items : [
      {title:'Consultation', desc:''},
      {title:'Procurement', desc:''},
      {title:'Delivery', desc:''}
    ], 'proc');

    // Contact
    const cSnap = await getDoc(doc(db, 'siteConfig', 'contact'));
    if (cSnap.exists()) {
      const d = cSnap.data();
      document.getElementById('ct-email').value = d.email || '';
      document.getElementById('ct-phone').value = d.phone || '';
      document.getElementById('ct-address').value = d.address || '';
      document.getElementById('ct-hours').value = d.hours || '';
      if(d.social) {
        document.getElementById('ct-facebook').value = d.social.facebook || '';
        document.getElementById('ct-linkedin').value = d.social.linkedin || '';
        document.getElementById('ct-instagram').value = d.social.instagram || '';
        document.getElementById('ct-whatsapp').value = d.social.whatsapp || '';
      }
    }

    // Announcements
    const annSnap = await getDoc(doc(db, 'siteConfig', 'announcements'));
    if (annSnap.exists()) {
      const d = annSnap.data();
      if (d.items) document.getElementById('announcements-list').value = d.items.join('\n');
    }
  } catch (err) { console.error("Error loading data:", err); }
}

function renderDynamicList(containerId, items, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item, index) => {
    container.innerHTML += `
      <div style="background:var(--bg-color); border:1px solid var(--border); padding:1rem; border-radius:8px;">
        <div class="form-group">
          <label>Item ${index + 1} Title</label>
          <input type="text" class="${prefix}-title" value="${item.title || ''}" />
        </div>
        <div class="form-group" style="margin-top:0.5rem;">
          <label>Item ${index + 1} Description</label>
          <textarea class="${prefix}-desc" rows="2">${item.desc || ''}</textarea>
        </div>
        ${item.key ? `<input type="hidden" class="${prefix}-key" value="${item.key}">` : ''}
      </div>
    `;
  });
}

// ─── LOAD PRODUCTS ────────────────────────────────────────
async function loadProducts() {
  const list = document.getElementById('products-list');
  list.innerHTML = 'Loading...';
  try {
    const q = await getDocs(collection(db, 'products'));
    list.innerHTML = '';
    q.forEach(docSnap => {
      const p = docSnap.data();
      list.innerHTML += `
        <div style="background:var(--bg-color); border:1px solid var(--border); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${p.icon || ''} ${p.name}</strong> <span style="color:var(--text-muted); font-size:0.85rem;">(${p.category})</span>
            <p style="margin:0.25rem 0 0; font-size:0.9rem;">${p.desc}</p>
          </div>
          <button class="delete-prod-btn" data-id="${docSnap.id}" style="background:#f85149; border:none; color:white; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;">Delete</button>
        </div>
      `;
    });

    document.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(confirm('Are you sure you want to delete this product?')) {
          await deleteDoc(doc(db, 'products', e.target.getAttribute('data-id')));
          loadProducts();
        }
      });
    });
  } catch (err) { console.error("Error loading products:", err); }
}

// ─── LOAD LEADS ─────────────────────────────────────────
async function loadLeads() {
  try {
    const leadsSnap = await getDocs(collection(db, 'chatbot_leads'));
    const tbody = document.getElementById('leads-tbody');
    tbody.innerHTML = '';
    
    let leads = [];
    leadsSnap.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));
    // Sort newest first
    leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const statCount = document.getElementById('stat-leads-count');
    if (statCount) statCount.textContent = leads.length;
    
    leads.forEach(lead => {
      const tr = document.createElement('tr');
      const date = new Date(lead.timestamp).toLocaleString();
      const isNew = (Date.now() - new Date(lead.timestamp).getTime()) < 86400000;
      tr.innerHTML = `
        <td>
          <div class="lead-name">
            ${lead.name || 'Anonymous'}
            ${isNew ? '<span class="lead-new-badge">New</span>' : ''}
          </div>
        </td>
        <td>
          ${lead.email ? `<div>${lead.email}</div>` : ''}
          ${lead.phone ? `<div style="color:var(--text-muted); font-size:0.85rem;">${lead.phone}</div>` : ''}
          ${(!lead.email && !lead.phone) ? '-' : ''}
        </td>
        <td><em style="color:var(--text-muted); font-size:0.9rem;">Lead collected via Custom Chatbot widget.</em></td>
        <td><span class="lead-timestamp">${date}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error("Leads load failed", e);
  }
}

function setLoading(form, isLoading) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  } else {
    btn.innerHTML = btn.dataset.originalText || 'Save Changes';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

// ─── SAVE HANDLERS ────────────────────────────────────────

themeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  
  // Handle Logo Upload
  const logoFile = document.getElementById('theme-logo').files[0];
  let logoUrl = document.getElementById('theme-logo-preview').src;
  if (logoFile) {
    try {
      const storageRef = ref(storage, 'site-assets/logo-' + Date.now());
      const snapshot = await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(snapshot.ref);
      document.getElementById('theme-logo-preview').src = logoUrl;
      document.getElementById('theme-logo-preview').style.display = 'block';
      document.getElementById('admin-sidebar-logo').src = logoUrl;
      document.getElementById('admin-sidebar-logo').style.display = 'block';
    } catch (err) {
      console.error("Logo upload failed", err);
    }
  }

  const data = {
    primaryColor: document.getElementById('theme-primary').value,
    accentColor: document.getElementById('theme-accent').value,
        headerBg: document.getElementById('theme-header-type').value === 'solid' ? document.getElementById('theme-header-color').value : document.getElementById('theme-headerbg').value,
    font: document.getElementById('theme-font').value,
    logoUrl: logoUrl !== window.location.href ? logoUrl : null,
    toggles: {
      whatsapp: document.getElementById('toggle-whatsapp').checked,
      topbar: document.getElementById('toggle-topbar').checked,
      ticker: document.getElementById('toggle-ticker').checked,
      process: document.getElementById('toggle-process').checked
    }
  };
  await setDoc(doc(db, 'siteConfig', 'theme'), data, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

companyInfoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  await setDoc(doc(db, 'siteConfig', 'companyInfo'), {
    name: document.getElementById('ci-name').value,
    tagline: document.getElementById('ci-tagline').value,
    about: document.getElementById('ci-about').value,
    statProjects: parseInt(document.getElementById('ci-stat-projects').value),
    statClients: parseInt(document.getElementById('ci-stat-clients').value),
    statYears: parseInt(document.getElementById('ci-stat-years').value),
    statProducts: parseInt(document.getElementById('ci-stat-products').value)
  }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

heroForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {

  let bgImages = [];
  for (let i = 1; i <= 3; i++) {
    const fileInput = document.getElementById('hero-bgImage' + i);
    const preview = document.getElementById('hero-bgImage' + i + '-preview');
    let imgUrl = preview.src;
    
    if (fileInput && fileInput.files[0]) {
      try {
        const storageRef = ref(storage, 'site-assets/hero-' + i + '-' + Date.now());
        const snapshot = await uploadBytes(storageRef, fileInput.files[0]);
        imgUrl = await getDownloadURL(snapshot.ref);
        preview.src = imgUrl;
        preview.style.display = 'block';
      } catch (err) {
        console.error("Hero image upload failed", err);
      }
    }
    if (imgUrl && imgUrl !== window.location.href) {
      bgImages.push(imgUrl);
    }
  }

  await setDoc(doc(db, 'siteConfig', 'hero'), {
    title1: document.getElementById('hero-title1').value,
    title2: document.getElementById('hero-title2').value,
    subtitle: document.getElementById('hero-subtitle').value,
    btn1Text: document.getElementById('hero-btn1').value,
    badge: document.getElementById('hero-badge').value,
    bgImages: bgImages
  }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

servicesForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  const items = [];
  const titles = servicesForm.querySelectorAll('.svc-title');
  const descs = servicesForm.querySelectorAll('.svc-desc');
  const keys = servicesForm.querySelectorAll('.svc-key');
  titles.forEach((t, i) => {
    items.push({ title: t.value, desc: descs[i].value, key: keys[i] ? keys[i].value : '' });
  });
  await setDoc(doc(db, 'siteConfig', 'services'), { items }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

whyChooseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  const items = [];
  const titles = whyChooseForm.querySelectorAll('.why-title');
  const descs = whyChooseForm.querySelectorAll('.why-desc');
  titles.forEach((t, i) => items.push({ title: t.value, desc: descs[i].value }));
  await setDoc(doc(db, 'siteConfig', 'whyChoose'), { items }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

processForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  const items = [];
  const titles = processForm.querySelectorAll('.proc-title');
  const descs = processForm.querySelectorAll('.proc-desc');
  titles.forEach((t, i) => items.push({ title: t.value, desc: descs[i].value }));
  await setDoc(doc(db, 'siteConfig', 'process'), { items }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

contactFormAdmin.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  await setDoc(doc(db, 'siteConfig', 'contact'), {
    email: document.getElementById('ct-email').value,
    phone: document.getElementById('ct-phone').value,
    address: document.getElementById('ct-address').value,
    hours: document.getElementById('ct-hours').value,
    social: {
      facebook: document.getElementById('ct-facebook').value,
      linkedin: document.getElementById('ct-linkedin').value,
      instagram: document.getElementById('ct-instagram').value,
      whatsapp: document.getElementById('ct-whatsapp').value
    }
  }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

announcementsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  const listVal = document.getElementById('announcements-list').value;
  const items = listVal.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  await setDoc(doc(db, 'siteConfig', 'announcements'), { items }, { merge: true });
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
});

addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading(e.target, true);
  try {
  const btn = addProductForm.querySelector('button');
  btn.textContent = 'Adding...';
  try {
    await addDoc(collection(db, 'products'), {
      name: document.getElementById('new-prod-name').value,
      category: document.getElementById('new-prod-cat').value,
      icon: document.getElementById('new-prod-icon').value,
      desc: document.getElementById('new-prod-desc').value
    });
    addProductForm.reset();
    loadProducts();
    showSaveSuccess();
  } finally {
    setLoading(e.target, false);
  }
} catch (err) {
    alert(err.message);
  } finally {
    btn.textContent = 'Add Product';
  }
});
