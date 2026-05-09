import { configureStore } from '@reduxjs/toolkit'
import { bootstrapApi } from '../features/bootstrap/bootstrapApi.js'

export const store = configureStore({
  reducer: {
    [bootstrapApi.reducerPath]: bootstrapApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(bootstrapApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
