import { createSlice } from '@reduxjs/toolkit';

export type SellerProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  mrp?: number;
  stock: number;
  status: 'LIVE' | 'DRAFT' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  imageUrl: string;
  description: string;
  sold: number;
};

export type SellerOrder = {
  id: string;
  customer: string;
  city: string;
  amount: number;
  status: 'PLACED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: number;
  eta: string;
};

export type SellerStore = {
  name: string;
  slug: string;
  logoUrl: string;
  coverUrl: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  open: boolean;
  rating: number;
  reviews: number;
  revenue: number;
  views: number;
};

type SellerState = {
  store: SellerStore;
  products: SellerProduct[];
  orders: SellerOrder[];
};

const initialState: SellerState = {
  store: {
    name: 'Store setup pending',
    slug: '',
    logoUrl: '',
    coverUrl: '',
    description: 'Add your store details to start publishing live products.',
    phone: '',
    email: '',
    address: '',
    open: false,
    rating: 0,
    reviews: 0,
    revenue: 0,
    views: 0
  },
  products: [],
  orders: []
};

const upsertStatus = (stock: number): SellerProduct['status'] => {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= 5) return 'LOW_STOCK';
  return 'LIVE';
};

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    upsertProduct(state: SellerState, action: any) {
      const payload = action.payload as Partial<SellerProduct> & { id?: string };
      const id = payload.id ?? `sp-${Date.now()}`;
      const current = state.products.find((item) => item.id === id);
      const stock = payload.stock ?? current?.stock ?? 0;
      const next: SellerProduct = {
        id,
        title: payload.title ?? current?.title ?? 'New Product',
        category: payload.category ?? current?.category ?? 'General',
        price: payload.price ?? current?.price ?? 0,
        mrp: payload.mrp ?? current?.mrp,
        stock,
        status: payload.status === 'DRAFT' ? 'DRAFT' : upsertStatus(stock),
        imageUrl: payload.imageUrl ?? current?.imageUrl ?? '',
        description: payload.description ?? current?.description ?? '',
        sold: current?.sold ?? 0
      };

      state.products = state.products.some((item) => item.id === id)
        ? state.products.map((item) => (item.id === id ? next : item))
        : [next, ...state.products];
    },
    deleteProduct(state: SellerState, action: any) {
      const id = String(action.payload);
      state.products = state.products.filter((item) => item.id !== id);
    },
    updateProductStock(state: SellerState, action: any) {
      const { id, stock } = action.payload as { id: string; stock: number };
      state.products = state.products.map((item) =>
        item.id === id ? { ...item, stock, status: upsertStatus(stock) } : item
      );
    },
    updateOrderStatus(state: SellerState, action: any) {
      const { id, status } = action.payload as { id: string; status: SellerOrder['status'] };
      state.orders = state.orders.map((order) => (order.id === id ? { ...order, status } : order));
    },
    updateStore(state: SellerState, action: any) {
      state.store = { ...state.store, ...(action.payload as Partial<SellerStore>) };
    },
    toggleStoreOpen(state: SellerState) {
      state.store.open = !state.store.open;
    }
  }
});

export const {
  upsertProduct,
  deleteProduct,
  updateProductStock,
  updateOrderStatus,
  updateStore,
  toggleStoreOpen
} = sellerSlice.actions;

export const sellerReducer = sellerSlice.reducer;

export const selectSellerStore = (state: { seller: SellerState }) => state.seller.store;
export const selectSellerProducts = (state: { seller: SellerState }) => state.seller.products;
export const selectSellerOrders = (state: { seller: SellerState }) => state.seller.orders;
export const selectSellerProductById = (productId: string) => (state: { seller: SellerState }) =>
  state.seller.products.find((item) => item.id === productId) ?? null;
export const selectSellerOrderById = (orderId: string) => (state: { seller: SellerState }) =>
  state.seller.orders.find((item) => item.id === orderId) ?? null;

export const selectSellerStats = (state: { seller: SellerState }) => {
  const products = state.seller.products;
  const orders = state.seller.orders;
  const revenue = state.seller.store.revenue;
  return {
    totalRevenue: revenue,
    activeOrders: orders.filter((order) => ['PLACED', 'PACKED', 'SHIPPED'].includes(order.status)).length,
    deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,
    lowStock: products.filter((product) => product.stock <= 5).length,
    outOfStock: products.filter((product) => product.stock === 0).length,
    liveProducts: products.filter((product) => product.status === 'LIVE').length,
    totalViews: state.seller.store.views,
    rating: state.seller.store.rating
  };
};
