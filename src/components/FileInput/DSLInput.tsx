import { useState } from "react";
import type { ParseResult } from "../../core/models/types";
import { useTranslate } from "@tolgee/react";

interface Props {
  onLoad: (text: string) => void;
  onParseResult: (result: ParseResult) => void;
}

export default function DSLInput({ onLoad, onParseResult }: Props) {
  const { t } = useTranslate();
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState("");
  const [fileName, setFileName] = useState<string>("");


  const EXAMPLE_FILES = [
    { value: '', label: t("input.example.placeholder")},
    { value: 'example_nfa', label: t("input.example.nfa_withEps") },
    { value: 'example_nfa1', label: t("input.example.nfa_withoutEps") },
  ];

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
        error: t("input.errors.fileTooLarge", { size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, maxSize: "1 MB" })
      });
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.onerror = () => {
      onParseResult({
        success: false,
        error: t("input.errors.fileRead"),
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
        error: t("input.errors.exampleLoad", { error: error instanceof Error ? error.message : String(error) })
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("input.dsl.title")}
        </label>
        <textarea
          className="w-full h-40 border p-3 rounded font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("input.dsl.placeholder")}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded">
          <label className="block text-xs font-medium text-purple-900 mb-1">
            📁 {t("input.example.label")}
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

        <div className="bg-purple-50 border border-purple-200 px-3 py-2 rounded">
          <span className="block text-xs font-medium text-purple-900 mb-2">
            📤 {t("input.file.label")}
          </span>

          <div className="flex items-center gap-3">
            <label
              htmlFor="dsl-file"
              className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm font-medium transition-colors
                ${isLoading 
                  ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200" 
                  : "cursor-pointer bg-white text-purple-700 border-purple-200 hover:bg-purple-100 active:bg-purple-200"
                }`}
            >
              {t("input.file.choose")}
            </label>

            <span className="text-xs text-gray-600 truncate flex-1 italic">
              {fileName ? fileName : t("input.file.none")}
            </span>
          </div>

          <input
            id="dsl-file"
            type="file"
            accept=".aef,.dsl,.txt"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
        </div>
       </div>
      <div>



        <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded flex items-center">
          <button
            onClick={handleLoad}
            disabled={isLoading || !text.trim()}
            className="w-full px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? t("input.actions.loading") : t("input.actions.loadNfa")}
          </button>
        </div>
      </div>
    </div>
  );
}
