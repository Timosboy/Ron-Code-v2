import { Check } from 'lucide-react';

interface StepperCRMProps {
  stages: string[];
  currentStage: number;
  startIndex?: number;
}

export default function StepperCRM({ stages, currentStage, startIndex = 1 }: StepperCRMProps) {
  return (
    <div className="flex items-center w-full px-2 py-4">
      {stages.map((label, i) => {
        const stageNumber = startIndex + i;
        const isComplete = currentStage > stageNumber;
        const isCurrent = currentStage === stageNumber;
        const isPending = currentStage < stageNumber;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  isComplete
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : isCurrent
                      ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500 ring-offset-2'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : stageNumber}
              </div>
              <span
                className={`text-[11px] font-medium text-center max-w-[80px] leading-tight ${
                  isComplete || isCurrent ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 mx-2 mt-[-18px]">
                <div className="h-0.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-violet-500 w-full' : isPending ? 'w-0' : 'bg-violet-300 w-1/2'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
