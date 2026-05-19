import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getAdminDashboard: build.query({
      query: () => ({ url: '/admin/dashboard' }),
      providesTags: ['Admin']
    }),
    getSellerApprovals: build.query({
      query: () => ({ url: '/admin/seller-approvals' }),
      providesTags: ['Admin']
    }),
    reviewSellerApproval: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/admin/seller-approvals/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Admin']
    }),
    getUsersOverview: build.query({
      query: () => ({ url: '/admin/users' }),
      providesTags: ['Admin']
    }),
    getOrdersOverview: build.query({
      query: () => ({ url: '/admin/orders' }),
      providesTags: ['Admin']
    }),
    getReturnRequestsOverview: build.query({
      query: () => ({ url: '/admin/returns' }),
      providesTags: ['Admin', 'Return']
    }),
    getProductModeration: build.query({
      query: () => ({ url: '/admin/products/moderation' }),
      providesTags: ['Admin']
    }),
    reviewProduct: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Admin', 'Product']
    }),
    getRevenueAnalytics: build.query({
      query: () => ({ url: '/admin/revenue' }),
      providesTags: ['Admin']
    })
  })
});

export const {
  useGetAdminDashboardQuery,
  useGetSellerApprovalsQuery,
  useReviewSellerApprovalMutation,
  useGetUsersOverviewQuery,
  useGetOrdersOverviewQuery,
  useGetReturnRequestsOverviewQuery,
  useGetProductModerationQuery,
  useReviewProductMutation,
  useGetRevenueAnalyticsQuery
} = adminApi;
