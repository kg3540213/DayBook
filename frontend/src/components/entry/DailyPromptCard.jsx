import { useEffect, useRef, useState } from "react";
import { FaBell, FaLightbulb, FaRedo } from "react-icons/fa";
import { toast } from "react-toastify";

const DAILY_PROMPTS = [
  "What felt most meaningful to you today, and why?",
  "Describe a moment that made you smile or feel calm.",
  "What is one thing you want to let go of today?",
  "Write about a small victory you had this week.",
  "What are you carrying mentally right now?",
  "What would you tell your past self about today?",
  "Which emotion felt strongest today, and what triggered it?",
  "What do you want to remember about this day?",
];

const PROMPT_STORAGE_KEY = "daybook-daily-prompt";
const REMINDER_STORAGE_KEY = "daybook-daily-reminder";
const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

const getTodayKey = () => new Date().toISOString().split("T")[0];

const safeReadStorage = (key) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const safeWriteStorage = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors and fall back gracefully.
  }
};

const safeRemoveStorage = (key) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

const getRandomPrompt = (currentPrompt) => {
  const filtered = DAILY_PROMPTS.filter((prompt) => prompt !== currentPrompt);
  const pool = filtered.length > 0 ? filtered : DAILY_PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
};

const DailyPromptCard = () => {
  const [prompt, setPrompt] = useState(DAILY_PROMPTS[0]);
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [reminderLabel, setReminderLabel] = useState("Remind me later");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const todayKey = getTodayKey();
    const storedPrompt = safeReadStorage(PROMPT_STORAGE_KEY);
    const storedReminder = safeReadStorage(REMINDER_STORAGE_KEY);

    if (storedPrompt?.date === todayKey && storedPrompt?.prompt) {
      setPrompt(storedPrompt.prompt);
    } else {
      const nextPrompt = getRandomPrompt(storedPrompt?.prompt);
      setPrompt(nextPrompt);
      safeWriteStorage(PROMPT_STORAGE_KEY, { date: todayKey, prompt: nextPrompt });
    }

    if (storedReminder?.timestamp) {
      const now = Date.now();
      if (storedReminder.timestamp > now) {
        setIsReminderSet(true);
        setReminderLabel(`Reminder set for ${new Date(storedReminder.timestamp).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`);
        scheduleReminder(storedReminder.timestamp);
      } else {
        safeRemoveStorage(REMINDER_STORAGE_KEY);
        setIsReminderSet(false);
        setReminderLabel("Remind me later");
      }
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const scheduleReminder = (timestamp) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    const delay = Math.max(timestamp - Date.now(), 1000);
    timeoutRef.current = window.setTimeout(() => {
      triggerReminder();
    }, delay);
  };

  const triggerReminder = () => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      toast.info("Reminder ready — open DayBook later to revisit your prompt.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission !== "granted") {
        toast.info("Browser notifications are off, but your reminder is still saved.");
        return;
      }

      new Notification("DayBook reflection prompt", {
        body: prompt,
      });
    }).catch(() => {
      toast.info("Reminder ready — open DayBook later to revisit your prompt.");
    });
  };

  const handleNewPrompt = () => {
    const nextPrompt = getRandomPrompt(prompt);
    const todayKey = getTodayKey();
    setPrompt(nextPrompt);
    safeWriteStorage(PROMPT_STORAGE_KEY, { date: todayKey, prompt: nextPrompt });
    toast.success("Fresh prompt picked.");
  };

  const handleReminderToggle = () => {
    if (isReminderSet) {
      safeRemoveStorage(REMINDER_STORAGE_KEY);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      setIsReminderSet(false);
      setReminderLabel("Remind me later");
      toast.info("Reminder canceled.");
      return;
    }

    const now = new Date();
    const target = new Date(now);
    target.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const timestamp = target.getTime();
    safeWriteStorage(REMINDER_STORAGE_KEY, { timestamp, prompt });
    scheduleReminder(timestamp);
    setIsReminderSet(true);
    setReminderLabel(`Reminder set for ${target.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`);
    toast.success("Reminder set for this evening.");
  };

  return (
    <div className="mb-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-base-200 to-base-100 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-primary">
            <FaLightbulb className="text-sm" />
            <h2 className="text-lg font-semibold">Today&apos;s reflection prompt</h2>
          </div>
          <p className="mt-2 text-sm text-base-content/70">
            Use this prompt to start a thoughtful entry or revisit your mood for the day.
          </p>
          <div className="mt-4 rounded-2xl border border-base-content/10 bg-base-100/80 p-4 text-sm font-medium text-base-content/90">
            “{prompt}”
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col">
          <button
            type="button"
            onClick={handleNewPrompt}
            className="btn btn-sm h-10 rounded-2xl border border-base-content/10 bg-base-100 hover:bg-base-200"
          >
            <FaRedo className="text-xs" />
            New prompt
          </button>
          <button
            type="button"
            onClick={handleReminderToggle}
            className={`btn btn-sm h-10 rounded-2xl ${isReminderSet ? "btn-warning" : "btn-primary"}`}
          >
            <FaBell className="text-xs" />
            {isReminderSet ? "Cancel reminder" : "Remind me later"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-base-content/60">
        {isReminderSet ? reminderLabel : "Set a reminder to revisit this prompt later today."}
      </p>
    </div>
  );
};

export default DailyPromptCard;
