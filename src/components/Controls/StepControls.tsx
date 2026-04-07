import { useState, useEffect } from "react";
import type { SubsetConstructionStep } from "../../core/algorithm/subsetConstruction";
import { useTranslate } from "@tolgee/react";


interface StepControlsProps {
  steps: SubsetConstructionStep[];
  onStepChange?: (step: SubsetConstructionStep, index: number) => void;
  onExport?: () => void;
  canExport?: boolean;
}

export default function StepControls({ steps, onStepChange, onExport, canExport = false }: StepControlsProps) {
  const { t } = useTranslate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (onStepChange && currentStep) {
      onStepChange(currentStep, currentStepIndex);
    }
  }, [currentStepIndex, currentStep, onStepChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  if (steps.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border rounded">
        <p className="text-gray-500">{t("controls.noSteps")}</p>
      </div>
    );
  }

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">{t("controls.title")}</h2>
        <span className="text-sm text-gray-600">
          {t("controls.stepCounter")} {currentStepIndex + 1} / {steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Description */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">
          {currentStep.description}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {currentStep.currentStateString && (
            <div>
              <span className="font-medium text-gray-700">{t("controls.currentState")}</span>
              <div className="text-blue-800 font-mono mt-1">
                {currentStep.currentStateString}
              </div>
            </div>
          )}

          {currentStep.symbol && (
            <div>
              <span className="font-medium text-gray-700">{t("controls.symbol")}</span>
              <div className="text-blue-800 font-mono mt-1">
                {currentStep.symbol}
              </div>
            </div>
          )}

          {currentStep.moveResult && currentStep.moveResult.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">{t("controls.moveResult")}</span>
              <div className="text-blue-800 font-mono mt-1">
                {"{" + currentStep.moveResult.join(", ") + "}"}
              </div>
            </div>
          )}

          {currentStep.epsilonClosureResult && currentStep.epsilonClosureResult.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">{t("controls.epsilonClosure")}</span>
              <div className="text-blue-800 font-mono mt-1">
                {"{" + currentStep.epsilonClosureResult.join(", ") + "}"}
              </div>
            </div>
          )}

          {currentStep.newDFAState && (
            <div>
              <span className="font-medium text-gray-700">{t("controls.newDFAState")}</span>
              <div className="text-blue-800 font-mono mt-1 flex items-center gap-2">
                {currentStep.newDFAState}
                {currentStep.isNewState && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    {t("controls.new")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 text-sm">
        <div className="p-2 sm:p-3 bg-white border rounded">
          <div className="font-medium text-gray-700 mb-1 text-xs sm:text-sm">{t("controls.stats.dfaStates")}</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {currentStep.dfaStates.length}
          </div>
        </div>
        <div className="p-2 sm:p-3 bg-white border rounded">
          <div className="font-medium text-gray-700 mb-1 text-xs sm:text-sm">{t("controls.stats.transitions")}</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {currentStep.dfaTransitions.length}
          </div>
        </div>
        <div className="p-2 sm:p-3 bg-white border rounded">
          <div className="font-medium text-gray-700 mb-1 text-xs sm:text-sm">{t("controls.stats.unmarked")}</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {currentStep.unmarkedStates.length}
          </div>
        </div>
      </div>

      {/* Completion Status */}
      {currentStep.isComplete && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              ✓ {t("controls.complete.title")}
            </h4>
            {onExport && (
              <button
                onClick={onExport}
                disabled={!canExport}
                title={
                  canExport
                    ? "Export DFA as AEF"
                    : "Export nicht möglich: @NAME oder @REGEX fehlt"
                }
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  canExport
                    ? "border-green-400 text-green-700 hover:bg-green-600 hover:text-white"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Export AEF
              </button>
            )}
          </div>
          <p className="text-sm text-green-700 mt-1">
            {t("controls.complete.text")} {currentStep.dfaStates.length} {t("controls.complete.statesAnd")} {currentStep.dfaTransitions.length} {t("controls.complete.transitionsSuffix")}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setCurrentStepIndex(0); setIsPlaying(false); }}
            disabled={currentStepIndex === 0}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            title={t("controls.buttons.toStart")}
          >
            ⏮️ {t("controls.buttons.start")}
          </button>
          
          <button
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            ⬅️ {t("controls.buttons.back")}
          </button>
          
          <button
            onClick={() => {
              if (currentStepIndex >= steps.length - 1) setCurrentStepIndex(0);
              setIsPlaying(!isPlaying);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded font-medium text-sm ${
              isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {isPlaying ? `⏸️ ${t("controls.buttons.pause")}` : `▶️ ${t("controls.buttons.play")}`}
          </button>
          
          <button
            onClick={() => setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStepIndex >= steps.length - 1}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {t("controls.buttons.next")} ➡️
          </button>
          
          <button
            onClick={() => { setCurrentStepIndex(steps.length - 1); setIsPlaying(false); }}
            disabled={currentStepIndex >= steps.length - 1}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            title={t("controls.buttons.toEnd")}
          >
            {t("controls.buttons.end")} ⏭️
          </button>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label className="text-sm text-gray-700">{t("controls.speed.label")}</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={2000}>{t("controls.speed.slow")}</option>
            <option value={1000}>{t("controls.speed.normal")}</option>
            <option value={500}>{t("controls.speed.fast")}</option>
          </select>
        </div>
      </div>

      {/* Step Slider */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 min-w-[60px]">{t("controls.stepLabel")}:</span>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={currentStepIndex}
          onChange={(e) => {
            setCurrentStepIndex(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
}
