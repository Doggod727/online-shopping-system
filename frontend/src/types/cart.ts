import { Product } from './product';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  id: string;
  productId: string;
  quantity: number;
}

export interface RemoveFromCartPayload {
  id: string;
  productId: string;
}

export interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface CartState {
  items: CartItemType[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

export interface CartApiResponse {
  items: CartItemType[];
  total: number;
}

export interface CartItemWithProductResponse {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
}

export interface CartResponse {
  items: CartItemWithProductResponse[];
  total: number;
}