import { useEffect, useRef } from "react";

const COLORS = [
  ["Výchozí", ""],
  ["Černá", "#111111"],
  ["Tmavě modrá", "#263b63"],
  ["Vínová", "#7a2638"],
  ["Zelená", "#49634f"],
  ["Zlatá", "#a17b32"],
  ["Šedá", "#666666"],
];

function ChapterEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function emitChange() {
    onChange(editorRef.current?.innerHTML || "");
  }

  function command(command, argument = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
  }

  function createLink() {
    const url = window.prompt("Vlož adresu odkazu:");
    if (!url) return;
    command("createLink", url);
  }

  return (
    <div className="chapter-editor">
      <div className="chapter-editor-toolbar" role="toolbar" aria-label="Formátování textu">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("bold")}><strong>B</strong></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("italic")}><em>I</em></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("underline")}><u>U</u></button>

        <select
          defaultValue=""
          aria-label="Barva textu"
          onChange={(e) => {
            if (e.target.value) command("foreColor", e.target.value);
            e.target.value = "";
          }}
        >
          {COLORS.map(([label, color]) => (
            <option key={label} value={color}>{label}</option>
          ))}
        </select>

        <select
          defaultValue="p"
          aria-label="Typ odstavce"
          onChange={(e) => command("formatBlock", e.target.value)}
        >
          <option value="p">Odstavec</option>
          <option value="h2">Nadpis 2</option>
          <option value="h3">Nadpis 3</option>
          <option value="blockquote">Citace</option>
        </select>

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("insertUnorderedList")}>• Seznam</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("insertOrderedList")}>1. Seznam</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("justifyLeft")}>←</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("justifyCenter")}>↔</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("justifyRight")}>→</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={createLink}>🔗 Odkaz</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => command("removeFormat")}>Vyčistit formát</button>
      </div>

      <div
        ref={editorRef}
        className="chapter-editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder="Sem napiš nebo vlož text kapitoly..."
      />
    </div>
  );
}

export default ChapterEditor;
