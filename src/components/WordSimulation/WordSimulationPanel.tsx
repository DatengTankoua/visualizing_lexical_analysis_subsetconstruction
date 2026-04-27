import { useMemo, useState } from "react";
import type { DFA } from "../../core/models/types";
import {
  simulateDfaRun,
  type SimulationResult,
} from "../../core/algorithm/simulateDfaRun";
import { useTranslate } from "@tolgee/react";

type Props = {
  dfa: DFA | null;
  onActiveStateChange?: (stateId: string | null) => void;
};

export default function WordSimulationPanel({
  dfa,
  onActiveStateChange,
}: Props) {
  const { t } = useTranslate();
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
      <h3 className="text-base font-semibold mb-3">{t("simulation.title")}</h3>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          placeholder={t("simulation.inputPlaceholder")}
          disabled={!dfa}
          className="border rounded px-3 py-2 flex-1 min-w-[220px]"
        />

        <button
          onClick={handleStart}
          disabled={!dfa}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-100 active:bg-gray-200 transition-colors whitespace-nowrap"
        >{t("simulation.buttons.start")}
        </button>

        <button
          onClick={handleBack}
          disabled={!simulationResult || currentStepIndex === 0}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-200 active:bg-gray-300 transition-colors whitespace-nowrap"
        >{t("simulation.buttons.back")}
        </button>

        <button
          onClick={handleNext}
          disabled={
            !simulationResult ||
            currentStepIndex >= simulationResult.steps.length - 1
          }
          className="px-3 py-2 rounded border bg-white hover:bg-gray-200 active:bg-gray-300 transition-colors whitespace-nowrap"
        >{t("simulation.buttons.next")}
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-2 rounded border bg-white hover:bg-gray-200 active:bg-gray-300 transition-colors whitespace-nowrap"
        >{t("simulation.buttons.reset")}
        </button>
      </div>

      {currentStep && simulationResult && (
        <div className="space-y-3 text-sm">
            <div className="text-sm text-gray-500">{t("simulation.step")} {currentStepIndex} / {totalSteps}</div>
            
            <div>
              <div className="text-gray-600">{t("simulation.currentState")}:</div>
              <div className="font-mono text-xl font-semibold mt-1">{currentStep.currentStateId}</div>
            </div>

            <div>
              <div className="font-medium text-gray-600 mb-1">{t("simulation.wordProgress")}:</div>
              
              {inputWord === "" ? (
                <div className="text-gray-400 italic">{t("simulation.emptyInput")}</div>
              
              ) : simulationResult.stoppedEarly && isLastStep ?(
                <div className="font-mono text-xl font-semibold tracking-wider">
                  {currentStepIndex > 0 && (
                    <span className="bg-gray-300 rounded px-1 text-gray-500">{currentStep.consumed}</span>
                  )}
                  <span className="text-black">{currentStep.currentSymbol ?? ""}{currentStep.remaining}</span>
                </div>
              ) :isLastStep ? (
                <div className="font-mono text-xl font-semibold tracking-wider">
                  <span className="bg-gray-300 rounded px-1 text-gray-500">{currentStep.consumed}</span>
                </div>
              ) : (
                <div className="font-mono text-xl font-semibold tracking-wider">
                  {currentStepIndex > 0 && (
                    <span className="bg-gray-300 rounded px-1 text-gray-500">{currentStep.consumed}</span>
                  )}
                  <span className="bg-yellow-200 rounded px-1 font-semibold text-yellow-700">{currentStep.currentSymbol ?? ""}</span>
                  <span className="text-black">{currentStep.remaining}</span>
                </div>
              )}
            </div>
            
            <div className="text-xs mt-2 flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-300 rounded"></span>
              <span>{t("simulation.legend.processed")}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-300 rounded"></span>
              <span>{t("simulation.legend.current")}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-black rounded"></span>
              <span>{t("simulation.legend.remaining")}</span>
            </div>
          </div>

          {/* 正常结束 → akzeptiert */}
          {simulationResult && !simulationResult.stoppedEarly && isLastStep && (
            <div className="mt-2 text-sm font-medium text-green-600"> {t("simulation.accepted")}</div>
        )}
          
          {/* 错误提示（只在中途失败时显示） */}
          {inputWord !== "" && simulationResult.stoppedEarly &&isLastStep && (
            <div className="mt-2 text-sm font-medium text-red-600">
              {t("simulation.errors.noTransition", {
                symbol: currentStep.currentSymbol,
                state: currentStep.currentStateId,
              })}{" "}
            <br />{t("simulation.errors.stoppedEarly")}</div>
          )}
        </div>
      )}
    </div>
  );
}