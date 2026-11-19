export interface ConcentrationOption {
  _id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive?: boolean;
  productCount?: number;
}