export async function fetchAndCompress(
  url,
  targetKB,
  minQuality = 0.1,
  minDimension = 100,
) {
  const targetBytes = targetKB * 1024;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.blob();
  const img = await createImageBitmap(blob);

  let width = img.width;
  let height = img.height;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const drawAndExport = (w, h, quality) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
  };

  let quality = 0.95;
  let outputBlob;

  while (quality >= minQuality) {
    outputBlob = await drawAndExport(width, height, quality);
    if (outputBlob.size <= targetBytes) break;
    quality -= 0.05;
  }

  if (outputBlob.size > targetBytes) {
    while (Math.max(width, height) > minDimension) {
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
      outputBlob = await drawAndExport(width, height, minQuality);
      if (outputBlob.size <= targetBytes) break;
    }
  }

  const savedKB = Math.round((blob.size - outputBlob.size) / 1024);

  const dataUrl = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(outputBlob);
  });

  return { dataUrl, savedKB };
}
