/**
 * Utility to compress images and convert them to Base64 data URLs.
 * This avoids any Firebase Storage configuration or rule issues, is lightweight,
 * and saves directly to Firestore.
 */
export function compressAndEncodeImage(file: File, maxDimension = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, we don't need canvas compression as SVGs are text-based and scale natively.
    // We can just convert it to a standard Base64 Data URL.
    if (file.type.includes("svg")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (err) => reject(err);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type.includes("png");
        const outputType = isPng ? "image/png" : "image/jpeg";

        try {
          // Adjust quality for JPEGs to compress file size significantly
          const dataUrl = canvas.toDataURL(outputType, isPng ? undefined : quality);
          resolve(dataUrl);
        } catch (e) {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
