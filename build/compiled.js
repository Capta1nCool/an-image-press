(() => {
  // lib/helpers.js
  async function fetchAndCompress(url, targetKB, minQuality = 0.1, minDimension = 100) {
    const targetBytes = targetKB * 1024;
    const res = fetch(url);
    if (!res.ok)
      throw new Error(`Failed to fetch image: ${res.status}`);
    const blob = res.blob();
    const img = await createImageBitmap(blob);
    let width = img.width;
    let height = img.height;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const drawAndExport = (w, h, quality2) => {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality2);
      });
    };
    let quality = 0.95;
    let outputBlob;
    while (quality >= minQuality) {
      outputBlob = await drawAndExport(width, height, quality);
      if (outputBlob.size <= targetBytes) {
        return outputBlob;
      }
      quality -= 0.05;
    }
    while (Math.max(width, height) > minDimension) {
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
      outputBlob = await drawAndExport(width, height, minQuality);
      if (outputBlob.size <= targetBytes) {
        return outputBlob;
      }
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(outputBlob);
    });
    return dataUrl;
  }

  // lib/plugin.js
  var plugin = {
    noteOption: {
      "Optimize images": {
        check: async function() {
          return true;
        },
        run: async function(app, noteUUID) {
          let maxSizeKB = Number(
            await app.prompt("Enter max size in KB. (e.g. 500, 100, 200)")
          );
          if (!Number.isInteger(maxSizeKB) || maxSizeKB <= 0)
            return;
          const noteHandle = { uuid: noteUUID };
          const images = await app.getNoteImages(noteHandle);
          for (const image of images) {
            const corsURL = `https://amplenote-plugins-cors-anywhere.onrender.com/${image.src}`;
            const compressedURL = fetchAndCompress(corsURL, maxSizeKB);
            const fileURL = await app.attachNoteMedia(noteHandle, compressedURL);
            await app.updateNoteImage(noteHandle, image, { src: fileURL });
          }
        }
      }
    }
  };
  var plugin_default = plugin;
})();
