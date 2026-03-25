import { useState } from "react";
import ModalLayout from "../ModalLayout";
import { FaThumbtack } from "react-icons/fa";

const ReadMore = ({
  formattedDate, title, mood, content,
  contentFormat = "plain",
  formattedUpdateAt, tags = [],
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-xs btn-outline btn-primary rounded-xl"
        onClick={() => setOpen(true)}
      >
        Read More
      </button>

      <ModalLayout isOpen={open} close={() => setOpen(false)}>
        <div>
          {/* Title */}
          <div className="text-center card-title pb-2 block">
            <span>{mood} </span>
            <span>{title} </span>
            <span>{mood}</span>
          </div>

          <div className="text-left text-sm px-2 pb-1 text-base-content/60">
            {formattedDate}
          </div>

          {/* Content */}
          <div className="card-body p-2 pb-0">
            {contentFormat === "html" ? (
              <div
                className={`
                  text-sm break-words leading-relaxed
                  [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:first:mt-0
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
                  [&_li]:my-0.5
                  [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50
                  [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-base-content/70
                  [&_b]:font-bold [&_strong]:font-bold
                  [&_i]:italic [&_em]:italic
                  [&_u]:underline
                  [&_s]:line-through
                  [&_p]:mb-1
                `}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 px-2 pt-3">
              {tags.map((tag) => (
                <span key={tag} className="badge badge-sm badge-ghost">#{tag}</span>
              ))}
            </div>
          )}

          <div className="text-right text-xs px-2 pt-2 text-base-content/40">
            Last edit: {formattedUpdateAt}
          </div>
        </div>
      </ModalLayout>
    </>
  );
};
export default ReadMore;