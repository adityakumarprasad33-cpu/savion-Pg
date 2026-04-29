const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Free tier: 25 GB storage + 25 GB bandwidth/month.
 * @returns The secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "savion"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData, signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url as string;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error("Upload timed out due to slow internet connection. Please try again.");
    }
    throw err;
  }
}
