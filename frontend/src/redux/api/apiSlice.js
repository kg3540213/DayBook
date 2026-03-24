import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api`,
    credentials: "include",
  }),
  // Added SharedJournals + SharedJournal tag types for cache invalidation
  tagTypes: ["User", "Entries", "SharedJournals", "SharedJournal"],
  endpoints: () => ({}),
});

export default apiSlice;