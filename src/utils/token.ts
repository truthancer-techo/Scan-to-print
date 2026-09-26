/**
 * Dynamic Unique Print Token Generator
 * Formats: PRT-7K4M92, PRT-X82Q5L, PRT-4N7P8A
 * Secure, non-sequential, and dynamic for every order.
 */
export function generatePrintToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude easily confused characters (0, O, 1, I)
  let randomPart = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      randomPart += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return `PRT-${randomPart}`;
}
