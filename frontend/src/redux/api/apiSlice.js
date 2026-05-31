import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery,
  tagTypes: ["User", "Entries", "SavedSearches"],
  endpoints: () => ({}),
});

export default apiSlice;
