import { baseApi } from './baseApi';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getCategories: build.query({
      query: () => ({ url: '/categories' })
    })
  })
});

export const { useGetCategoriesQuery } = categoryApi;
