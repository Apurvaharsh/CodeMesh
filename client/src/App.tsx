import { useState } from "react";
import CodeEditor from "./components/CodeEditor";
import InputBox from "./components/InputBox";
import LanguageSelector from "./components/LanguageSelector";
import OutputConsole from "./components/OutputConsole";
import { api } from "./services/api";

function App() {
  const [code, setCode] = useState("console.log('Hello World')");
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput("");
    setIsError(false);

    try {
      const res = await api.post("/run", {
        code,
        language,
        input,
      });

      setOutput(res.data.output);
    } catch (error) {
      setIsError(true);
      setOutput("Server error");
    } finally {
      setLoading(false);
    }
  };

  const clearConsole = () => {
    setOutput("");
    setIsError(false);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900">
      <div className="h-14 bg-zinc-800 border-b border-zinc-700 px-4 flex items-center gap-3">
        <LanguageSelector
          language={language}
          setLanguage={setLanguage}
        />

        <button
          onClick={runCode}
          disabled={loading}
          className="bg-green-600 px-4 py-2 rounded text-white"
        >
          {loading ? "Running..." : "Run"}
        </button>

        <button
          onClick={clearConsole}
          className="bg-zinc-700 px-4 py-2 rounded text-white"
        >
          Clear
        </button>
      </div>

      <div className="flex-1">
        <CodeEditor
          code={code}
          setCode={setCode}
          language={language}
        />
      </div>

      <InputBox input={input} setInput={setInput} />

      <OutputConsole output={output} isError={isError} />
    </div>
  );
}

export default App;
