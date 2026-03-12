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
    <div className="min-h-screen lg:h-screen flex flex-col">

      {/* ── Compact Header ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white shadow-sm shrink-0">
        <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">{t("home.title")}</h1>
        <div className="flex items-center gap-2">
          <HighContrastToggle />
          <LanguageToggle />
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">

        {/* ── Left Sidebar ── */}
        <aside className="w-150 shrink-0 flex flex-col gap-3 border-b lg:border-b-0 lg:border-r bg-gray-50 lg:overflow-y-auto p-3">

          <DSLInput onLoad={handleLoad} onParseResult={handleParseResult} />

          {/* Parse error */}
          {parseResult && !parseResult.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
              <p className="font-semibold text-red-800 mb-1">{t("errors.parsing.title")}</p>
              <p className="text-red-700">{parseResult.error}</p>
              {parseResult.line && (
                <p className="text-red-600 text-xs mt-1">{t("errors.parsing.line")} {parseResult.line}</p>
              )}
            </div>
          )}

          {/* NFA Summary */}
          {parseResult?.success && nfa && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
              <p className="font-semibold text-green-800 mb-2 text-sm">
                {t("nfa.summary.title")}
                {nfa.name && <span className="font-normal"> · {nfa.name}</span>}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <span className="font-medium">{t("labels.states")}:</span> {nfa.states.length}
                  <div className="text-gray-500">[{nfa.states.join(', ')}]</div>
                </div>
                <div>
                  <span className="font-medium">{t("labels.alphabet")}:</span>
                  <div className="text-gray-500">
                    [{nfa.alphabet.join(', ')}]
                    {nfa.hasEpsilon && <span className="ml-1 text-purple-600">(+ε)</span>}
                  </div>
                </div>
                <div>
                  <span className="font-medium">{t("labels.start")}:</span> {nfa.startState}
                </div>
                <div>
                  <span className="font-medium">{t("labels.accepting")}:</span>{' '}
                  {nfa.acceptStates.join(', ')}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">{t("labels.transitions")}:</span> {nfa.transitions.length}
                {nfa.hasEpsilon && (
                  <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                    {t("labels.withEpsilon")}
                  </span>
                )}
                {nfa.regex && (
                  <div className="text-gray-500 mt-1">
                    <span className="font-medium">{t("nfa.regex")}:</span> {nfa.regex}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DFA Summary */}
          {dfa && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-purple-800 text-sm">
                  {t("dfa.summary.title")}
                  {dfa.name && <span className="font-normal"> · {dfa.name}</span>}
                </p>
                <button
                  onClick={handleExport}
                  disabled={!canExport}
                  title={
                    canExport
                      ? "Export DFA as AEF"
                      : "Export nicht möglich: @NAME oder @REGEX fehlt"
                  }
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    canExport
                      ? "border-purple-300 text-purple-700 hover:bg-purple-500 hover:text-white"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Export AEF
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <span className="font-medium">{t("labels.states")}:</span> {dfa.states.length}
                  <div className="text-gray-500">[{dfa.states.join(', ')}]</div>
                </div>
                <div>
                  <span className="font-medium">{t("labels.alphabet")}:</span>
                  <div className="text-gray-500">[{dfa.alphabet.join(', ')}]</div>
                </div>
                <div>
                  <span className="font-medium">{t("labels.start")}:</span> {dfa.startState}
                </div>
                <div>
                  <span className="font-medium">{t("labels.accepting")}:</span>{' '}
                  {dfa.acceptStates.join(', ')}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">{t("labels.transitions")}:</span> {dfa.transitions.length}
              </div>
              {nfa && dfa && (
                <div className="mt-1 text-purple-700">
                  <span className="font-medium">{t("dfa.stateComparison")}:</span>{' '}
                  {nfa.states.length} → {dfa.states.length}{' '}
                  <span className="text-purple-500">
                    (×{(dfa.states.length / Math.max(1, nfa.states.length)).toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col p-3 gap-3 lg:overflow-y-auto">

          {/* Step Controls (full width) */}
          {nfa && steps.length > 0 && (
            <div>
              <StepControls steps={steps} onStepChange={handleStepChange} onExport={handleExport} canExport={canExport} />
            </div>
          )}

          {/* NFA Graph | Transition Table | DFA Graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* NFA Graph */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-semibold mb-1 px-2 py-0.5 bg-green-100 text-green-800 rounded shrink-0">
                {t("graph.nfa.title")}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {nfa ? (
                  <GraphViewer nfa={nfa} />
                ) : (
                  <div className="h-48 grid place-items-center text-gray-400 text-sm">
                    {t("graph.nfa.empty")}
                  </div>
                )}
              </div>
            </div>

            {/* Transition Table */}
            <div className="flex flex-col min-h-0">
              {nfa && currentStep ? (
                <div className="overflow-auto h-full">
                  <SubsetTable
                    step={currentStep}
                    alphabet={nfa.alphabet.filter(s => s !== 'ε')}
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <h3 className="text-xs font-semibold mb-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded shrink-0">
                    {t("table.title")}
                  </h3>
                  <div className="flex-1 border rounded-lg grid place-items-center text-gray-400 text-sm h-48">
                    —
                  </div>
                </div>
              )}
            </div>

            {/* DFA Graph */}
            <div className="flex flex-col min-h-0">
              <h3 className="text-xs font-semibold mb-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded shrink-0">
                {t("graph.dfa.step")} {currentStepIndex + 1}
                {steps.length > 0 && ` / ${steps.length}`}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {dfa && currentStep ? (
                  <GraphViewer
                    nfa={{
                      ...dfa,
                      states: currentStep.dfaStates.map(s =>
                        s.length === 1 ? s[0] : `${s.join('_')}`
                      ),
                      transitions: currentStep.dfaTransitions,
                      startState: dfa.startState,
                      acceptStates: dfa.acceptStates,
                      alphabet: dfa.alphabet,
                    }}
                  />
                ) : (
                  <div className="h-48 grid place-items-center text-gray-400 text-sm">
                    {t("graph.dfa.empty")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}