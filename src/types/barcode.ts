import type { Perfume, Variant } from './index';

/** GET /perfumes/barcode/:code */
export interface BarcodeLookup {
  barcode: string;
  variant: Variant;
  perfume: Perfume;
}