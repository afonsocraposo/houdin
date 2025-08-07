import AceEditor from "react-ace";
// Import ace editor modes and themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github_light_default";
import "ace-builds/src-noconflict/theme-github_dark";
import ace from "ace-builds/src-noconflict/ace";

// Configure ace for extension environment
ace.config.set("basePath", "");
ace.config.set("modePath", "");
ace.config.set("themePath", "");
ace.config.set("workerPath", "");
ace.config.set("loadWorkerFromBlob", false);

// Add custom CSS for placeholder styling
const placeholderStyles = `
  .ace-editor-custom .ace_placeholder {
    font-family: Monaco, Menlo, Ubuntu Mono, monospace !important;
    font-size: 14px !important;
    color: #999 !important;
    font-style: normal !important;
transform: none !important;
margin: 0 !important;
padding: 0  4px  !important;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = placeholderStyles;
  document.head.appendChild(style);
}
// import { useColorScheme } from "@mantine/hooks";

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  placeholder?: string;
  editorKey: string;
}
export default function CodeEditor({
  language,
  value,
  onChange,
  height,
  placeholder,
  editorKey,
}: CodeEditorProps) {
  // const colorscheme = useColorScheme();
  return (
    <AceEditor
      mode={language || "text"}
      theme={"github_light_default"}
      value={value}
      onChange={(val) => onChange(val)}
      wrapEnabled={true}
      name={`ace-editor-${editorKey}`}
      width="100%"
      height={typeof height === "number" ? `${height}px` : height || "200px"}
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: false,
        enableLiveAutocompletion: false,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
        highlightActiveLine: false,
        highlightSelectedWord: false,
        hScrollBarAlwaysVisible: false,
        useWorker: false,
        scrollPastEnd: false,
        animatedScroll: true,
        highlightGutterLine: false,
        showPrintMargin: false,
        foldStyle: "manual",
        fontSize: 14,
        fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
      }}
      highlightActiveLine={false}
      placeholder={placeholder}
      style={{
        border: "1px solid #ced4da",
        borderRadius: "4px",
        fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
        fontSize: "14px",
      }}
      className="ace-editor-custom"
    />
  );
}
