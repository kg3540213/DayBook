import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useGetMoodAnalyticsQuery } from "../redux/api/entriesApiSlice";
import Loader from "../components/Loader";

const MOOD_META = [
  { emoji: "🙂", label: "Happy",   color: "bg-success"  },
  { emoji: "😔", label: "Sad",     color: "bg-info"     },
  { emoji: "😡", label: "Angry",   color: "bg-error"    },
  { emoji: "😐", label: "Neutral", color: "bg-warning"  },
];

const Analytics = () => {
  const user = useSelector((state) => state.user.data);

  if (!user) return <Navigate to="/login" replace />;

  const { data, isLoading, isError } = useGetMoodAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <p className="text-error text-lg">Failed to load analytics. Please try again.</p>
      </div>
    );
  }

  const moodCounts = data?.data || {};
  const total = Object.values(moodCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex justify-center px-4 sm:px-6 lg:px-10 my-10 min-h-[calc(100dvh-64px-52px-80px)]">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">Mood Analytics</h1>
        <p className="text-center mb-8 opacity-60">
          Based on {total} {total === 1 ? "entry" : "entries"}
        </p>

        {total === 0 ? (
          <div className="text-center mt-16">
            <p className="text-xl font-semibold mb-2">No entries yet!</p>
            <p className="opacity-60">
              Start writing journal entries to see your mood trends here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {MOOD_META.map(({ emoji, label, color }) => {
              const count = moodCounts[emoji] || 0;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={emoji} className="bg-base-200 rounded-2xl p-5 shadow">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{emoji}</span>
                      <span className="font-semibold text-lg">{label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xl">{count}</span>
                      <span className="opacity-60 text-sm ml-1">
                        {total > 0 ? `(${percent}%)` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar — pure Tailwind, no chart library */}
                  <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${color} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Summary grid */}
            <div className="bg-base-200 rounded-2xl p-5 shadow mt-4">
              <h2 className="font-semibold text-lg mb-3">Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {MOOD_META.map(({ emoji, label }) => {
                  const count = moodCounts[emoji] || 0;
                  return (
                    <div
                      key={emoji}
                      className="bg-base-300 rounded-xl p-3 flex items-center gap-3"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className="text-xs opacity-60">{label}</p>
                        <p className="font-bold text-lg">{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;