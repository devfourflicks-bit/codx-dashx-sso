import JSZip from 'jszip';

// Helper to fetch file content safely as text or binary blob
const addFileToZip = async (zipFolder: JSZip, url: string, destPath: string, binary: boolean = false) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    if (binary) {
      const blob = await res.blob();
      zipFolder.file(destPath, blob);
    } else {
      const text = await res.text();
      zipFolder.file(destPath, text);
    }
  } catch (err) {
    console.warn(`Failed to package ${url}:`, err);
  }
};

export async function downloadFrontendProject() {
  const zip = new JSZip();

  await Promise.all([
    addFileToZip(zip, '/tmp_frontend/index.html', 'index.html'),
    addFileToZip(zip, '/tmp_frontend/script.js', 'script.js'),
    addFileToZip(zip, '/tmp_frontend/style.css', 'style.css'),
    addFileToZip(zip, '/tmp_frontend/firebase-config.js', 'firebase-config.js'),
    addFileToZip(zip, '/tmp_frontend/about_company.jpg', 'about_company.jpg', true),
    addFileToZip(zip, '/tmp_frontend/civil_material.jpg', 'civil_material.jpg', true),
    addFileToZip(zip, '/tmp_frontend/equipment_rental.jpg', 'equipment_rental.jpg', true),
    addFileToZip(zip, '/tmp_frontend/hero_banner.jpg', 'hero_banner.jpg', true),
    addFileToZip(zip, '/tmp_frontend/industrial_trading.jpg', 'industrial_trading.jpg', true),
    addFileToZip(zip, '/tmp_frontend/ppe_items.jpg', 'ppe_items.jpg', true),
  ]);

  zip.file('vercel.json', `{
  "cleanUrls": true
}`);

  zip.file('README.md', `# Stonex Logistics & Cargo — Customer Portal

This package contains the high-performance client-facing website files for Stonex.

## 🚀 Deployment Instructions (Vercel / GitHub Pages)

### Option 1: Vercel Deployment (Super Fast)
1. Initialize a Git repository inside this unzipped directory:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   \`\`\`
2. Push this repository to GitHub.
3. Import the repository into your Vercel Dashboard. It will auto-detect as a Static Site and deploy in 10 seconds!

### Option 2: GitHub Pages (Free Static Hosting)
1. Push this folder to a GitHub repository.
2. Go to **Settings > Pages**.
3. Select **Deploy from branch** and set it to **main** / **root** folder.
4. Save, and your live site is ready!
`);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stonex_customer_frontend.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadDashboardProject() {
  const zip = new JSZip();

  // Add root files
  await Promise.all([
    addFileToZip(zip, '/package.json', 'package.json'),
    addFileToZip(zip, '/vite.config.ts', 'vite.config.ts'),
    addFileToZip(zip, '/tsconfig.json', 'tsconfig.json'),
    addFileToZip(zip, '/index.html', 'index.html'),
  ]);

  // Add src files
  const srcFolder = zip.folder('src');
  if (srcFolder) {
    await Promise.all([
      addFileToZip(srcFolder, '/src/main.tsx', 'main.tsx'),
      addFileToZip(srcFolder, '/src/index.css', 'index.css'),
      addFileToZip(srcFolder, '/src/types.ts', 'types.ts'),
      addFileToZip(srcFolder, '/src/App.tsx', 'App.tsx'),
    ]);

    const libFolder = srcFolder.folder('lib');
    if (libFolder) {
      await Promise.all([
        addFileToZip(libFolder, '/src/lib/firebase.ts', 'firebase.ts'),
        addFileToZip(libFolder, '/src/lib/imageUtils.ts', 'imageUtils.ts'),
        addFileToZip(libFolder, '/src/lib/projectDownloader.ts', 'projectDownloader.ts'),
      ]);
    }

    const componentsFolder = srcFolder.folder('components');
    if (componentsFolder) {
      await Promise.all([
        addFileToZip(componentsFolder, '/src/components/AnnouncementsSection.tsx', 'AnnouncementsSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/CompanyInfoSection.tsx', 'CompanyInfoSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/ConfirmDialog.tsx', 'ConfirmDialog.tsx'),
        addFileToZip(componentsFolder, '/src/components/ContactSection.tsx', 'ContactSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/DomainManagementSection.tsx', 'DomainManagementSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/Header.tsx', 'Header.tsx'),
        addFileToZip(componentsFolder, '/src/components/HeroSection.tsx', 'HeroSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/InvoiceSection.tsx', 'InvoiceSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/LeadsSection.tsx', 'LeadsSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/ListSection.tsx', 'ListSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/LocalFrontendSection.tsx', 'LocalFrontendSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/LoginOverlay.tsx', 'LoginOverlay.tsx'),
        addFileToZip(componentsFolder, '/src/components/LogisticsSection.tsx', 'LogisticsSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/OverviewSection.tsx', 'OverviewSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/ParallaxWrapper.tsx', 'ParallaxWrapper.tsx'),
        addFileToZip(componentsFolder, '/src/components/ProductsSection.tsx', 'ProductsSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/RoleRegistrySection.tsx', 'RoleRegistrySection.tsx'),
        addFileToZip(componentsFolder, '/src/components/SeoSection.tsx', 'SeoSection.tsx'),
        addFileToZip(componentsFolder, '/src/components/Sidebar.tsx', 'Sidebar.tsx'),
        addFileToZip(componentsFolder, '/src/components/ThemeSection.tsx', 'ThemeSection.tsx'),
      ]);
    }
  }

  zip.file('vercel.json', `{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/tmp_frontend", "destination": "/tmp_frontend/index.html" },
    { "source": "/tmp_frontend/", "destination": "/tmp_frontend/index.html" },
    { "source": "/tmp_frontend/:path*", "destination": "/tmp_frontend/:path*" },
    { "source": "/assets/:path*", "destination": "/assets/:path*" },
    { "source": "/((?!api|tmp_frontend|assets|.*\\\\.).*)", "destination": "/index.html" }
  ]
}`);

  zip.file('README.md', `# Stonex Admin & Operational Dashboard

This is the fully featured React + Vite admin dashboard workspace for the Stonex Industrial Cargo Platform.

## ⚙️ Local Development Setup

1. Open this unzipped directory in your IDE or terminal.
2. Install the required Node packages:
   \`\`\`bash
   npm install
   \`\`\`
3. Run the high-speed local development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open the development link shown in your terminal (usually \`http://localhost:3000\`).
`);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stonex_admin_dashboard.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadFullProject() {
  const zip = new JSZip();

  // 1. Create Public Frontend Folder
  const frontendFolder = zip.folder('frontend');
  if (frontendFolder) {
    await Promise.all([
      addFileToZip(frontendFolder, '/tmp_frontend/index.html', 'index.html'),
      addFileToZip(frontendFolder, '/tmp_frontend/script.js', 'script.js'),
      addFileToZip(frontendFolder, '/tmp_frontend/style.css', 'style.css'),
      addFileToZip(frontendFolder, '/tmp_frontend/firebase-config.js', 'firebase-config.js'),
      addFileToZip(frontendFolder, '/tmp_frontend/about_company.jpg', 'about_company.jpg', true),
      addFileToZip(frontendFolder, '/tmp_frontend/civil_material.jpg', 'civil_material.jpg', true),
      addFileToZip(frontendFolder, '/tmp_frontend/equipment_rental.jpg', 'equipment_rental.jpg', true),
      addFileToZip(frontendFolder, '/tmp_frontend/hero_banner.jpg', 'hero_banner.jpg', true),
      addFileToZip(frontendFolder, '/tmp_frontend/industrial_trading.jpg', 'industrial_trading.jpg', true),
      addFileToZip(frontendFolder, '/tmp_frontend/ppe_items.jpg', 'ppe_items.jpg', true),
    ]);
    frontendFolder.file('vercel.json', `{
  "cleanUrls": true
}`);
  }

  // 2. Create Admin Panel Folder
  const adminFolder = zip.folder('admin');
  if (adminFolder) {
    await Promise.all([
      addFileToZip(adminFolder, '/package.json', 'package.json'),
      addFileToZip(adminFolder, '/vite.config.ts', 'vite.config.ts'),
      addFileToZip(adminFolder, '/tsconfig.json', 'tsconfig.json'),
      addFileToZip(adminFolder, '/index.html', 'index.html'),
      addFileToZip(adminFolder, '/src/main.tsx', 'src/main.tsx'),
      addFileToZip(adminFolder, '/src/index.css', 'src/index.css'),
      addFileToZip(adminFolder, '/src/types.ts', 'src/types.ts'),
      addFileToZip(adminFolder, '/src/App.tsx', 'src/App.tsx'),
      addFileToZip(adminFolder, '/src/lib/firebase.ts', 'src/lib/firebase.ts'),
      addFileToZip(adminFolder, '/src/lib/imageUtils.ts', 'src/lib/imageUtils.ts'),
      addFileToZip(adminFolder, '/src/components/ThemeSection.tsx', 'src/components/ThemeSection.tsx'),
      addFileToZip(adminFolder, '/src/components/ListSection.tsx', 'src/components/ListSection.tsx'),
    ]);
    adminFolder.file('vercel.json', `{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`);
  }

  // 3. Add a README instruction file
  zip.file('README.md', `# Stonex Industrial Trading — Web Suite

This package contains the full frontend website and admin dashboard panel source code.

## 📂 Project Structure

- \`/frontend/\`: The client-facing, high-performance static website powered by Firebase Firestore. Upload this directory to GitHub Pages, Netlify, Vercel, or host it directly on Firebase Hosting!
- \`/admin/\`: The React + Vite Admin dashboard used to update the site configurations, manage product ranges, track shipments, and register team roles.

## 🚀 How to Host & Upload to GitHub

1. **Host Frontend:**
   - Create a GitHub repository (e.g. \`stonex-frontend\`).
   - Push the contents of the \`/frontend/\` folder directly to the root of the repository.
   - Go to **Settings > Pages** and enable GitHub Pages on the \`main\` branch! Your site is live!

2. **Run Admin Panel locally:**
   - Open \`/admin/\` in your terminal.
   - Run \`npm install\` to install dependencies.
   - Run \`npm run dev\` to start the local developer server!
`);

  // Generate ZIP and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stonex_industrial_project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
