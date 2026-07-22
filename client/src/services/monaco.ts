// Point @monaco-editor/react at the bundled monaco instead of its default CDN
// loader. y-monaco constructs monaco.Range objects for remote cursors, so the
// editor and y-monaco must be the *same* monaco instance — with the CDN loader
// there would be two, and decorations would come from the wrong one.
//
// Bundling it also means the editor works offline.
//
// NOTE: this imports the full "monaco-editor" barrel on purpose. Trimming it to
// editor.api + editor.all + individual language contributions produces an
// editor that mounts but renders no lines, so the barrel stays. The cost is
// contained by lazy-loading the editor route (see main.tsx), which keeps monaco
// off the landing, login and signup pages.
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

export { monaco };
