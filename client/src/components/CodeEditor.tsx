import Editor from "@monaco-editor/react";
import { socket } from "../socket";

type Props = {
  code: string;
  setCode: (value: string) => void;
  language: string;
  roomId: string;
};

function CodeEditor({ code, setCode, language, roomId }: Props) {
  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      value={code}
      onChange={(value) => setCode(value || "")}
      onMount={(editor) => {
        editor.onDidChangeCursorPosition((e) => {
          socket.emit("cursor-change", {
            roomId,
            line: e.position.lineNumber,
          });
        });
      }}
    />
  );
}

export default CodeEditor;
