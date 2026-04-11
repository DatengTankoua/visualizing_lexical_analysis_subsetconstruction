import { useMemo, useState } from "react";
import type { DFA } from "../../core/models/types";
import {
  simulateDfaRun,
  type SimulationResult,
} from "../../core/algorithm/simulateDfaRun";

type Props = {
  dfa: DFA | null;
  onActiveStateChange?: (stateId: string | null) => void;
};

export default function WordSimulationPanel({
  dfa,
  onActiveStateChange,
}: Props) {
  const [inputWord, setInputWord] = useState("");
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = useMemo(() => {
    if (!simulationResult) return null;
    return simulationResult.steps[currentStepIndex] ?? null;
  }, [simulationResult, currentStepIndex]);

  // Hilfsvariablen für Anzeige (bessere Lesbarkeit im JSX)
  const totalSteps = simulationResult ? simulationResult.steps.length - 1 : 0;
  const isLastStep = simulationResult ? currentStepIndex === simulationResult.steps.length - 1 : false;

  const handleStart = () => {
    if (!dfa) return;

    const result = simulateDfaRun(dfa, inputWord);
    setSimulationResult(result);
    setCurrentStepIndex(0);
    onActiveStateChange?.(result.steps[0]?.currentStateId ?? null);
  };

  const handleNext = () => {
    if (!simulationResult) return;

    const nextIndex = Math.min(
      currentStepIndex + 1,
      simulationResult.steps.length - 1
    );

    setCurrentStepIndex(nextIndex);
    onActiveStateChange?.(
      simulationResult.steps[nextIndex]?.currentStateId ?? null
    );
  };

  const handleBack = () => {
    if (!simulationResult) return;

    const nextIndex = Math.max(currentStepIndex - 1, 0);

    setCurrentStepIndex(nextIndex);
    onActiveStateChange?.(
      simulationResult.steps[nextIndex]?.currentStateId ?? null
    );
  };

  const handleReset = () => {
    setSimulationResult(null);
    setCurrentStepIndex(0);
    setInputWord("");
    onActiveStateChange?.(null);
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 mb-4 bg-white">
      <h3 className="text-base font-semibold mb-3">DFA-Wortsimulation</h3>

      <div className="flex items-center gap-2 mb-3 flex-nowrap">
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder="Wort eingeben"
          disabled={!dfa}
          className="border rounded px-3 py-2 w-40"
        />

        <button
          onClick={handleStart}
          disabled={!dfa}
          className="px-3 py-2 rounded border whitespace-nowrap"
        >
          Start
        </button>

        <button
          onClick={handleBack}
          disabled={!simulationResult || currentStepIndex === 0}
          className="px-3 py-2 rounded border whitespace-nowrap"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={
            !simulationResult ||
            currentStepIndex >= simulationResult.steps.length - 1
          }
          className="px-3 py-2 rounded border whitespace-nowrap"
        >
          Next
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-2 rounded border whitespace-nowrap"
        >
          Reset
        </button>
      </div>

      
      {currentStep && simulationResult && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500">
              Schritt {currentStepIndex} / {totalSteps}
            </span>
            
            <div>
              <span className="font-medium">Aktueller Zustand:</span>{" "}
              {currentStep.currentStateId}
            </div>
          </div>
          
          {!isLastStep ? (
            <div className="font-mono text-lg tracking-wider">
              {currentStepIndex > 0 && (
              <span className="bg-gray-200 rounded px-1 text-gray-700">
                {currentStep.consumed}
              </span>
              )}
              <span className="bg-yellow-200 rounded px-1 font-semibold text-gray-900">
                {currentStep.currentSymbol ?? ""}
              </span>
              <span className="text-black">
                {currentStep.remaining}
              </span>
            </div>
          ) : (
            <div className="font-mono text-lg tracking-wider">
              <span className="bg-gray-200 rounded px-1 text-gray-700">
                {currentStep.consumed}
              </span>
            </div>
          )}
          <div className="text-xs mt-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-300 rounded"></span>
              <span>verarbeitet</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-200 rounded"></span>
              <span>aktuell</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-black rounded"></span>
              <span>verbleibend</span>
            </div>
          </div>
          
          {isLastStep && (
            <div className="text-sm font-medium text-gray-700">
              Ende der Simulation
            </div>
          )}
        </div>
      )}
    </div>
  );
}