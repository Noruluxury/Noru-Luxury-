/** GTIN check digit (EAN-8, UPC-A, EAN-13, GTIN-14) — same maths as the backend */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  return gtinCheckDigit(code.slice(0, -1)) === Number(code[code.length - 1]);
}

/** Admin-only barcode image URL (served through the /api proxy) */
export const barcodeImageUrl = (perfumeId: string, variantId: string, format: 'svg' | 'png' = 'svg', download = false) =>
  `/api/perfumes/${perfumeId}/variants/${variantId}/barcode?format=${format}${download ? '&download=1' : ''}`;