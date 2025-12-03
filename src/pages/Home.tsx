import DSLInput from "../components/FileInput/DSLInput";
import GraphViewer from "../components/GraphViewer/GraphViewer";
import { parseDSL } from "../core/parser/dslParser";
import { useState } from "react";
import type { NFA, ParseResult } from "../core/models/types";

export default function Home() {
  const [nfa, setNfa] = useState<NFA | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleLoad = (text: string) => {
    const result: ParseResult = parseDSL(text);
    setParseResult(result);
    
    if (result.success && result.nfa) {
      setNfa(result.nfa);
      console.log("NFA erfolgreich geladen:", result.nfa);
    } else {
      setNfa(null);
      console.error("Parsing-Fehler:", result.error);
    }
  };

  const handleParseResult = (result: ParseResult) => {
    setParseResult(result);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">NFA → DFA Visualizer</h1>
      
      <div className="space-y-6">
        <DSLInput onLoad={handleLoad} onParseResult={handleParseResult} />
        
        {/* Fehleranzeige */}
        {parseResult && !parseResult.success && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Parsing-Fehler</h3>
            <p className="text-red-700">{parseResult.error}</p>
            {parseResult.line && (
              <p className="text-red-600 text-sm mt-1">Zeile {parseResult.line}</p>
            )}
          </div>
        )}
        
        {/* Erfolgreiche Anzeige */}
        {parseResult && parseResult.success && nfa && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              ✓ NFA erfolgreich geladen
              {nfa.name && ` - ${nfa.name}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Zustände:</span> {nfa.states.length}
                <div className="text-gray-600">[{nfa.states.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">Alphabet:</span> {nfa.alphabet.length}
                <div className="text-gray-600">[{nfa.alphabet.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">Start:</span> {nfa.startState}
              </div>
              <div>
                <span className="font-medium">Akzeptierend:</span>
                <div className="text-gray-600">[{nfa.acceptStates.join(', ')}]</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium">Übergänge:</span> {nfa.transitions.length}
              {nfa.regex && (
                <div className="text-gray-600 mt-1">
                  <span className="font-medium">RegEx:</span> {nfa.regex}
                </div>
              )}
            </div>
          </div>
        )}
        
        <section className="mt-4">
          <h2 className="mb-2 font-medium">Graphvisualisierung</h2>
          {nfa ? (
            <GraphViewer nfa={nfa} />
          ) : (
            <div className="border h-[480px] rounded-xl grid place-items-center text-gray-500">
              Graphvisualisierung hier
            </div>
          )}
        </section>
      </div>
    </div>
  );
}