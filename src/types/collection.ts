import type { CloudImage, CollectionGroup } from './index';

export interface ProductCollection {
  _id: string;
  name: string;
  slug: string;
  group: CollectionGroup;
  description?: string;
  image?: CloudImage;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}