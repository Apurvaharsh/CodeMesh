type Props = {
  output: string;
  isError: boolean;
};

function OutputConsole({ output, isError }: Props) {
  return (
    <div className="h-44 bg-black p-4 overflow-auto font-mono text-sm border-t border-zinc-800">
      <pre className={isError ? "text-red-400" : "text-green-400"}>
        {output || "Output will appear here..."}
      </pre>
    </div>
  );
}

export default OutputConsole;