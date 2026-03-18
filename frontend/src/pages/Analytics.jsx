import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useGetMoodAnalyticsQuery } from "../redux/api/entriesApiSlice";
import Loader from "../components/Loader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Mood colors for charts
const MOOD_COLORS = {
  happy: "#22c55e",
  sad: "#3b82f6",
  stressed: "#f97316",
  anxious: "#eab308",
  calm: "#06b6d4",
  excited: "#a855f7",
  angry: "#ef4444",
  neutral: "#6b7280",
};

const USER_MOOD_COLORS = {
  "happy": "#22c55e",
  "sad": "#3b82f6",
  "angry": "#ef4444",
};

const Analytics = () => {
  const user = useSelector((state) => state.user);
  const [days, setDays] = useState(7);

  if (!user?.userInfo) {
    return <Navigate to="/login" replace />;
  }

  const { data: analytics, isLoading, error } = useGetMoodAnalyticsQuery(days);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 mx-7 min-h-[calc(100dvh-64px-52px-40px)]">
        <p className="text-xl text-error">Failed to load analytics data.</p>
      </div>
    );
  }

  const analyticsData = analytics?.data || {};
  const { totalEntries, moodCounts, aiMoodCounts, dailyMoods, period } =
    analyticsData;

  // Prepare data for AI mood pie chart
  const aiMoodPieData = Object.entries(aiMoodCounts || {}).map(
    ([mood, count]) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count,
      color: MOOD_COLORS[mood] || "#6b7280",
    })
  );

  // Prepare data for user mood pie chart
  const userMoodPieData = Object.entries(moodCounts || {}).map(
    ([mood, count]) => ({
      name: mood,
      value: count,
      color: USER_MOOD_COLORS[mood] || "#6b7280",
    })
  );

  // Prepare data for weekly bar chart
  const weeklyData = Object.entries(dailyMoods || {})
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("default", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      entries: data.moods.length,
      aiMoods: data.aiMoods.length,
    }))
    .slice(-7);

  return (
    <div className="p-4 md:p-8 min-h-[calc(100dvh-64px-52px)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mood Analytics</h1>
            <p className="text-base-content/70 mt-1">
              Track your emotional patterns over time
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`btn btn-sm ${days === d ? "btn-primary" : "btn-outline"}`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base">Total Entries</h2>
              <p className="text-4xl font-bold text-primary">
                {totalEntries || 0}
              </p>
              <p className="text-sm text-base-content/70">
                in the last {days} days
              </p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base">Most Common AI Mood</h2>
              <p className="text-4xl font-bold text-secondary">
                {aiMoodPieData.length > 0
                  ? aiMoodPieData.sort((a, b) => b.value - a.value)[0]?.name
                  : "N/A"}
              </p>
              <p className="text-sm text-base-content/70">
                detected from your entries
              </p>
            </div>
          </div>

          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-base">Period</h2>
              <p className="text-lg font-medium">
                {period?.start} - {period?.end}
              </p>
              <p className="text-sm text-base-content/70">
                analyzing {days} days of data
              </p>
            </div>
          </div>
        </div>

        {totalEntries === 0 ? (
          <div className="card bg-base-200 shadow-lg p-8 text-center">
            <p className="text-xl">No entries found for this period.</p>
            <p className="text-base-content/70 mt-2">
              Start journaling to see your mood analytics!
            </p>
          </div>
        ) : (
          <>
            {/* Weekly Entries Chart */}
            <div className="card bg-base-200 shadow-lg mb-8">
              <div className="card-body">
                <h2 className="card-title">Entries Over Time</h2>
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--fallback-b2,oklch(var(--b2)))",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="entries"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="Entries"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Mood Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Detected Moods */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">AI-Detected Mood Distribution</h2>
                  {aiMoodPieData.length > 0 ? (
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={aiMoodPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {aiMoodPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-base-content/70">
                      No AI mood data available yet
                    </p>
                  )}
                </div>
              </div>

              {/* User Selected Moods */}
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">Your Selected Mood Distribution</h2>
                  {userMoodPieData.length > 0 ? (
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userMoodPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {userMoodPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center py-8 text-base-content/70">
                      No mood data available yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mood Legend */}
            <div className="card bg-base-200 shadow-lg mt-8">
              <div className="card-body">
                <h2 className="card-title">AI Mood Categories</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  {Object.entries(MOOD_COLORS).map(([mood, color]) => (
                    <div key={mood} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="capitalize">{mood}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
