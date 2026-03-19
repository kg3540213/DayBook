import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  useGetMoodAnalyticsQuery,
  useGetEntriesPerWeekQuery,
  useGetEntriesPerMonthQuery,
  useGetWritingStreakQuery,
} from "../redux/api/entriesApiSlice";
import Loader from "../components/Loader";

// ── Constants ─────────────────────────────────────────────────────

const MOOD_META = [
  { key: "🙂", label: "Happy",   color: "#22c55e" },
  { key: "😔", label: "Sad",     color: "#60a5fa" },
  { key: "😡", label: "Angry",   color: "#f87171" },
  { key: "😐", label: "Neutral", color: "#facc15" },
];

// ── Small reusable components ─────────────────────────────────────

const StatCard = ({ label, value, sub }) => (
  <div className="bg-base-200 rounded-2xl p-5 flex flex-col gap-1 shadow">
    <p className="text-sm text-base-content/60">{label}</p>
    <p className="text-4xl font-bold text-primary">{value}</p>
    {sub && <p className="text-xs text-base-content/50">{sub}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-semibold mb-4">{children}</h2>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-base-200 rounded-2xl p-5 shadow">
    <SectionTitle>{title}</SectionTitle>
    {children}
  </div>
);

// Custom tooltip shared across bar + line charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-3 py-2 text-sm shadow">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.value} {p.value === 1 ? "entry" : "entries"}
        </p>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────

const Dashboard = () => {
  const user = useSelector((state) => state.user.data);
  if (!user) return <Navigate to="/login" replace />;

  const [weekRange, setWeekRange]   = useState(8);
  const [monthRange, setMonthRange] = useState(6);

  const {
    data: streakData,
    isLoading: streakLoading,
    isError: streakError,
  } = useGetWritingStreakQuery();

  const {
    data: moodData,
    isLoading: moodLoading,
    isError: moodError,
  } = useGetMoodAnalyticsQuery();

  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    isError: weeklyError,
  } = useGetEntriesPerWeekQuery(weekRange);

  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    isError: monthlyError,
  } = useGetEntriesPerMonthQuery(monthRange);

  const isLoading = streakLoading || moodLoading || weeklyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100dvh-64px-52px)]">
        <Loader />
      </div>
    );
  }

  // ── Streak ──────────────────────────────────────────────────────
  const streak = streakData?.data ?? { currentStreak: 0, longestStreak: 0, totalDays: 0 };

  // ── Mood pie ────────────────────────────────────────────────────
  const moodAnalytics = moodData?.data?.analytics ?? {};
  const moodTotal     = moodData?.data?.total ?? 0;
  const pieData = MOOD_META
    .map(({ key, label, color }) => ({
      name: `${key} ${label}`,
      value: moodAnalytics[key] ?? 0,
      color,
    }))
    .filter((d) => d.value > 0);

  // ── Weekly bar ──────────────────────────────────────────────────
  const weeklyChartData = weeklyData?.data ?? [];

  // ── Monthly line ────────────────────────────────────────────────
  const monthlyChartData = monthlyData?.data ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 my-10">

      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-base-content/60 mb-8 text-sm">
        Your journaling activity at a glance
      </p>

      {/* ── Streak stat cards ─────────────────────────────────── */}
      {streakError ? (
        <p className="text-error text-sm mb-6">Could not load streak data.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Current Streak"
            value={`${streak.currentStreak} 🔥`}
            sub={streak.currentStreak === 1 ? "day in a row" : "days in a row"}
          />
          <StatCard
            label="Longest Streak"
            value={streak.longestStreak}
            sub="days — personal best"
          />
          <StatCard
            label="Active Days"
            value={streak.totalDays}
            sub="total days with entries"
          />
        </div>
      )}

      {/* ── Mood distribution ─────────────────────────────────── */}
      {moodError ? (
        <p className="text-error text-sm mb-6">Could not load mood data.</p>
      ) : (
        <ChartCard title="Mood Distribution">
          {moodTotal === 0 ? (
            <p className="text-base-content/50 text-sm text-center py-8">
              No entries yet — start writing to see your mood trends.
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Pie chart */}
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} entries`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Text breakdown */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                {MOOD_META.map(({ key, label, color }) => {
                  const count   = moodAnalytics[key] ?? 0;
                  const percent = moodTotal > 0
                    ? Math.round((count / moodTotal) * 100)
                    : 0;
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1">{key} {label}</span>
                      <span className="font-medium">{count}</span>
                      <span className="text-base-content/50">({percent}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      )}

      {/* ── Entries per week ──────────────────────────────────── */}
      {weeklyError ? (
        <p className="text-error text-sm mt-6">Could not load weekly data.</p>
      ) : (
        <div className="mt-6">
          <ChartCard title="Entries per Week">
            {/* Range selector */}
            <div className="flex gap-2 mb-4">
              {[4, 8, 12].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeekRange(w)}
                  className={`btn btn-xs ${weekRange === w ? "btn-primary" : "btn-ghost"}`}
                >
                  {w}w
                </button>
              ))}
            </div>

            {weeklyChartData.length === 0 ? (
              <p className="text-base-content/50 text-sm text-center py-8">
                No entries in the selected range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="entries" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      {/* ── Entries per month ─────────────────────────────────── */}
      {monthlyError ? (
        <p className="text-error text-sm mt-6">Could not load monthly data.</p>
      ) : (
        <div className="mt-6 mb-10">
          <ChartCard title="Entries per Month">
            {/* Range selector */}
            <div className="flex gap-2 mb-4">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonthRange(m)}
                  className={`btn btn-xs ${monthRange === m ? "btn-primary" : "btn-ghost"}`}
                >
                  {m}m
                </button>
              ))}
            </div>

            {monthlyChartData.length === 0 ? (
              <p className="text-base-content/50 text-sm text-center py-8">
                No entries in the selected range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                    name="entries"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

    </div>
  );
};

export default Dashboard;