import { configureStore } from "@reduxjs/toolkit";
import apiSlice from "./api/apiSlice";
import { postsApiSlice } from "./api/postsApiSlice";
import userReducer from "./features/userSlice";

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [postsApiSlice.reducerPath]: postsApiSlice.reducer,
    user: userReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(postsApiSlice.middleware),
});

export default store;
