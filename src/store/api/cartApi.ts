import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getCart: build.query({
      query: () => ({ url: '/cart' }),
      providesTags: ['Cart']
    }),
    upsertCartItem: build.mutation({
      query: (body: any) => ({ url: `/cart/items/${body.productId}`, method: 'PATCH', body }),
      invalidatesTags: ['Cart']
    }),
    removeCartItem: build.mutation({
      query: (productId: string) => ({ url: `/cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart']
    }),
    clearCart: build.mutation({
      query: () => ({ url: '/cart/clear', method: 'DELETE' }),
      invalidatesTags: ['Cart']
    })
  })
});

export const {
  useGetCartQuery,
  useUpsertCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation
} = cartApi;
