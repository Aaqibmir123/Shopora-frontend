import { baseApi } from './baseApi';

export const bannerApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getBanners: build.query({
      query: () => ({ url: '/banners' }),
      providesTags: ['Banner']
    }),
    getAdminBanners: build.query({
      query: () => ({ url: '/admin/banners' }),
      providesTags: ['Banner']
    }),
    createBanner: build.mutation({
      query: (body: any) => ({ url: '/admin/banners', method: 'POST', body }),
      invalidatesTags: ['Banner']
    }),
    updateBanner: build.mutation({
      query: ({ id, ...body }: any) => ({ url: `/admin/banners/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Banner']
    }),
    deleteBanner: build.mutation({
      query: (id: string) => ({ url: `/admin/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner']
    })
  })
});

export const {
  useGetBannersQuery,
  useGetAdminBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation
} = bannerApi;
