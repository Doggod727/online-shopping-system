// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// 订单项接口
export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

// 订单接口
export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// 订单状态更新DTO
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

// 订单响应接口
export interface OrdersResponse {
  orders: Order[];
}

// 单个订单响应接口
export interface OrderResponse {
  order: Order;
}