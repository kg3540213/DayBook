import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const postsApiSlice = createApi({
  reducerPath: "postsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/api/posts`,
    credentials: "include",
  }),
  tagTypes: ["Posts", "PostCount"],
  endpoints: (builder) => ({
    // ── Get today's feed ──
    getTodayFeed: builder.query({
      query: () => "/",
      providesTags: ["Posts"],
      // Poll every 30 seconds to keep feed fresh
      pollingInterval: 30000,
    }),

    // ── Get user's post count for today ──
    getUserPostCount: builder.query({
      query: () => "/my/count",
      providesTags: ["PostCount"],
    }),

    // ── Create new post ──
    createPost: builder.mutation({
      query: (content) => ({
        url: "/",
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Posts", "PostCount"],
    }),

    // ── Delete post ──
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Posts", "PostCount"],
    }),
  }),
});

export const {
  useGetTodayFeedQuery,
  useGetUserPostCountQuery,
  useCreatePostMutation,
  useDeletePostMutation,
} = postsApiSlice;
