import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

// ── Tech stack items ──────────────────────────────────────────────
const techStack = [
  { icon: "⚛️",  label: "React 19",        sublabel: "UI Library"          },
  { icon: "🖥️",  label: "Node + Express",  sublabel: "Backend"             },
  { icon: "🗄️",  label: "MongoDB",          sublabel: "Database"            },
  { icon: "🔑",  label: "JWT + Cookies",    sublabel: "Auth"                },
  { icon: "📡",  label: "Redux Toolkit",    sublabel: "State Management"    },
  { icon: "🔐",  label: "AES-256",          sublabel: "Client Encryption"   },
  { icon: "🤖",  label: "Gemini AI",        sublabel: "Mood Detection"      },
  { icon: "⚡",  label: "Redis Cache",      sublabel: "Performance"         },
];

const features = [
  { emoji: "✅", title: "Write & Manage Entries",   desc: "Create, edit, and delete journal entries with full encryption." },
  { emoji: "📅", title: "Track Your Memories",      desc: "Capture experiences from any date — your journey documented." },
  { emoji: "🎨", title: "Personalize Your Profile", desc: "Customize your identity while keeping your account secure." },
  { emoji: "📊", title: "Analytics Dashboard",      desc: "Mood trends, writing streaks, weekly & monthly activity charts." },
  { emoji: "🔍", title: "Smart Search",             desc: "Search titles and encrypted content by keyword, mood, or date." },
  { emoji: "🤖", title: "AI Mood Detection",        desc: "Gemini 2.0 Flash auto-detects your mood from journal content." },
];

// ── Contact form component ────────────────────────────────────────
const ContactForm = () => {
  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    // ── Send via mailto as a fallback (no backend endpoint needed) ──
    // If you add a /api/contact route later, replace this block.
    const subject = encodeURIComponent(`Project Inquiry from ${form.name}`);
    const body    = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not provided"}\n\nMessage:\n${form.message}`
    );

    // Open mailto — works without a backend
    window.location.href = `mailto:koushikghosh@lpu.in?subject=${subject}&body=${body}`;

    toast.success("Opening your email client to send the message!");

    setForm({ name: "", email: "", phone: "", message: "" });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name + Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Your Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Koushik Ghosh"
            className="input input-bordered rounded-xl"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Email Address <span className="text-error">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="input input-bordered rounded-xl"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Contact Number{" "}
          <span className="text-base-content/40 text-xs">(optional)</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+91 98765 43210"
          className="input input-bordered rounded-xl"
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Project Details / Message <span className="text-error">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Describe the project you have in mind — tech stack preferences, timeline, scope…"
          className="textarea textarea-bordered rounded-xl h-32 resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary rounded-xl w-full"
      >
        {submitting ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>📨 Send Message</>
        )}
      </button>
    </form>
  );
};

// ── Main About page ───────────────────────────────────────────────
const About = () => {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero banner ────────────────────────────────────────── */}
      <section className="relative py-20 text-center px-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(var(--s)/0.10) 0%, transparent 70%)",
          }}
        />
        <p className="text-secondary text-xs font-bold tracking-widest uppercase mb-3">About DayBook</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
          Your journal, your privacy,{" "}
          <span className="text-primary">your data.</span>
        </h1>
        <p className="text-base-content/60 max-w-2xl mx-auto text-lg leading-relaxed">
          DayBook is a secure, full-featured personal journaling app built for
          LPU students. Every entry is AES-encrypted on your device — the server
          never sees your plaintext thoughts.
        </p>
      </section>

      {/* ── What You Can Do ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">Capabilities</p>
          <h2 className="text-2xl sm:text-3xl font-black">What You Can Do</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-base-200 hover:bg-base-300 transition-colors rounded-2xl p-6 border border-base-300 hover:border-primary/30 flex flex-col gap-2"
            >
              <span className="text-3xl">{emoji}</span>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* ── Tech Stack ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-secondary text-xs font-bold tracking-widest uppercase mb-2">Built With</p>
          <h2 className="text-2xl sm:text-3xl font-black">Tech Stack</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {techStack.map(({ icon, label, sublabel }) => (
            <div
              key={label}
              className="bg-base-200 hover:bg-base-300 transition-colors rounded-2xl p-5 text-center border border-base-300 hover:border-secondary/30"
            >
              <span className="text-3xl block mb-2">{icon}</span>
              <p className="font-bold text-sm">{label}</p>
              <p className="text-xs text-base-content/50 mt-0.5">{sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* ── Security Design ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-primary/10 border border-primary/20 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <span className="text-5xl shrink-0">🔐</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-2">Zero-Knowledge Encryption</h2>
              <p className="text-base-content/70 text-sm leading-relaxed mb-3">
                Your login password is used as the AES-256 encryption key — derived
                in your browser using SHA-256. The server stores and returns only
                ciphertext. Even Koushik (the developer) cannot read your entries.
              </p>
              <p className="text-base-content/70 text-sm leading-relaxed">
                OTPs are never stored in plaintext — only bcrypt hashes. JWT auth
                is issued via secure <code className="bg-base-300 px-1.5 py-0.5 rounded text-xs">httpOnly</code>{" "}
                cookies with a 7-day expiry and <code className="bg-base-300 px-1.5 py-0.5 rounded text-xs">sameSite: None</code> for CORS safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* ── Developer + LinkedIn ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">The Developer</p>
          <h2 className="text-2xl sm:text-3xl font-black">Meet Koushik Ghosh</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 items-center bg-base-200 rounded-3xl p-8 border border-base-300">
          {/* Avatar placeholder */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-4xl font-black text-primary">
              K
            </div>
            <p className="font-bold text-lg">Koushik Ghosh</p>
            <p className="text-xs text-base-content/50 text-center">
              Full-Stack Developer<br />LPU Student
            </p>
          </div>

          {/* Bio */}
          <div className="flex-1">
            <p className="text-base-content/70 leading-relaxed mb-5 text-sm">
              Hi! I'm Koushik, the developer behind DayBook. I built this as a
              secure journaling platform exclusively for LPU students — combining
              modern full-stack engineering with privacy-first design. I love
              building web applications that are both technically robust and
              genuinely useful.
            </p>
            <p className="text-base-content/70 leading-relaxed mb-6 text-sm">
              I'm open to collaborations, freelance projects, and interesting
              engineering conversations. Let's connect!
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/koushik-programmer/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary rounded-xl gap-2"
              >
                {/* LinkedIn SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Connect on LinkedIn
              </a>

              {/* <a
                href="https://github.com/thenileshnishad/daybook"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline rounded-xl gap-2"
              >
                {/* GitHub SVG icon */}
                {/* <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a> */} 
            </div>
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6" />

      {/* ── Hire / Project Inquiry Form ────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-12 mb-10">
        <div className="text-center mb-10">
          <p className="text-secondary text-xs font-bold tracking-widest uppercase mb-2">Work Together</p>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Have a Project in Mind?</h2>
          <p className="text-base-content/60 max-w-xl mx-auto text-sm leading-relaxed">
            Looking to build something great? Whether it's a web app, an API, a
            dashboard, or a full-stack product — drop your details below and
            Koushik will get back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left info panel */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {[
              {
                icon: "💼",
                title: "What I build",
                desc: "Full-stack web apps, REST APIs, React frontends, database design, authentication systems, real-time features.",
              },
              {
                icon: "⚡",
                title: "Tech I use",
                desc: "React, Node.js, Express, MongoDB, Redis, Tailwind, DaisyUI, Redux Toolkit, and more.",
              },
              {
                icon: "🤝",
                title: "How to reach me",
                desc: "Fill the form — it opens your email client with the details pre-filled. Or connect on LinkedIn directly.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 bg-base-200 rounded-2xl p-5 border border-base-300"
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-sm mb-1">{title}</p>
                  <p className="text-xs text-base-content/60 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right form */}
          <div className="lg:col-span-3 bg-base-200 rounded-3xl p-7 border border-base-300">
            <h3 className="font-black text-lg mb-1">Send a Message</h3>
            <p className="text-xs text-base-content/50 mb-5">
              Fields marked <span className="text-error">*</span> are required.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;