import { signedFetch } from './auth'

export async function uploadToCloudinary(fileOrDataUrl: File | string, folder: string) {
  // Convert data URL -> Blob -> File if needed
  let file: File;
  if (typeof fileOrDataUrl === "string") {
    if (!fileOrDataUrl.startsWith("data:")) throw new Error("Non-file string passed to upload");
    const blob = await fetch(fileOrDataUrl).then(r => r.blob());
    file = new File([blob], "upload.png", { type: blob.type || "image/png" });
  } else {
    file = fileOrDataUrl;
  }

  // Get a signed payload
  const sig = await signedFetch("/.netlify/functions/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, resource_type: "image" })
  }).then(r => r.json());

  // Post to Cloudinary
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.api_key);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", folder);
  fd.append("resource_type", "image");

  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`, { method: "POST", body: fd })
    .then(r => r.json());

  if (!up?.secure_url) {
    console.error("Cloudinary upload failed:", up);
    throw new Error(up?.error?.message || "Cloudinary upload failed");
  }

  return { secure_url: up.secure_url as string, width: up.width as number, height: up.height as number, public_id: up.public_id as string };
}

/**
 * Upload avatar image to Cloudinary with optimized settings for profile photos
 */
export async function uploadAvatarToCloudinary(file: File, userId: string): Promise<string> {
  const folder = `avatars/${userId}`;
  
  // Get signed upload parameters
  const sig = await signedFetch("/.netlify/functions/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      folder, 
      resource_type: "image",
      transformation: "c_fill,w_200,h_200,q_auto,f_auto" // Optimize for avatars
    })
  }).then(r => r.json());

  // Prepare form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.api_key);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", folder);
  formData.append("resource_type", "image");
  formData.append("transformation", "c_fill,w_200,h_200,q_auto,f_auto"); // Square crop, 200x200, auto quality/format

  // Upload to Cloudinary
  const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!result?.secure_url) {
    console.error("Avatar upload failed:", result);
    throw new Error(result?.error?.message || "Avatar upload failed");
  }

  return result.secure_url as string;
}
