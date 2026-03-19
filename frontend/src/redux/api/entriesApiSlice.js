import apiSlice from "./apiSlice";

const entriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addEntry: builder.mutation({
      query: (data) => ({ url: "/entries", method: "POST", body: data }),
      invalidatesTags: ["Entries"],
    }),

    getEntries: builder.query({
      query: () => "/entries",
      providesTags: ["Entries"],
    }),

    getEntry: builder.query({
      query: (id) => `/entries/${id}`,
    }),

    updateEntry: builder.mutation({
      query: ({ id, data }) => ({
        url: `/entries/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Entries"],
    }),

    deleteEntry: builder.mutation({
      query: (id) => ({ url: `/entries/${id}`, method: "DELETE" }),
      invalidatesTags: ["Entries"],
    }),

    searchEntry: builder.query({
      query: (text) => ({
        url: "/entries/search",
        method: "GET",
        params: { text },
      }),
    }),

    // ── AI Mood Analysis ─────────────────────────────────────────
    // Send plain-text content to backend → Gemini → returns mood emoji
    analyzeMood: builder.mutation({
      query: (content) => ({
        url: "/entries/analyze",
        method: "POST",
        body: { content },
      }),
    }),

    // ── Analytics ────────────────────────────────────────────────

    getMoodAnalytics: builder.query({
      query: () => "/entries/analytics/mood",
      providesTags: ["Entries"],
    }),

    // ?weeks=8 — last N ISO weeks, default 8
    getEntriesPerWeek: builder.query({
      query: (weeks = 8) => ({
        url: "/entries/analytics/weekly",
        params: { weeks },
      }),
      providesTags: ["Entries"],
    }),

    // ?months=6 — last N calendar months, default 6
    getEntriesPerMonth: builder.query({
      query: (months = 6) => ({
        url: "/entries/analytics/monthly",
        params: { months },
      }),
      providesTags: ["Entries"],
    }),

    // Current streak, longest streak, total active days
    getWritingStreak: builder.query({
      query: () => "/entries/analytics/streak",
      providesTags: ["Entries"],
    }),
  }),
});

export const {
  useAddEntryMutation,
  useGetEntriesQuery,
  useGetEntryQuery,
  useUpdateEntryMutation,
  useDeleteEntryMutation,
  useSearchEntryQuery,
  useAnalyzeMoodMutation,
  useGetMoodAnalyticsQuery,
  useGetEntriesPerWeekQuery,
  useGetEntriesPerMonthQuery,
  useGetWritingStreakQuery,
} = entriesApiSlice;