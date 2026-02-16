export type Product = {
  id: string | number;
  name: string;
  image: string;
  slug: string;
  price: number | string;
  discount?: number;
  isNew?: boolean;
  rating: number;
  stock: number;
  description: string;
};