/**
 * Extracts the file ID from various Google Drive URL formats
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Format: https://drive.google.com/open?id=FILE_ID
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Format: https://drive.google.com/uc?id=FILE_ID
  match = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  // Format: direct file ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;
  
  return null;
}

/**
 * Gets the Google Drive preview/embed URL
 * Works for both audio and PDF — uses the same /preview endpoint
 * This URL does NOT expose the download link
 */
export function getDrivePreviewUrl(url: string): string {
  const fileId = extractDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Alias for backward compatibility
export const getDriveEmbedUrl = getDrivePreviewUrl;
export const getDrivePdfPreviewUrl = getDrivePreviewUrl;

/**
 * Triggers a download via JavaScript — no URL appears in HTML
 * Creates a temporary link, clicks it, and removes it immediately
 */
export function triggerDriveDownload(url: string): void {
  const fileId = extractDriveFileId(url);
  if (!fileId) return;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  // Create a temporary hidden link and click it
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Remove after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}
