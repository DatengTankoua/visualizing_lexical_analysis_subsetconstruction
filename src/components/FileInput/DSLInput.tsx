import { useState } from "react";
import type { ParseResult } from "../../core/models/types";

interface Props {
  onLoad: (text: string) => void;
  onParseResult: (result: ParseResult) => void;
}

export default function DSLInput({ onLoad, onParseResult }: Props) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoad = async () => {
    if (!text.trim()) {
      onParseResult({
        success: false,
        error: "Bitte geben Sie eine DSL-Definition ein"
      });
      return;
    }

    setIsLoading(true);
    try {
      onLoad(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          DSL-Eingabe:
        </label>
        <textarea
          className="w-full h-40 border p-3 rounded font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fügen Sie hier Ihre DSL ein... 

Beispiel:
# @NAME SimpleNFA
# @REGEX a*b

states q0 q1 q2
start q0
accept q2
alphabet a b

q0 a q0
q0 b q1
q1 b q2"
        />
      </div>
      
      <div className="flex gap-4 items-center grid grid-cols-1 md:grid-cols-2">
        
        <div className="text-sm text-gray-600 bg-violet-600 text-white px-2 py-2 rounded">
        <input
          type="file"
          accept=".dsl,.txt"
          onChange={handleFileUpload}
          className="text-sm"
        />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">oder</label>
        <button
          onClick={handleLoad}
          disabled={isLoading || !text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Lade...' : 'NFA laden'}
        </button>
        </div>
      </div>
    </div>
  );
}
