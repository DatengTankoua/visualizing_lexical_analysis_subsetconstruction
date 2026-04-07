import type { SubsetConstructionStep } from "../../core/algorithm/subsetConstruction";
import { useTranslate } from "@tolgee/react";

interface SubsetTableProps {
  step: SubsetConstructionStep;
  alphabet: string[];
}

export default function SubsetTable({ step, alphabet }: SubsetTableProps) {
  // Erstelle Transitions-Mapping für schnellen Zugriff
  const { t } = useTranslate();
  const transitionMap = new Map<string, string>();
  step.dfaTransitions.forEach(t => {
    const key = `${t.from}|${t.symbol}`;
    transitionMap.set(key, t.to);
  });

  // Prüfe ob ein Zustand markiert ist
  const isMarked = (state: string[]) => {
    return step.markedStates.some(ms => 
      ms.length === state.length && ms.every((s, i) => s === state[i])
    );
  };

  // Prüfe ob ein Zustand der aktuelle ist
  const isCurrent = (state: string[]) => {
    return step.currentState.length === state.length && 
           step.currentState.every((s, i) => s === state[i]);
  };

  // Konvertiere Zustand zu String für Anzeige
  const stateToString = (state: string[]) => {
    if (state.length === 0) return '∅';
    if (state.length === 1) return state[0];
    return `${state.join('_')}`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{t("table.title")}</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                {t("table.headers.state")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                {t("table.headers.status")}
              </th>
              {alphabet.map(symbol => (
                <th key={symbol} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.dfaStates.map((state, idx) => {
              const stateStr = stateToString(state);
              const marked = isMarked(state);
              const current = isCurrent(state);
              
              return (
                <tr 
                  key={idx}
                  className={`
                    ${current ? 'bg-blue-100 border-2 border-blue-500' : ''}
                    ${!current && !marked ? 'bg-purple-50' : ''}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className="border border-gray-300 px-4 py-2 font-mono font-medium">
                    {stateStr}
                    {current && (
                      <span className="ml-2 text-xs text-blue-600">← {t("table.current")}</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {marked ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        ✓ {t("table.status.marked")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-800 text-xs rounded">
                        ○ {t("table.status.unmarked")}
                      </span>
                    )}
                  </td>
                  {alphabet.map(symbol => {
                    const key = `${stateStr}|${symbol}`;
                    const target = transitionMap.get(key);
                    const isCurrentTransition = current && step.symbol === symbol;
                    
                    return (
                      <td 
                        key={symbol}
                        className={`
                          border border-gray-300 px-4 py-2 text-center font-mono
                          ${isCurrentTransition ? 'bg-yellow-200 font-bold' : ''}
                          ${target ? 'text-gray-900' : 'text-gray-400'}
                        `}
                      >
                        {target || t("table.empty")}
                        {isCurrentTransition && target && (
                          <span className="ml-1 text-xs text-yellow-800">⚡</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500"></div>
          <span>{t("table.legend.currentState")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200"></div>
          <span>{t("table.legend.currentTransition")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-50"></div>
          <span>{t("table.legend.unmarked")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300"></div>
          <span>{t("table.legend.marked")}</span>
        </div>
      </div>
    </div>
  );
}
