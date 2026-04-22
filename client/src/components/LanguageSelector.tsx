type Props = {
  language: string;
  setLanguage: (value: string) => void;
};

function LanguageSelector({ language, setLanguage }: Props) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="bg-zinc-700 text-white px-3 py-2 rounded-md outline-none"
    >
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="cpp">C++</option>
      <option value="c">C</option>
    </select>
  );
}

export default LanguageSelector;