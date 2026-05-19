import { baseApi } from './baseApi';

export const favoriteApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getFavorites: build.query({
      query: () => ({ url: '/favorites' }),
      providesTags: ['Product']
    }),
    toggleFavorite: build.mutation({
      query: ({ productId, favorited }: { productId: string; favorited: boolean }) => ({
        url: `/favorites/${productId}`,
        method: favorited ? 'POST' : 'DELETE'
      }),
      invalidatesTags: ['Product']
    })
  })
});

export const { useGetFavoritesQuery, useToggleFavoriteMutation } = favoriteApi;
