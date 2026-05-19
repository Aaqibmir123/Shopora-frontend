import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build: any) => ({
    requestOtp: build.mutation({
      query: (body: any) => ({ url: '/auth/request-otp', method: 'POST', body })
    }),
    verifyOtp: build.mutation({
      query: (body: any) => ({ url: '/auth/verify-otp', method: 'POST', body })
    }),
    adminLogin: build.mutation({
      query: (body: any) => ({ url: '/auth/admin-login', method: 'POST', body })
    }),
    me: build.query({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['Auth']
    }),
    updateMe: build.mutation({
      query: (body: any) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Auth']
    })
  })
});

export const { useRequestOtpMutation, useVerifyOtpMutation, useAdminLoginMutation, useMeQuery, useUpdateMeMutation } = authApi;
