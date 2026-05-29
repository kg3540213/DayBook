// frontend/src/components/entry/EntryCard.jsx
//
// Option A change: useSelector reads state.user.encKey (was state.user.dataKey)

import ReadMore from "./ReadMore";
import EditEntry from "./EditEntry";
import DeleteEntry from "./DeleteEntry";
import { useSelector } from "react-redux";
import { decryptText } from "../../utils/crypto.js";
import { FaThumbtack } from "react-icons/fa";
import { useTogglePinMutation } from "../../redux/api/entriesApiSlice";
import { toast } from "react-toastify";

const MOOD_THEME = {
  "🙂": { border: "border-l-emerald-500/60", badge: "badge-success" },
  "😔": { border: "border-l-blue-500/60",    badge: "badge-info"    },
  "😡": { border: "border-l-rose-500/60",    badge: "badge-error"   },
  "😐": { border: "border-l-amber-500/60",   badge: "badge-warning" },
};

const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const HighlightText = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <span key={i} className="text-secondary font-medium">{part}</span>
          : part
      )}
    </>
  );
};

const EntryCard = ({
  id, date, title, mood, content, updatedAt,
  highlightText, isPinned: initialPinned, tags = [],
  contentFormat = "plain",
}) => {
  // Option A: read encKey (was dataKey)
  const encKey = useSelector((state) => state.user.encKey);
  const [togglePin, { isLoading: pinning }] = useTogglePinMutation();

  // Decrypt content using the session key
  let decryptedContent = content;
  if (encKey && content) {
    const result = decryptText(content, encKey);
    decryptedContent = result || content;
  }

  const plainContent = stripHtml(decryptedContent);

  const formattedDate = new Date(date).toLocaleDateString("default", {
    day: "numeric", month: "long", year: "numeric",
  });
  const formattedUpdateAt = new Date(updatedAt).toLocaleDateString("default", {
    day: "numeric", month: "long", year: "numeric",
  });

  const preview = plainContent.length > 240
    ? `${plainContent.slice(0, 240)}…`
    : plainContent;

  const theme = MOOD_THEME[mood] || MOOD_THEME["😐"];

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    try {
      const res = await togglePin(id).unwrap();
      toast.success(res.message);
    } catch {
      toast.error("Failed to toggle pin.");
    }
  };

  return (
    <div
      className={`
        card bg-base-200 shadow-md hover:shadow-xl rounded-3xl
        border-l-4 ${theme.border}
        transition-shadow duration-200
        ${initialPinned ? "ring-1 ring-warning/30" : ""}
        relative flex flex-col h-full
      `}
    >
      {initialPinned && (
        <div className="absolute top-3 left-3 z-10">
          <span className="badge badge-warning badge-xs gap-1">
            <FaThumbtack className="text-[8px]" /> Pinned
          </span>
        </div>
      )}

      <div className={`flex justify-between items-start pt-4 px-3 ${initialPinned ? "mt-3" : ""}`}>
        <p className="text-xs text-base-content/50">{formattedDate}</p>
        <div className="flex gap-2 items-center">
          <button
            type="button" onClick={handleTogglePin} disabled={pinning}
            title={initialPinned ? "Unpin" : "Pin"}
            className={`hover:cursor-pointer transition-all ${
              initialPinned ? "text-warning" : "text-base-content/25 hover:text-warning"
            }`}
          >
            <FaThumbtack className={`text-xs ${initialPinned ? "rotate-0" : "rotate-45"}`} />
          </button>
          <EditEntry id={id} />
          <DeleteEntry id={id} />
        </div>
      </div>

      <div className="card-body p-4 pt-2 flex-1">
        <h2 className="card-title text-base leading-snug">
          <span className="mr-1">{mood}</span>
          <HighlightText text={title} query={highlightText} />
        </h2>
        <p className="text-sm break-words text-base-content/75 leading-relaxed">
          <HighlightText text={preview} query={highlightText} />
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pb-2">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="badge badge-xs badge-ghost">
              #<HighlightText text={tag} query={highlightText} />
            </span>
          ))}
          {tags.length > 4 && (
            <span className="badge badge-xs badge-ghost">+{tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center pb-4 px-3 border-t border-base-content/5 pt-2">
        <p className="text-xs text-base-content/40">Edited: {formattedUpdateAt}</p>
        <ReadMore
          formattedDate={formattedDate}
          title={title}
          mood={mood}
          content={decryptedContent}
          contentFormat={contentFormat}
          formattedUpdateAt={formattedUpdateAt}
          tags={tags}
        />
      </div>
    </div>
  );
};

export default EntryCard;