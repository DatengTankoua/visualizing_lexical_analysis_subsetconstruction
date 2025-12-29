import { useState } from "react";
import type { ParseResult } from "../../core/models/types";

interface Props {
  onLoad: (text: string) => void;
  onParseResult: (result: ParseResult) => void;
}

const EXAMPLE_FILES = [
  { value: '', label: 'Wählen Sie ein Beispiel...' },
  { value: 'example_nfa', label: 'Example NFA - mit ε' },
];

export default function DSLInput({ onLoad, onParseResult }: Props) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState("");

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

    // Prüfe Dateigröße (max 1 MB)
    const maxSize = 1024 * 1024; // 1 MB in Bytes
    if (file.size > maxSize) {
      onParseResult({
        success: false,
        error: `Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximale Größe: 1 MB`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.onerror = () => {
      onParseResult({
        success: false,
        error: 'Fehler beim Lesen der Datei'
      });
    };
    reader.readAsText(file);
  };

  const handleExampleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedExample(value);
    
    if (!value) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/examples/${value}.aef`);
      if (!response.ok) {
        throw new Error(`Failed to load example: ${response.statusText}`);
      }
      const content = await response.text();
      setText(content);
    } catch (error) {
      onParseResult({
        success: false,
        error: `Fehler beim Laden des Beispiels: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          DSL-Eingabe (AEF-Format):
        </label>
        <textarea
          className="w-full h-40 border p-3 rounded font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fügen Sie hier Ihre DSL ein... 

AEF-Format Beispiel:
# @NAME Example1_NFA
# @REGEX (1.(0.1)+)|(0.0)

.q0 -1> q1 -0> q2 -1> q3 -0> q4;
q3 -ε> (q5);
.q0 -0> q6 -0> (q5);
q4 -1> q3;"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded">
          <label className="block text-xs font-medium text-purple-900 mb-1">
            📁 Beispiel laden:
          </label>
          <select
            value={selectedExample}
            onChange={handleExampleSelect}
            className="w-full text-sm border rounded px-2 py-1"
            disabled={isLoading}
          >
            {EXAMPLE_FILES.map((file) => (
              <option key={file.value} value={file.value}>
                {file.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-violet-50 border border-violet-200 px-3 py-2 rounded">
          <label className="block text-xs font-medium text-violet-900 mb-1">
            📤 Datei hochladen:
          </label>
          <input
            type="file"
            accept=".aef,.dsl,.txt"
            onChange={handleFileUpload}
            className="w-full text-sm"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded flex items-center">
          <button
            onClick={handleLoad}
            disabled={isLoading || !text.trim()}
            className="w-full px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? '⏳ Lädt...' : '🚀 NFA laden'}
          </button>
        </div>
      </div>
    </div>
  );
}
