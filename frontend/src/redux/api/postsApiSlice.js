import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const postsApiSlice = createApi({
  reducerPath: "postsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/posts",
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

    // ── Like a post ──
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/${postId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Posts"],
    }),

    // ── Unlike a post ──
    unlikePost: builder.mutation({
      query: (postId) => ({
        url: `/${postId}/like`,
        method: "DELETE",
      }),
      invalidatesTags: ["Posts"],
    }),

    // ── Add comment to post ──
    addComment: builder.mutation({
      query: ({ postId, content }) => ({
        url: `/${postId}/comment`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Posts"],
    }),

    // ── Delete comment ──
    deleteComment: builder.mutation({
      query: ({ postId, commentId }) => ({
        url: `/${postId}/comment/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Posts"],
    }),
  }),
});

export const {
  useGetTodayFeedQuery,
  useGetUserPostCountQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = postsApiSlice;
