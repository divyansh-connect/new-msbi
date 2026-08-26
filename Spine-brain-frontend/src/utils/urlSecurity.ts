/**
 * URL Security Utilities
 * Prevents javascript:, data:, and other malicious URL schemes from being rendered into href or iframe attributes.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validates whether a given URL string is safe for navigation or resource embedding.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();

  // Reject protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Allow safe root-relative URLs
  if (trimmed.startsWith('/') && !trimmed.includes('\\')) {
    return true;
  }

  // Reject malicious inline schemes immediately
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe, or a fallback string (default: '#') if unsafe or empty.
 */
export function sanitizeUrl(url?: string | null, fallback = '#'): string {
  if (isSafeUrl(url)) {
    return url!.trim();
  }
  return fallback;
}
