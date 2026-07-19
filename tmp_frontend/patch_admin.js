const fs = require('fs');
let js = fs.readFileSync('admin/admin.js', 'utf8');

// Patch 1: Load Theme headerBg
js = js.replace(/if\(d\.headerBg\) document\.getElementById\('theme-headerbg'\)\.value = d\.headerBg;/g,
`      if(d.headerBg) {
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
      }`);

// Patch 2: Save Theme headerBg
js = js.replace(/headerBg: document\.getElementById\('theme-headerbg'\)\.value,/g,
`    headerBg: document.getElementById('theme-header-type').value === 'solid' ? document.getElementById('theme-header-color').value : document.getElementById('theme-headerbg').value,`);

// Patch 3: Load Hero multiple images
js = js.replace(/if\(d\.bgImage\) \{\s+const preview = document\.getElementById\('hero-bgImage-preview'\);\s+preview\.src = d\.bgImage;\s+preview\.style\.display = 'block';\s+\}/g,
`      if(d.bgImages && d.bgImages.length > 0) {
        d.bgImages.forEach((imgUrl, idx) => {
          if(idx < 3) {
            const preview = document.getElementById('hero-bgImage' + (idx+1) + '-preview');
            if(preview) { preview.src = imgUrl; preview.style.display = 'block'; }
          }
        });
      }`);

fs.writeFileSync('admin/admin.js', js);
console.log("Patched admin.js successfully");
