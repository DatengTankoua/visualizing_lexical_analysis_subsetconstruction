import DSLInput from "../components/FileInput/DSLInput";
import GraphViewer from "../components/GraphViewer/GraphViewer";
import StepControls from "../components/Controls/StepControls";
import SubsetTable from "../components/SubsetTable/SubsetTable";
import { parseDSL } from "../core/parser/dslParser";
import { convertNFAtoDFAWithSteps } from "../core/algorithm/subsetConstruction";
import { useState, useMemo } from "react";
import type { NFA, ParseResult, DFA } from "../core/models/types";
import type { SubsetConstructionStep } from "../core/algorithm/subsetConstruction";

export default function Home() {
  const [nfa, setNfa] = useState<NFA | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [currentStep, setCurrentStep] = useState<SubsetConstructionStep | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Convert NFA to DFA with steps when NFA changes
  const conversionResult = useMemo(() => {
    if (!nfa) return null;
    return convertNFAtoDFAWithSteps(nfa);
  }, [nfa]);

  const dfa: DFA | null = conversionResult?.dfa || null;
  const steps = conversionResult?.steps || [];

  const handleStepChange = (step: SubsetConstructionStep, index: number) => {
    setCurrentStep(step);
    setCurrentStepIndex(index);
  };

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
                <div className="text-gray-600">
                  [{nfa.alphabet.join(', ')}]
                  {nfa.hasEpsilon && <span className="ml-1 text-purple-600">(+ε)</span>}
                </div>
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
              {nfa.hasEpsilon && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                  mit ε-Übergängen
                </span>
              )}
              {nfa.regex && (
                <div className="text-gray-600 mt-1">
                  <span className="font-medium">RegEx:</span> {nfa.regex}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DFA Info */}
        {dfa && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <h3 className="font-semibold text-purple-800 mb-2">
              ✓ DFA konstruiert
              {dfa.name && ` - ${dfa.name}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Zustände:</span> {dfa.states.length}
                <div className="text-gray-600">[{dfa.states.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">Alphabet:</span> {dfa.alphabet.length}
                <div className="text-gray-600">[{dfa.alphabet.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">Start:</span> {dfa.startState}
              </div>
              <div>
                <span className="font-medium">Akzeptierend:</span>
                <div className="text-gray-600">[{dfa.acceptStates.join(', ')}]</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium">Übergänge:</span> {dfa.transitions.length}
            </div>
          </div>
        )}

        {/* Step Controls */}
        {nfa && steps.length > 0 && (
          <section>
            <StepControls steps={steps} onStepChange={handleStepChange} />
          </section>
        )}

        {/* Subset Construction Table */}
        {nfa && currentStep && (
          <section>
            <SubsetTable 
              step={currentStep} 
              alphabet={nfa.alphabet.filter(s => s !== 'ε')} 
            />
          </section>
        )}
        
        <section className="mt-4">
          <h2 className="mb-2 font-medium">Graphvisualisierung</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* NFA Graph */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 bg-green-100 px-3 py-1 rounded">
                NFA (Original)
              </h3>
              {nfa ? (
                <GraphViewer nfa={nfa} />
              ) : (
                <div className="border h-[480px] rounded-xl grid place-items-center text-gray-500">
                  NFA Visualisierung hier
                </div>
              )}
            </div>

            {/* DFA Graph - Shows current step */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 bg-purple-100 px-3 py-1 rounded">
                DFA (Schritt {currentStepIndex + 1}{steps.length > 0 ? ` / ${steps.length}` : ''})
              </h3>
              {dfa && currentStep ? (
                <GraphViewer 
                  nfa={{
                    ...dfa,
                    states: currentStep.dfaStates.map(s => s.length === 1 ? s[0] : `{${s.join(',')}}`),
                    transitions: currentStep.dfaTransitions,
                    startState: dfa.startState,
                    acceptStates: dfa.acceptStates,
                    alphabet: dfa.alphabet,
                  }} 
                />
              ) : (
                <div className="border h-[480px] rounded-xl grid place-items-center text-gray-500">
                  DFA Visualisierung hier
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}