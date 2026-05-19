import { createSlice } from '@reduxjs/toolkit';

import { products } from '@/data/mock';

type Role = 'shopper' | 'seller' | 'admin';

type UiState = {
  role: Role;
  cart: Record<string, number>;
  wishlist: string[];
};

const initialState: UiState = {
  role: 'shopper',
  cart: {},
  wishlist: []
};

const removeFromArray = (items: string[], value: string) => items.filter((item) => item !== value);

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setRole(state: UiState, action: { payload: Role }) {
      state.role = action.payload;
    },
    setWishlist(state: UiState, action: { payload: string[] }) {
      state.wishlist = [...new Set(action.payload)];
    },
    setCartState(state: UiState, action: { payload: Record<string, number> }) {
      state.cart = { ...action.payload };
    },
    addToCart(state: UiState, action: { payload: string }) {
      const productId = action.payload;
      state.cart[productId] = (state.cart[productId] ?? 0) + 1;
    },
    removeFromCart(state: UiState, action: { payload: string }) {
      delete state.cart[action.payload];
    },
    updateCartQuantity(state: UiState, action: { payload: { productId: string; quantity: number } }) {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.cart[productId];
        return;
      }
      state.cart[productId] = quantity;
    },
    toggleWishlist(state: UiState, action: { payload: string }) {
      const productId = action.payload;
      state.wishlist = state.wishlist.includes(productId)
        ? removeFromArray(state.wishlist, productId)
        : [...state.wishlist, productId];
    },
    removeFromWishlist(state: UiState, action: { payload: string }) {
      state.wishlist = removeFromArray(state.wishlist, action.payload);
    },
    moveWishlistItemToCart(state: UiState, action: { payload: string }) {
      const productId = action.payload;
      state.cart[productId] = (state.cart[productId] ?? 0) + 1;
      state.wishlist = removeFromArray(state.wishlist, productId);
    },
    clearCart(state: UiState) {
      state.cart = {};
    }
  }
});

export const {
  setRole,
  setWishlist,
  setCartState,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  toggleWishlist,
  removeFromWishlist,
  moveWishlistItemToCart
} = uiSlice.actions;

export const { clearCart } = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

export const selectUiState = (state: { ui: UiState }) => state.ui;
export const selectRole = (state: { ui: UiState }) => state.ui.role;
export const selectCartCount = (state: { ui: UiState }) =>
  Object.values(state.ui.cart).reduce((sum, quantity) => sum + quantity, 0);
export const selectWishlistCount = (state: { ui: UiState }) => state.ui.wishlist.length;
export const selectCartQuantity = (productId: string) => (state: { ui: UiState }) => state.ui.cart[productId] ?? 0;
export const selectIsWishlisted = (productId: string) => (state: { ui: UiState }) => state.ui.wishlist.includes(productId);
export const selectWishlistProducts = (state: { ui: UiState }) => products.filter((item) => state.ui.wishlist.includes(item.id));
export const selectCartProducts = (state: { ui: UiState }) =>
  products
    .filter((item) => Boolean(state.ui.cart[item.id]))
    .map((item) => ({ ...item, quantity: state.ui.cart[item.id] }));
