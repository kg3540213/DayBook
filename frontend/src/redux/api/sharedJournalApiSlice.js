import apiSlice from "./apiSlice";

const sharedJournalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // ── Journals ──────────────────────────────────────────────────

    getMySharedJournals: builder.query({
      query: () => "/shared-journals",
      providesTags: ["SharedJournals"],
    }),

    getSharedJournal: builder.query({
      query: ({ journalId, page = 1, limit = 10 }) =>
        `/shared-journals/${journalId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { journalId }) => [
        { type: "SharedJournal", id: journalId },
      ],
    }),

    createSharedJournal: builder.mutation({
      query: (data) => ({
        url:    "/shared-journals",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["SharedJournals"],
    }),

    deleteSharedJournal: builder.mutation({
      query: (journalId) => ({
        url:    `/shared-journals/${journalId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SharedJournals"],
    }),

    // ── Invite flow ───────────────────────────────────────────────

    getInviteInfo: builder.query({
      query: (token) => `/shared-journals/invite/${token}`,
    }),

    acceptInvite: builder.mutation({
      query: (token) => ({
        url:    `/shared-journals/invite/${token}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["SharedJournals"],
    }),

    declineInvite: builder.mutation({
      query: (token) => ({
        url:    `/shared-journals/invite/${token}/decline`,
        method: "POST",
      }),
    }),

    // ── Entries ───────────────────────────────────────────────────

    addSharedEntry: builder.mutation({
      query: ({ journalId, data }) => ({
        url:    `/shared-journals/${journalId}/entries`,
        method: "POST",
        body:   data,
      }),
      invalidatesTags: (result, error, { journalId }) => [
        { type: "SharedJournal", id: journalId },
        "SharedJournals",
      ],
    }),

    updateSharedEntry: builder.mutation({
      query: ({ entryId, journalId, data }) => ({
        url:    `/shared-journals/entries/${entryId}`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: (result, error, { journalId }) => [
        { type: "SharedJournal", id: journalId },
      ],
    }),

    deleteSharedEntry: builder.mutation({
      query: ({ entryId, journalId }) => ({
        url:    `/shared-journals/entries/${entryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { journalId }) => [
        { type: "SharedJournal", id: journalId },
      ],
    }),
  }),
});

export const {
  useGetMySharedJournalsQuery,
  useGetSharedJournalQuery,
  useCreateSharedJournalMutation,
  useDeleteSharedJournalMutation,
  useGetInviteInfoQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  useAddSharedEntryMutation,
  useUpdateSharedEntryMutation,
  useDeleteSharedEntryMutation,
} = sharedJournalApiSlice;