import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import CodeEditor from "./components/CodeEditor";
import InputBox from "./components/InputBox";
import LanguageSelector from "./components/LanguageSelector";
import OutputConsole from "./components/OutputConsole";
import { api } from "./services/api";
import { socket } from "./socket";

function App() {
  const [code, setCode] = useState("console.log('Hello World')");
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [remoteCursor, setRemoteCursor] = useState<any>(null);
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const navigate = useNavigate();
  const params = useParams();
  const roomId = params.roomId || "default-room";

  useEffect(() => {
    if (!username) {
      const name = prompt("Enter your username") || "Guest";
      setUsername(name);
      localStorage.setItem("username", name);
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    let messageTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleReceiveCode = (incomingCode: string) => {
      setCode(incomingCode);
    };

    const handleReceiveOutput = (incomingOutput: string) => {
      setOutput(incomingOutput);
    };

    const handleUserCount = (count: number) => {
      setUsers(count);
    };

    const handleRoomNotice = (msg: string) => {
      setMessage(msg);

      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }

      messageTimeout = setTimeout(() => {
        setMessage("");
      }, 3000);
    };

    socket.on("receive-code", handleReceiveCode);
    socket.on("receive-output", handleReceiveOutput);
    socket.on("user-count", handleUserCount);
    socket.on("room-notice", handleRoomNotice);

    socket.emit("join-room", {
      roomId,
      username,
    });

    return () => {
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }

      socket.off("receive-code", handleReceiveCode);
      socket.off("receive-output", handleReceiveOutput);
      socket.off("user-count", handleUserCount);
      socket.off("room-notice", handleRoomNotice);
    };
  }, [roomId, username]);

  useEffect(() => {
    if (!roomId) return;
    if (!username) return;

    socket.emit("join-room", {
      roomId,
      username,
    });

    const loadRoom = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/room/${roomId}`
        );

        if (res.data) {
          setCode(res.data.code);
          setLanguage(res.data.language);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadRoom();

    socket.on("receive-code", (incomingCode) => {
      setCode(incomingCode);
    });

    socket.on("receive-language", (lang) => {
      setLanguage(lang);
    });

    socket.on("receive-current-state", ({ code, language }) => {
      setCode(code);
      setLanguage(language);
    });

    socket.on("receive-cursor", (data) => {
      setRemoteCursor(data);
    });

    return () => {
      socket.off("receive-code");
      socket.off("receive-language");
      socket.off("receive-current-state");
      socket.off("receive-cursor");
    };
  }, [roomId, username]);

  useEffect(() => {
    socket.on("request-current-state", (newUserId) => {
      socket.emit("send-current-state", {
        targetId: newUserId,
        code,
        language,
      });
    });

    return () => {
      socket.off("request-current-state");
    };
  }, [code, language]);

  useEffect(() => {
    if (!roomId) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("Saving...");

        await axios.post("http://localhost:5000/save-room", {
          roomId,
          code,
          language,
        });

        console.log("Saved");
        setSaveStatus("Saved");
      } catch (error) {
        console.log(error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, language, roomId]);

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${id}`);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    socket.emit("code-change", {
      roomId,
      code: newCode,
    });
  };

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
      socket.emit("send-output", {
        roomId,
        output: res.data.output,
      });
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
          roomId={roomId}
        />

        <button
          onClick={createRoom}
          className="bg-blue-600 px-4 py-2 rounded text-white"
        >
          New Room
        </button>

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

      <div className="bg-gray-900 px-4 py-2 text-white flex justify-between">
        <span>Users Online: {users}</span>
        <div>{saveStatus}</div>
        <span>{message}</span>
      </div>

      {message && (
        <div className="bg-yellow-500 p-2 text-center font-semibold text-black">
          {message}
        </div>
      )}

      {remoteCursor && (
        <div className="text-sm text-yellow-400">
          Collaborator typing at line {remoteCursor.line}
        </div>
      )}

      <div className="flex-1">
        <CodeEditor
          code={code}
          setCode={handleCodeChange}
          language={language}
          roomId={roomId}
        />
      </div>

      <InputBox input={input} setInput={setInput} />

      <OutputConsole output={output} isError={isError} />
    </div>
  );
}

export default App;
