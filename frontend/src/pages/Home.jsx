import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Home = () => {
  const user = useSelector((state) => state.user.data);

  // Safely extract — works for both login response shape and profile query shape
  const userData  = user?.data ?? {};
  const firstName = userData.firstName   ?? "";
  const lastName  = userData.lastName    ?? "";
  const photoUrl  = userData.profilePhoto ?? null;

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center items-center text-center min-h-[calc(100svh-64px-52px)] px-6 py-16">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 10%, oklch(var(--p)/0.12) 0%, transparent 65%)",
          }}
        />

        {user ? (
          <>
            {/* Profile photo or initials */}
            <div className="mb-6 relative">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-2xl mx-auto ring-4 ring-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-3xl font-black text-primary mx-auto select-none shadow-xl">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-base-100 shadow" title="Online" />
            </div>

            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
              Hey, {firstName}! 👋
            </h1>
            <p className="text-base-content/60 text-lg max-w-lg mb-10 leading-relaxed">
              Your journal is waiting. Capture today's thoughts, track your mood, and
              look back on your journey.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/entries" className="btn btn-primary rounded-2xl px-8 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
                📓 Open My Journal
              </Link>
              <Link to="/dashboard" className="btn btn-outline rounded-2xl px-8 hover:-translate-y-0.5 transition-all duration-200">
                📊 View Dashboard
              </Link>
              <Link to="/feed" className="btn btn-ghost rounded-2xl px-8 hover:-translate-y-0.5 transition-all duration-200">
                🌍 Today's Feed
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <span className="text-6xl drop-shadow-lg">📓</span>
            </div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">DayBook for LPU</p>
            <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight leading-tight">
              A journal that's{" "}
              <span className="text-primary">just for you</span>
            </h1>
            <p className="text-base-content/60 text-lg max-w-xl mb-10 leading-relaxed">
              DayBook is a private space to write about your day, track how
              you're feeling, and look back on your journey — made exclusively for LPU students.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup" className="btn btn-primary btn-lg rounded-2xl px-10 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
                Start Journaling — it's free
              </Link>
              <Link to="/about" className="btn btn-outline btn-lg rounded-2xl px-8 hover:-translate-y-0.5 transition-all duration-200">
                Learn More
              </Link>
            </div>
          </>
        )}

        <div className="absolute bottom-8 animate-bounce opacity-30 hidden sm:flex flex-col items-center gap-1">
          <span className="text-xs tracking-widest">scroll</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── Stats bar (logged in) ─────────────────────────────────── */}
      {user && (
        <section className="bg-base-200/80 border-y border-base-300 py-6 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: "📝", label: "Write daily", sub: "capture your thoughts" },
              { emoji: "😊", label: "Track mood", sub: "see patterns over time" },
              { emoji: "🔍", label: "Search entries", sub: "find any memory" },
              { emoji: "📊", label: "Analytics", sub: "visualize your journey" },
            ].map(({ emoji, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-base-content/50">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── What you can do ──────────────────────────────────────── */}
      {!user && (
        <section className="bg-base-200/60 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">What you can do with DayBook</h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              No complicated setup. Just open it and start writing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                emoji: "✍️",
                title: "Write every day",
                desc: "Add a journal entry for any day. Give it a title, pick your mood, and write as much or as little as you want.",
                color: "border-primary/30 hover:border-primary/60",
              },
              {
                emoji: "😊",
                title: "Track your mood",
                desc: "Choose how you're feeling — happy, sad, angry, or neutral. Over time you'll start to notice patterns.",
                color: "border-success/30 hover:border-success/60",
              },
              {
                emoji: "🔍",
                title: "Find old entries",
                desc: "Search by a word, a date, or a mood. Your past entries are always easy to find.",
                color: "border-secondary/30 hover:border-secondary/60",
              },
              {
                emoji: "📈",
                title: "See your progress",
                desc: "Check your dashboard to see how often you've been writing and how your mood has shifted over the weeks.",
                color: "border-accent/30 hover:border-accent/60",
              },
            ].map(({ emoji, title, desc, color }) => (
              <div
                key={title}
                className={`bg-base-100 rounded-3xl p-7 border-2 ${color} hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
              >
                <span className="text-3xl block mb-3">{emoji}</span>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-secondary text-xs font-bold tracking-widest uppercase mb-3">Setup</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">Getting started is easy</h2>
            <p className="text-base-content/60">Three steps and you're in.</p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {[
              {
                num: "1",
                title: "Sign up with your LPU email",
                desc: "Use your @lpu.in email address. We'll send a short verification code to confirm it's you.",
              },
              {
                num: "2",
                title: "Write your first entry",
                desc: "Hit the '+' button, write about your day, and save it. That's all there is to it.",
              },
              {
                num: "3",
                title: "Come back tomorrow",
                desc: "The best journals are built one day at a time. Even two sentences count.",
              },
            ].map(({ num, title, desc }) => (
              <div
                key={num}
                className="flex gap-5 items-start bg-base-200 rounded-2xl p-6 border border-base-300 hover:border-primary/30 hover:bg-base-200/80 transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-full bg-primary text-primary-content font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                  {num}
                </span>
                <div>
                  <p className="font-bold text-base mb-1">{title}</p>
                  <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Privacy note ─────────────────────────────────────────── */}
      {!user && (
        <section className="bg-base-200/60 py-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-5xl block mb-4">🔒</span>
            <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">Your entries are private</h2>
            <p className="text-base-content/60 leading-relaxed max-w-lg mx-auto">
              Everything you write is encrypted with AES-256 right in your browser —
              before it ever reaches the server. Your journal is yours alone.
            </p>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 px-6 text-center">
          <div
            className="max-w-xl mx-auto rounded-3xl p-10 border border-base-300 relative overflow-hidden"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(var(--p)/0.08) 0%, transparent 70%)",
            }}
          >
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">Join DayBook</p>
            <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">Ready to start?</h2>
            <p className="text-base-content/60 mb-8 text-sm leading-relaxed">
              Join your fellow LPU students and start writing today.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg rounded-2xl px-10 shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
              Create Your Free Account
            </Link>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;