import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Home = () => {
  const user = useSelector((state) => state.user.data);

  const firstName  = user?.data?.data?.firstName  ?? "";
  const lastName   = user?.data?.data?.lastName   ?? "";
  const photoUrl   = user?.data?.data?.profilePhoto ?? null;

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center items-center text-center min-h-[calc(100svh-64px-52px)] px-6 py-16">
        {user ? (
          <>
            {/* Profile photo or initials */}
            <div className="mb-5">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary shadow-lg mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center text-2xl font-black text-primary mx-auto select-none">
                  {initials}
                </div>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Hey, {firstName}! 👋
            </h1>
            <p className="text-base-content/60 text-lg max-w-lg mb-8 leading-relaxed">
              Great to have you back. Your journal is waiting — go ahead and
              write about your day, your thoughts, or anything on your mind.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/entries" className="btn btn-primary rounded-2xl px-8">
                Open My Journal
              </Link>
              <Link to="/dashboard" className="btn btn-outline rounded-2xl px-8">
                View Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="text-5xl mb-5">📓</span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              A journal that's just for you
            </h1>
            <p className="text-base-content/60 text-lg max-w-lg mb-8 leading-relaxed">
              DayBook is a private space to write about your day, track how
              you're feeling, and look back on your journey. Simple, personal,
              and made only for LPU students.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/signup" className="btn btn-primary rounded-2xl px-8">
                Start Journaling
              </Link>
              <Link to="/about" className="btn btn-outline rounded-2xl px-8">
                Learn More
              </Link>
            </div>
          </>
        )}

        <div className="absolute bottom-8 animate-bounce opacity-30 hidden sm:flex flex-col items-center gap-1">
          <span className="text-xs">scroll down</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── What you can do ──────────────────────────────────────── */}
      <section className="bg-base-200/60 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">What you can do with DayBook</h2>
          <p className="text-base-content/60">
            No complicated setup. Just open it and start writing.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              emoji: "✍️",
              title: "Write every day",
              desc: "Add a journal entry for any day. Give it a title, pick your mood, and write as much or as little as you want.",
            },
            {
              emoji: "😊",
              title: "Track your mood",
              desc: "Choose how you're feeling — happy, sad, angry, or neutral. Over time you'll start to notice patterns.",
            },
            {
              emoji: "🔍",
              title: "Find old entries",
              desc: "Search by a word, a date, or a mood. Your past entries are always easy to find.",
            },
            {
              emoji: "📈",
              title: "See your progress",
              desc: "Check your dashboard to see how often you've been writing and how your mood has shifted over the weeks.",
            },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-base-100 rounded-3xl p-7 border border-base-300 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <span className="text-3xl block mb-3">{emoji}</span>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Getting started is easy</h2>
          <p className="text-base-content/60">Three steps and you're in.</p>
        </div>

        <div className="max-w-3xl mx-auto flex flex-col gap-5">
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
              className="flex gap-5 items-start bg-base-200 rounded-2xl p-6 border border-base-300"
            >
              <span className="w-9 h-9 rounded-full bg-primary text-primary-content font-bold text-sm flex items-center justify-center shrink-0">
                {num}
              </span>
              <div>
                <p className="font-semibold mb-1">{title}</p>
                <p className="text-base-content/60 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Privacy note ─────────────────────────────────────────── */}
      <section className="bg-base-200/60 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-4xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold mb-3">Your entries are private</h2>
          <p className="text-base-content/60 leading-relaxed">
            Everything you write stays between you and your device. Your journal
            is yours alone — write freely without worrying about who might see it.
          </p>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {!user && (
        <section className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to start?</h2>
          <p className="text-base-content/60 mb-8 max-w-md mx-auto">
            Join your fellow LPU students and start writing today. It's free.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg rounded-2xl px-10">
            Create Your Account
          </Link>
        </section>
      )}

    </div>
  );
};

export default Home;