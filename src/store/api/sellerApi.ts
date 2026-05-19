import { baseApi } from './baseApi';

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getSellerDashboard: build.query({
      query: () => ({ url: '/seller/dashboard' }),
      providesTags: ['Seller']
    }),
    getSellerProducts: build.query({
      query: () => ({ url: '/seller/products' }),
      providesTags: ['Seller']
    }),
    getSellerInventory: build.query({
      query: () => ({ url: '/seller/inventory' }),
      providesTags: ['Seller']
    }),
    getSellerOrders: build.query({
      query: () => ({ url: '/seller/orders' }),
      providesTags: ['Seller']
    }),
    getSellerEarnings: build.query({
      query: () => ({ url: '/seller/earnings' }),
      providesTags: ['Seller']
    }),
    getSellerStore: build.query({
      query: () => ({ url: '/seller/store' }),
      providesTags: ['Seller']
    }),
    getSellerApplicationStatus: build.query({
      query: () => ({ url: '/seller/application' }),
      providesTags: ['Seller']
    }),
    applySeller: build.mutation({
      query: (body: any) => ({ url: '/seller/apply', method: 'POST', body }),
      invalidatesTags: ['Seller']
    }),
    createSellerProduct: build.mutation({
      query: (body: any) => ({ url: '/seller/products', method: 'POST', body }),
      invalidatesTags: ['Seller', 'Product']
    }),
    updateSellerProduct: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/seller/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Seller', 'Product']
    }),
    deleteSellerProduct: build.mutation({
      query: (id: string) => ({ url: `/seller/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Seller', 'Product']
    }),
    updateSellerStore: build.mutation({
      query: (body: any) => ({ url: '/seller/store', method: 'PATCH', body }),
      invalidatesTags: ['Seller']
    }),
    updateSellerOrderStatus: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/seller/orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Seller', 'Order']
    })
  })
});

export const {
  useGetSellerDashboardQuery,
  useGetSellerProductsQuery,
  useGetSellerInventoryQuery,
  useGetSellerOrdersQuery,
  useGetSellerEarningsQuery,
  useGetSellerStoreQuery,
  useGetSellerApplicationStatusQuery,
  useApplySellerMutation,
  useCreateSellerProductMutation,
  useUpdateSellerProductMutation,
  useDeleteSellerProductMutation,
  useUpdateSellerStoreMutation,
  useUpdateSellerOrderStatusMutation
} = sellerApi;
