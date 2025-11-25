/**
 * Utility functions for data manipulation and analysis
 */

/**
 * Base64 encode a string
 */
export function base64Encode(text: string): string {
  try {
    return btoa(text);
  } catch (e) {
    // Handle unicode characters
    return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  }
}

/**
 * Base64 decode a string
 */
export function base64Decode(encoded: string): string {
  try {
    return atob(encoded);
  } catch (e) {
    try {
      // Handle unicode
      return decodeURIComponent(Array.prototype.map.call(atob(encoded), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch {
      return 'Invalid Base64';
    }
  }
}

/**
 * URL encode a string
 */
export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

/**
 * URL decode a string
 */
export function urlDecode(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return 'Invalid URL encoding';
  }
}

/**
 * Hex encode a string
 */
export function hexEncode(text: string): string {
  return Array.from(text)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hex decode a string
 */
export function hexDecode(hex: string): string {
  try {
    const cleaned = hex.replace(/[^0-9a-fA-F]/g, '');
    const bytes = cleaned.match(/.{1,2}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
  } catch {
    return 'Invalid hex';
  }
}

/**
 * Check if a string appears to be encrypted/encoded
 */
export function detectEncoding(text: string): {
  type: string;
  confidence: number;
  description: string;
}[] {
  const results: { type: string; confidence: number; description: string }[] = [];

  // Check for Base64
  if (/^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length % 4 === 0 && text.length > 8) {
    results.push({
      type: 'Base64',
      confidence: 0.8,
      description: 'Appears to be Base64 encoded',
    });
  }

  // Check for Hex
  if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0 && text.length > 8) {
    results.push({
      type: 'Hexadecimal',
      confidence: 0.7,
      description: 'Appears to be hex encoded',
    });
  }

  // Check for URL encoding
  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    results.push({
      type: 'URL Encoded',
      confidence: 0.9,
      description: 'Contains URL encoded characters',
    });
  }

  // Check for JWT
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(text)) {
    results.push({
      type: 'JWT Token',
      confidence: 0.95,
      description: 'Appears to be a JSON Web Token',
    });
  }

  // Check for UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
    results.push({
      type: 'UUID',
      confidence: 1.0,
      description: 'Valid UUID format',
    });
  }

  // Check for high entropy (possible encryption)
  const entropy = calculateEntropy(text);
  if (entropy > 4.5 && text.length > 20) {
    results.push({
      type: 'High Entropy',
      confidence: Math.min(entropy / 8, 0.9),
      description: `High entropy (${entropy.toFixed(2)}), possibly encrypted`,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(text: string): number {
  const freq: Record<string, number> = {};

  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = text.length;

  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Try to parse as JSON
 */
export function tryParseJSON(text: string): { success: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

/**
 * Check if text looks like a timestamp
 */
export function detectTimestamp(text: string): { isTimestamp: boolean; date?: Date; format?: string } {
  // Unix timestamp (seconds)
  if (/^\d{10}$/.test(text)) {
    const timestamp = parseInt(text, 10);
    const date = new Date(timestamp * 1000);
    if (date.getFullYear() > 2000 && date.getFullYear() < 2100) {
      return { isTimestamp: true, date, format: 'Unix (seconds)' };
    }
  }

  // Unix timestamp (milliseconds)
  if (/^\d{13}$/.test(text)) {
    const timestamp = parseInt(text, 10);
    const date = new Date(timestamp);
    if (date.getFullYear() > 2000 && date.getFullYear() < 2100) {
      return { isTimestamp: true, date, format: 'Unix (milliseconds)' };
    }
  }

  // ISO 8601
  const isoDate = new Date(text);
  if (!isNaN(isoDate.getTime()) && text.includes('T')) {
    return { isTimestamp: true, date: isoDate, format: 'ISO 8601' };
  }

  return { isTimestamp: false };
}
