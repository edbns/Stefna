// src/features/styleclash/compose.ts
export async function composeSplit(
  urlA: string,
  urlB: string,
  orientation: 'vertical' | 'horizontal' = 'vertical',
): Promise<Blob> {
  const imgA = await load(urlA);
  const imgB = await load(urlB);
  const w = Math.max(imgA.width, imgB.width);
  const h = Math.max(imgA.height, imgB.height);
  const c = document.createElement('canvas');
  c.width = w; 
  c.height = h;
  const ctx = c.getContext('2d')!;
  
  // Fill halves
  if (orientation === 'vertical') {
    ctx.drawImage(imgA, 0, 0, w/2, h);
    ctx.drawImage(imgB, w/2, 0, w/2, h);
  } else {
    ctx.drawImage(imgA, 0, 0, w, h/2);
    ctx.drawImage(imgB, 0, h/2, w, h/2);
  }
  
  return await new Promise((res) => c.toBlob((b) => res(b!), 'image/png', 0.92));
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
