import { useRef, useEffect, useCallback, useState } from "react";
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaListUl, FaListOl, FaQuoteRight, FaHeading,
  FaUndo, FaRedo,
} from "react-icons/fa";

// ── Toolbar button ────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault(); // don't blur the editor
      if (!disabled) onClick();
    }}
    className={`btn btn-xs rounded-lg transition-colors select-none ${
      active
        ? "btn-primary"
        : "btn-ghost text-base-content/70 hover:text-base-content"
    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-base-content/15 mx-0.5" />;

// ── Main RichTextEditor ───────────────────────────────────────────
// Props:
//   value        — HTML string (managed outside)
//   onChange     — (html: string) => void
//   placeholder  — string
//   maxLength    — character limit on plain-text length (default 10000)
//   className    — extra classes for the outer wrapper
const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Write about your day, thoughts, or experiences…",
  maxLength = 10000,
  className = "",
  minHeight = "180px",
}) => {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});

  // ── Sync incoming value to DOM (only when it differs) ────────────
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // Avoid resetting cursor if content is the same
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  // ── Update active-format state on selection change ───────────────
  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold:          document.queryCommandState("bold"),
      italic:        document.queryCommandState("italic"),
      underline:     document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
    });
  }, []);

  // ── Handle content changes ────────────────────────────────────────
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    // Enforce maxLength on plain text
    const plain = el.innerText || "";
    if (plain.length > maxLength) {
      // Undo the last character typed (crude but effective)
      document.execCommand("undo");
      return;
    }

    onChange?.(el.innerHTML);
    updateActiveFormats();
  }, [onChange, maxLength, updateActiveFormats]);

  // ── Execute formatting commands ───────────────────────────────────
  const exec = useCallback((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateActiveFormats();
    // Notify parent of new HTML
    setTimeout(() => {
      onChange?.(editorRef.current?.innerHTML ?? "");
    }, 0);
  }, [onChange, updateActiveFormats]);

  // ── Heading: wrap selection in <h3> via formatBlock ─────────────
  const toggleHeading = useCallback(() => {
    const current = document.queryCommandValue("formatBlock");
    exec("formatBlock", current === "h3" ? "p" : "h3");
  }, [exec]);

  // ── Prevent default on paste, strip to plain text or allow HTML ──
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  // ── Handle Tab key for list indentation ─────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      exec(e.shiftKey ? "outdent" : "indent");
    }
  }, [exec]);

  const plain = editorRef.current?.innerText || "";
  const charCount = plain.length;
  const nearLimit = charCount > maxLength * 0.85;
  const atLimit   = charCount >= maxLength;

  return (
    <div className={`flex flex-col rounded-xl border border-base-content/20 overflow-hidden bg-base-100 focus-within:border-primary/60 transition-colors ${className}`}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-base-200/70 border-b border-base-content/10">
        <ToolbarBtn
          onClick={() => exec("undo")}
          title="Undo (Ctrl+Z)"
        >
          <FaUndo className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("redo")}
          title="Redo (Ctrl+Y)"
        >
          <FaRedo className="text-[11px]" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          onClick={toggleHeading}
          active={document.queryCommandValue("formatBlock") === "h3"}
          title="Heading"
        >
          <FaHeading className="text-[11px]" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          onClick={() => exec("bold")}
          active={activeFormats.bold}
          title="Bold (Ctrl+B)"
        >
          <FaBold className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("italic")}
          active={activeFormats.italic}
          title="Italic (Ctrl+I)"
        >
          <FaItalic className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("underline")}
          active={activeFormats.underline}
          title="Underline (Ctrl+U)"
        >
          <FaUnderline className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("strikeThrough")}
          active={activeFormats.strikeThrough}
          title="Strikethrough"
        >
          <FaStrikethrough className="text-[11px]" />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn
          onClick={() => exec("insertUnorderedList")}
          active={activeFormats.insertUnorderedList}
          title="Bullet list"
        >
          <FaListUl className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("insertOrderedList")}
          active={activeFormats.insertOrderedList}
          title="Numbered list"
        >
          <FaListOl className="text-[11px]" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => exec("formatBlock", "blockquote")}
          title="Block quote"
        >
          <FaQuoteRight className="text-[11px]" />
        </ToolbarBtn>

        {/* Character counter */}
        <span
          className={`ml-auto text-[10px] font-mono tabular-nums select-none ${
            atLimit
              ? "text-error font-bold"
              : nearLimit
              ? "text-warning"
              : "text-base-content/30"
          }`}
        >
          {charCount.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
      </div>

      {/* ── Editable area ────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`
          px-3 py-2.5 text-sm leading-relaxed outline-none
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-base-content/30
          empty:before:pointer-events-none
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:my-0.5
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50
          [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-base-content/70
          [&_blockquote]:my-1
          [&_b]:font-bold [&_strong]:font-bold
          [&_i]:italic [&_em]:italic
          [&_u]:underline
          [&_s]:line-through [&_strike]:line-through
        `}
      />
    </div>
  );
};

export default RichTextEditor;