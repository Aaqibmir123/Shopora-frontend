import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi';
import { authReducer } from './slices/authSlice';
import { uiReducer } from './slices/uiSlice';
import { feedbackReducer } from './slices/feedbackSlice';
import { addressReducer } from './slices/addressSlice';
import { sellerReducer } from './slices/sellerSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    feedback: feedbackReducer,
    address: addressReducer,
    seller: sellerReducer
  },
  middleware: (getDefaultMiddleware: any) => getDefaultMiddleware().concat(baseApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
