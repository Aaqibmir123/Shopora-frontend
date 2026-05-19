import { baseApi } from './baseApi';

export const orderApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getOrders: build.query({
      query: () => ({ url: '/orders' }),
      transformResponse: (response: any) => response.data,
      providesTags: ['Order']
    }),
    getOrder: build.query({
      query: (id: string) => ({ url: `/orders/${id}` }),
      transformResponse: (response: any) => response.data,
      providesTags: ['Order']
    }),
    checkout: build.mutation({
      query: (body: any) => ({ url: '/orders/checkout', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart']
    })
  })
});

export const { useGetOrdersQuery, useGetOrderQuery, useCheckoutMutation } = orderApi;
