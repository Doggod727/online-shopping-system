// 商品简要信息
export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  vendor_id: string;
  stock: number;
  category?: string;
  image_url?: string;
}

// 收藏项接口
export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: ProductInfo;
}

// 收藏列表响应接口
export interface FavoritesResponse {
  favorites: Favorite[];
}

// 添加收藏DTO
export interface AddToFavoriteDto {
  product_id: string;
} 