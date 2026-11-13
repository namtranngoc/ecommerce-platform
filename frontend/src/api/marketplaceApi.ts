import axiosClient from './axiosClient';

export const marketplaceApi = {
  // --- SHOP ---
  createShop: (data: { name: string; description?: string }) =>
    axiosClient.post('/shops', data),
  getMyShop: () => axiosClient.get('/shops/my-shop'),
  getAllShopsAdmin: () => axiosClient.get('/shops/admin/all'),
  toggleShopStatus: (shopId: string, isActive: boolean) =>
    axiosClient.patch(`/shops/${shopId}/status`, { isActive }),

  // --- PRODUCT ---
  getAllProducts: () => axiosClient.get('/products'),
  getMyProducts: () => axiosClient.get('/products/my-products'),
  createProduct: (data: {
    name: string;
    sku: string;
    price: number;
    stock: number;
    imageUrl?: string;
  }) => axiosClient.post('/products', data),
  updateProduct: (
    id: string,
    data: { name?: string; sku?: string; price?: number; stock?: number; imageUrl?: string },
  ) => axiosClient.patch(`/products/${id}`, data),
  deleteProduct: (id: string) => axiosClient.delete(`/products/${id}`),

  // --- ORDER & ADMIN ---
  createOrder: (data: {
    productId: string;
    quantity: number;
    buyerPhone: string;
    shippingAddress: string;
  }) => axiosClient.post('/orders', data),
  getMyOrders: () => axiosClient.get('/orders/my-orders'),
  updateOrderBuyerInfo: (orderId: string, data: { buyerPhone: string; shippingAddress: string }) =>
    axiosClient.patch(`/orders/${orderId}/buyer-info`, data),
  cancelOrderByBuyer: (orderId: string, reason?: string) =>
    axiosClient.patch(`/orders/${orderId}/buyer-cancel`, { reason }),

  getMyShopOrders: () => axiosClient.get('/orders/my-shop-orders'),
  updateShopOrderStatus: (
    orderId: string,
    data: { status: 'PREPARING' | 'HANDED_OVER' | 'DELIVERED' | 'CANCELLED'; cancelReason?: string },
  ) => axiosClient.patch(`/orders/${orderId}/shop-status`, data),

  getAllOrdersAdmin: () => axiosClient.get('/orders/admin/all'),
  getAllCustomersAdmin: () => axiosClient.get('/auth/admin/customers'),
};