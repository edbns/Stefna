export async function prepareSourceAsset(activeFileOrUrl: File | string) {
  // Already a remote URL? just return it.
  if (typeof activeFileOrUrl === 'string' && !activeFileOrUrl.startsWith('blob:')) {
    const resource_type = /\.(mp4|mov|webm)$/i.test(activeFileOrUrl) ? 'video' : 'image';
    return { url: activeFileOrUrl, resource_type };
  }

  // Blob/File -> upload via Cloudinary signed upload
  const signRes = await fetch('/.netlify/functions/cloudinary-sign', { method: 'POST' });
  const { timestamp, signature, api_key, cloud_name, folder } = await signRes.json();

  const form = new FormData();
  form.append('file', activeFileOrUrl as any);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('api_key', api_key);
  if (folder) form.append('folder', folder);

  const up = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, { method: 'POST', body: form });
  if (!up.ok) throw new Error('Cloudinary upload failed');
  const json = await up.json();

  const resource_type = json.resource_type; // 'image' | 'video'
  return { url: json.secure_url as string, resource_type };
}
