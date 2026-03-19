import ReadMore from "./ReadMore";
import EditEntry from "./EditEntry";
import DeleteEntry from "./DeleteEntry";
import { useSelector } from "react-redux";
import { decryptText } from "../../utils/crypto.js";

const EntryCard = ({
  id,
  date,
  title,
  mood,
  content,
  updatedAt,
  highlightText,
}) => {
  // Bug fix: decrypt content before display
  const userPassword = useSelector((state) => state.user.userPassword);

  let decryptedContent = content;
  if (userPassword && content) {
    try {
      const result = decryptText(content, userPassword);
      decryptedContent = result || content;
    } catch {
      // fall back to raw if decryption fails (e.g. old unencrypted entries)
    }
  }

  const formattedDate = new Date(date).toLocaleDateString("default", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedUpdateAt = new Date(updatedAt).toLocaleDateString("default", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const contentLimit =
    decryptedContent.length > 300
      ? `${decryptedContent.slice(0, 300)}...`
      : decryptedContent;

  const highlightMatch = (text) => {
    if (!highlightText) return text;
    const parts = text.split(new RegExp(`(${highlightText})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlightText.toLowerCase() ? (
        <span key={index} className="text-secondary">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="card bg-base-200 w-100 h-70 shadow-xl hover:shadow-2xl rounded-3xl">
      <div className="flex justify-between items-center pt-4 px-3">
        <p className="text-sm">{formattedDate}</p>
        <div className="flex gap-2">
          <EditEntry id={id} />
          <DeleteEntry id={id} />
        </div>
      </div>

      <div className="card-body p-4">
        <h2 className="card-title block">
          {mood} {highlightMatch(title)}
        </h2>
        <p className="break-words">{highlightMatch(contentLimit)}</p>
      </div>

      <div className="flex justify-between items-center pb-4 px-3">
        <div className="text-left text-sm">Edited: {formattedUpdateAt}</div>
        <div className="text-left text-sm">
          <ReadMore
            formattedDate={formattedDate}
            title={title}
            mood={mood}
            content={decryptedContent}
            formattedUpdateAt={formattedUpdateAt}
          />
        </div>
      </div>
    </div>
  );
};
export default EntryCard;