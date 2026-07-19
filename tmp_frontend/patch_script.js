const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const oldApplyHero = `  if (bgImg && d.bgImage) bgImg.src = d.bgImage;
}`;

const newApplyHero = `  if (bgImg) {
    if (d.bgImages && d.bgImages.length > 0) {
      bgImg.src = d.bgImages[0];
      if (d.bgImages.length > 1) {
        let currentIdx = 0;
        setInterval(() => {
          currentIdx = (currentIdx + 1) % d.bgImages.length;
          bgImg.style.opacity = 0;
          setTimeout(() => {
            bgImg.src = d.bgImages[currentIdx];
            bgImg.style.opacity = 1;
          }, 500);
        }, 5000);
        bgImg.style.transition = 'opacity 0.5s ease-in-out';
      }
    } else if (d.bgImage) {
      bgImg.src = d.bgImage;
    }
  }
}`;

js = js.replace(oldApplyHero, newApplyHero);
fs.writeFileSync('script.js', js);
console.log("Patched script.js successfully");
