type Props = {
  input: string;
  setInput: (value: string) => void;
};

function InputBox({ input, setInput }: Props) {
  return (
    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Enter input..."
      className="w-full h-28 bg-zinc-800 text-white p-3 outline-none resize-none border-t border-zinc-700"
    />
  );
}

export default InputBox;