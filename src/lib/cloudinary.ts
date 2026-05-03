const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

// ── SECURITY: Allowed file types and max size ─────────────────────────────
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Reserved/blocked filenames
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".sh", ".cmd", ".msi", ".dll", ".js", ".php", ".py"];

/**
 * Validates file before upload — prevents malicious/oversized uploads.
 */
function validateFile(file: File): void {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}". Only JPEG, PNG, WebP, and HEIC images are allowed.`
    );
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 5MB.`
    );
  }

  // Check extension (double-check against disguised files)
  const name = file.name.toLowerCase();
  if (BLOCKED_EXTENSIONS.some(ext => name.endsWith(ext))) {
    throw new Error(`File type "${name.split('.').pop()}" is not allowed.`);
  }
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Free tier: 25 GB storage + 25 GB bandwidth/month.
 * 
 * SECURITY HARDENING:
 *  - File type whitelist (images only)
 *  - 5MB max file size
 *  - Blocked executable extensions
 *  - 15-second network timeout
 * 
 * @returns The secure HTTPS URL of the uploaded image.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "savion"
): Promise<string> {
  // ── Validate before upload ──────────────────────────────────────────────
  validateFile(file);

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
