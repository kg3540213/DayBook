import apiSlice from "./apiSlice";

const entriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addEntry: builder.mutation({
      query: (data) => ({
        url: "/entries",
        method: "POST",
        body: data,
      }),
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
      query: (id) => ({
        url: `/entries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Entries"],
    }),

    searchEntry: builder.query({
      query: (params) => ({
        url: "/entries/search",
        method: "GET",
        params:
          typeof params === "string"
            ? { text: params }
            : {
                text: params.text,
                startDate: params.startDate,
                endDate: params.endDate,
                mood: params.mood,
                aiMood: params.aiMood,
              },
      }),
    }),

    getMoodAnalytics: builder.query({
      query: (days = 7) => ({
        url: "/entries/analytics",
        method: "GET",
        params: { days },
      }),
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
  useGetMoodAnalyticsQuery,
} = entriesApiSlice;
