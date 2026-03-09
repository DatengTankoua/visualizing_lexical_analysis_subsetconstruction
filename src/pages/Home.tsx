import { useTranslate } from "@tolgee/react";
import DSLInput from "../components/FileInput/DSLInput";
import GraphViewer from "../components/GraphViewer/GraphViewer";
import StepControls from "../components/Controls/StepControls";
import SubsetTable from "../components/SubsetTable/SubsetTable";
import { parseDSL } from "../core/parser/dslParser";
import { convertNFAtoDFAWithSteps } from "../core/algorithm/subsetConstruction";
import { useState, useMemo } from "react";
import type { NFA, ParseResult, DFA } from "../core/models/types";
import type { SubsetConstructionStep } from "../core/algorithm/subsetConstruction";
import LanguageToggle from "../components/Controls/LanguageToggle";
import HighContrastToggle from "../components/Controls/HighContrastToggle";
import { exportDfaToAef } from "../core/export/exportAef";

export default function Home() {
  const { t } = useTranslate();
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
  const canExport = !!dfa && !!dfa.name && !!dfa.regex;


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
  
  const handleExport = () => {
    if (!dfa) return;
    const content = exportDfaToAef(dfa);
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dfa.name || "dfa"}.aef`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("home.title")}</h1>
        <div className="flex items-center gap-2">
          <HighContrastToggle />
          <LanguageToggle />
        </div>
      </div>
      
      <div className="space-y-6">
        <DSLInput onLoad={handleLoad} onParseResult={handleParseResult} />
        
        {/* Fehleranzeige */}
        {parseResult && !parseResult.success && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">{t("errors.parsing.title")}</h3>
            <p className="text-red-700">{parseResult.error}</p>
            {parseResult.line && (
              <p className="text-red-600 text-sm mt-1">{t("errors.parsing.line")} {parseResult.line}</p>
            )}
          </div>
        )}
        
        {/* Erfolgreiche Anzeige */}
        {parseResult && parseResult.success && nfa && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              {t("nfa.summary.title")}
              {nfa.name && <span className="font-normal"> · {nfa.name}</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">{t("labels.states")}:</span> {nfa.states.length}
                <div className="text-gray-600">[{nfa.states.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">{t("labels.alphabet")}:</span> {nfa.alphabet.length}
                <div className="text-gray-600">
                  [{nfa.alphabet.join(', ')}]
                  {nfa.hasEpsilon && <span className="ml-1 text-purple-600">(+ε)</span>}
                </div>
              </div>
              <div>
                <span className="font-medium">{t("labels.start")}:</span> {nfa.startState}
              </div>
              <div>
                <span className="font-medium">{t("labels.accepting")}:</span> {nfa.acceptStates.length}
                <div className="text-gray-600">[{nfa.acceptStates.join(', ')}]</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium">{t("labels.transitions")}:</span> {nfa.transitions.length}
              {nfa.hasEpsilon && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                  {t("labels.withEpsilon")}
                </span>
              )}
              {nfa.regex && (
                <div className="text-gray-600 mt-1">
                  <span className="font-medium">{t("nfa.regex")}:</span> {nfa.regex}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DFA Info */}
        {dfa && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-purple-800">
                {t("dfa.summary.title")}
                {dfa.name && <span className="font-normal"> · {dfa.name}</span>}
              </h3>
              
              <button
               onClick={handleExport}
               disabled={!canExport}
               title={
                canExport
                ? "Export DFA as AEF"
                : "Export nicht möglich: @NAME oder @REGEX fehlt  /  Export not possible: @NAME or @REGEX missing"
              }
              className={`px-3 py-1 text-sm rounded border transition-colors ${
                canExport
                  ? "border-purple-300 text-purple-700 hover:bg-purple-500 hover:text-white"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"}
              }`}
              >
                Export AEF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">{t("labels.states")}:</span> {dfa.states.length}
                <div className="text-gray-600">[{dfa.states.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">{t("labels.alphabet")}:</span> {dfa.alphabet.length}
                <div className="text-gray-600">[{dfa.alphabet.join(', ')}]</div>
              </div>
              <div>
                <span className="font-medium">{t("labels.start")}:</span> {dfa.startState}
              </div>
              <div>
                <span className="font-medium">{t("labels.accepting")}:</span> {dfa.acceptStates.length}
                <div className="text-gray-600">[{dfa.acceptStates.join(', ')}]</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-medium">{t("labels.transitions")}:</span> {dfa.transitions.length}
            </div>
            {nfa && dfa && (
              <div className="mt-2 text-sm text-purple-700">
                <span className="font-medium">{t("dfa.stateComparison")}:</span>{" "}
                {nfa.states.length} → {dfa.states.length}
                <span className="ml-2 text-purple-600">
                  (×{(dfa.states.length / Math.max(1, nfa.states.length)).toFixed(2)})
                  </span>
                  </div>
                )}
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
          <h2 className="mb-2 font-medium">{t("section.subset")}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* NFA Graph */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 bg-green-100 px-3 py-1 rounded">
                {t("graph.nfa.title")}
              </h3>
              {nfa ? (
                <GraphViewer nfa={nfa} />
              ) : (
                <div className="border h-[480px] rounded-xl grid place-items-center text-gray-500">
                  {t("graph.nfa.empty")}
                </div>
              )}
            </div>

            {/* DFA Graph - Shows current step */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 bg-purple-100 px-3 py-1 rounded">
                {t("graph.dfa.step")} {currentStepIndex + 1}
                {steps.length > 0 && ` / ${steps.length}`}
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
                  {t("graph.dfa.empty")}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}