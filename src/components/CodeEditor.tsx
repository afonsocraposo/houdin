import AceEditor from "react-ace";
// Import ace editor modes and themes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github_light_default";
import "ace-builds/src-noconflict/theme-github_dark";
import "ace-builds/src-noconflict/ext-language_tools";
// import { useColorScheme } from "@mantine/hooks";

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange: (value: string) => void;
  height?: number | string;
  placeholder?: string;
  key: string;
}
export default function CodeEditor({
  language,
  value,
  onChange,
  height,
  placeholder,
  key,
}: CodeEditorProps) {
  // const colorscheme = useColorScheme();
  return (
    <AceEditor
      mode={language || "text"}
      theme={"github_light_default"}
      value={value}
      onChange={(val) => onChange(val)}
      wrapEnabled={true}
      name={`ace-editor-${key}`}
      width="100%"
      height={typeof height === "number" ? `${height}px` : height || "200px"}
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
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
      }}
      highlightActiveLine={false}
      placeholder={placeholder}
      style={{
        border: "1px solid #ced4da",
        borderRadius: "4px",
      }}
    />
  );
}
