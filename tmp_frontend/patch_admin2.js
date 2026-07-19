const fs = require('fs');
let js = fs.readFileSync('admin/admin.js', 'utf8');

const oldHeroSave = `  const heroFile = document.getElementById('hero-bgImage').files[0];
  let bgImage = document.getElementById('hero-bgImage-preview').src;
  if (heroFile) {
    try {
      const storageRef = ref(storage, 'site-assets/hero-' + Date.now());
      const snapshot = await uploadBytes(storageRef, heroFile);
      bgImage = await getDownloadURL(snapshot.ref);
      document.getElementById('hero-bgImage-preview').src = bgImage;
      document.getElementById('hero-bgImage-preview').style.display = 'block';
    } catch (err) {
      console.error("Hero image upload failed", err);
    }
  }

  await setDoc(doc(db, 'siteConfig', 'hero'), {
    title1: document.getElementById('hero-title1').value,
    title2: document.getElementById('hero-title2').value,
    subtitle: document.getElementById('hero-subtitle').value,
    btn1Text: document.getElementById('hero-btn1').value,
    badge: document.getElementById('hero-badge').value,
    bgImage: bgImage !== window.location.href ? bgImage : null
  }, { merge: true });`;

const newHeroSave = `  let bgImages = [];
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
  }, { merge: true });`;

js = js.replace(oldHeroSave, newHeroSave);
fs.writeFileSync('admin/admin.js', js);
console.log("Patched hero form save successfully");
