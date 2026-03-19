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

    // ── Advanced search ──────────────────────────────────────────
    // Accepts a filters object with any combination of:
    //   { text, mood, dateFrom, dateTo, page, limit }
    // All fields are optional — at least one filter must be non-empty
    // (validated on the backend).
    // Returns: { data, pagination: { total, page, limit, totalPages } }
    searchEntry: builder.query({
      query: (filters = {}) => {
        const { text, mood, dateFrom, dateTo, page, limit } = filters;
        // Build params — omit keys that are empty/undefined so the URL
        // stays clean and the backend "at least one filter" guard works
        const params = {};
        if (text)     params.text     = text;
        if (mood)     params.mood     = mood;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo)   params.dateTo   = dateTo;
        if (page)     params.page     = page;
        if (limit)    params.limit    = limit;
        return { url: "/entries/search", method: "GET", params };
      },
    }),

    // ── AI Mood Analysis ─────────────────────────────────────────
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

    getEntriesPerWeek: builder.query({
      query: (weeks = 8) => ({
        url: "/entries/analytics/weekly",
        params: { weeks },
      }),
      providesTags: ["Entries"],
    }),

    getEntriesPerMonth: builder.query({
      query: (months = 6) => ({
        url: "/entries/analytics/monthly",
        params: { months },
      }),
      providesTags: ["Entries"],
    }),

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