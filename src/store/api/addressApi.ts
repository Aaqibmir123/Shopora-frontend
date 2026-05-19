import { baseApi } from './baseApi';

export const addressApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getAddresses: build.query({
      query: () => ({ url: '/addresses' }),
      providesTags: ['Address']
    }),
    createAddress: build.mutation({
      query: (body: any) => ({ url: '/addresses', method: 'POST', body }),
      invalidatesTags: ['Address']
    }),
    updateAddress: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/addresses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Address']
    }),
    deleteAddress: build.mutation({
      query: (id: string) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address']
    })
  })
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation
} = addressApi;
