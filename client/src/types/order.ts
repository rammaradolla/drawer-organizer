export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  cart_json: CartItem[];
  total_price: number;
  status: OrderStatus;
  stripe_checkout_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  wood_type: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  price: number;
}

export interface CreateCheckoutSessionRequest {
  userId: string;
  cartItems: CartItem[];
}

export interface CreateCheckoutSessionResponse {
  checkoutUrl: string;
  orderId: string;
} 