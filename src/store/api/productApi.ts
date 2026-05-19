import { baseApi } from './baseApi';

export const productApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    getProducts: build.query({
      query: (params?: Record<string, any>) => ({ url: '/products', params })
    }),
    getProductBySlug: build.query({
      query: (slug: string) => ({ url: `/products/${slug}` })
    })
  })
});

export const { useGetProductsQuery, useGetProductBySlugQuery } = productApi;
