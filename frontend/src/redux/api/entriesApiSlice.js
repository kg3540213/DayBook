// frontend/src/redux/api/entriesApiSlice.js
import apiSlice from "./apiSlice";

const entriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addEntry: builder.mutation({
      query: (data) => ({ url: "/entries", method: "POST", body: data }),
      invalidatesTags: ["Entries"],
    }),

    // Fetch ALL entries (high limit) so client-side search/filter works
    // This is the single source of truth — everything else is derived client-side.
    getEntries: builder.query({
      query: () => "/entries?limit=1000",
      providesTags: ["Entries"],
    }),

    getEntry: builder.query({
      query: (id) => `/entries/${id}`,
      // No providesTags here — single entry reads don't need to invalidate the list
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

    // Toggle pin — uses dedicated PATCH /:id/pin endpoint
    togglePin: builder.mutation({
      query: (id) => ({
        url: `/entries/${id}/pin`,
        method: "PATCH",
      }),
      invalidatesTags: ["Entries"],
    }),

    // Server-side search — kept for backward compat but primary path is client-side
    searchEntry: builder.query({
      query: (filters = {}) => {
        const { text, mood, dateFrom, dateTo, tag, pinned, page, limit } = filters;
        const params = {};
        if (text)     params.text     = text;
        if (mood)     params.mood     = mood;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo)   params.dateTo   = dateTo;
        if (tag)      params.tag      = tag;
        if (pinned)   params.pinned   = pinned;
        if (page)     params.page     = page;
        if (limit)    params.limit    = limit;
        return { url: "/entries/search", method: "GET", params };
      },
    }),

    // AI Mood Analysis
    analyzeMood: builder.mutation({
      query: (content) => ({
        url: "/entries/analyze",
        method: "POST",
        body: { content },
      }),
    }),

    // Calendar data — BUG FIX: this was missing from the original export list
    getCalendarData: builder.query({
      query: ({ year, month }) => ({
        url: "/entries/calendar",
        params: { year, month },
      }),
      providesTags: ["Entries"],
    }),

    // Export entries
    exportEntries: builder.query({
      query: (format = "json") => ({
        url: "/entries/export",
        params: { format },
      }),
    }),

    // User tags
    getUserTags: builder.query({
      query: () => "/entries/tags",
      providesTags: ["Entries"],
    }),

    // Analytics
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

    // Saved Searches / Smart Folders
    getSavedSearches: builder.query({
      query: () => "/entries/saved-searches",
      providesTags: ["SavedSearches"],
    }),

    saveSavedSearch: builder.mutation({
      query: (data) => ({
        url: "/entries/saved-searches",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SavedSearches"],
    }),

    deleteSavedSearch: builder.mutation({
      query: (id) => ({
        url: `/entries/saved-searches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SavedSearches"],
    }),
  }),
});

export const {
  useAddEntryMutation,
  useGetEntriesQuery,
  useGetEntryQuery,
  useUpdateEntryMutation,
  useDeleteEntryMutation,
  useTogglePinMutation,
  useSearchEntryQuery,
  useAnalyzeMoodMutation,
  useGetCalendarDataQuery,   // BUG FIX: was missing from original exports
  useExportEntriesQuery,
  useGetUserTagsQuery,
  useGetMoodAnalyticsQuery,
  useGetEntriesPerWeekQuery,
  useGetEntriesPerMonthQuery,
  useGetWritingStreakQuery,
  useGetSavedSearchesQuery,
  useSaveSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = entriesApiSlice;