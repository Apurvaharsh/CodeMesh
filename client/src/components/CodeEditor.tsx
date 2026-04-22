import Editor from "@monaco-editor/react";

type Props = {
  code: string;
  setCode: (value: string) => void;
  language: string;
};

function CodeEditor({ code, setCode, language }: Props) {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      value={code}
      onChange={(value) => setCode(value || "")}
    />
  );
}

export default CodeEditor;