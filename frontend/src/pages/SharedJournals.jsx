import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useGetMySharedJournalsQuery } from "../redux/api/sharedJournalApiSlice";
import Loader from "../components/Loader";
import CreateSharedJournal from "../components/shared/CreateSharedJournal";
import SharedJournalCard   from "../components/shared/SharedJournalCard";

const SharedJournals = () => {
  const user = useSelector((state) => state.user.data);
  if (!user) return <Navigate to="/login" replace />;

  const currentUserId = user.data._id;

  const { data, isLoading, isError } = useGetMySharedJournalsQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  const journals = data?.data ?? [];

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-10"
      style={{ minHeight: "calc(100dvh - 64px - 52px)" }}
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shared Journals</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Private spaces you share with one other LPU student.
          </p>
        </div>
        <CreateSharedJournal />
      </div>

      {/* Encryption callout */}
      <div className="alert alert-warning rounded-2xl text-sm mb-8 py-3">
        <span className="text-lg">🔓</span>
        <div>
          <p className="font-semibold">Shared entries are not encrypted</p>
          <p className="text-base-content/70 text-xs">
            Both collaborators can read every entry in a shared journal. Keep sensitive
            thoughts in your personal (encrypted) journal.
          </p>
        </div>
      </div>

      {isError && (
        <p className="text-error text-center">Failed to load shared journals. Please refresh.</p>
      )}

      {/* Empty state */}
      {!isError && journals.length === 0 && (
        <div className="text-center py-24">
          <span className="text-6xl block mb-4">👥</span>
          <h2 className="text-2xl font-bold mb-2">No shared journals yet</h2>
          <p className="text-base-content/60 mb-6 max-w-sm mx-auto">
            Create one and invite a friend, classmate, or study partner to write together.
          </p>
          <CreateSharedJournal />
        </div>
      )}

      {/* Journal grid */}
      {journals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {journals.map((journal) => (
            <SharedJournalCard
              key={journal._id}
              journal={journal}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedJournals;