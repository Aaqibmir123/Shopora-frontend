import { baseApi } from './baseApi';

export const returnApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getMyReturnRequests: build.query({
      query: () => ({ url: '/returns/me' }),
      transformResponse: (response: any) => response.data,
      providesTags: ['Order']
    }),
    getReturnRequest: build.query({
      query: (id: string) => ({ url: `/returns/me/${id}` }),
      transformResponse: (response: any) => response.data,
      providesTags: ['Order']
    }),
    createReturnRequest: build.mutation({
      query: (body: any) => ({ url: '/returns', method: 'POST', body }),
      invalidatesTags: ['Order', 'Admin', 'Return']
    }),
    reviewReturnRequest: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/returns/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Order', 'Admin', 'Return']
    })
  })
});

export const {
  useGetMyReturnRequestsQuery,
  useGetReturnRequestQuery,
  useCreateReturnRequestMutation,
  useReviewReturnRequestMutation
} = returnApi;
