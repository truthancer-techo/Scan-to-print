import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
  maxAccessibleStep?: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep = currentStep,
}) => {
  const steps: { num: 1 | 2 | 3 | 4; label: string; shortLabel: string }[] = [
    { num: 1, label: 'Upload', shortLabel: 'Upload' },
    { num: 2, label: 'Configure', shortLabel: 'Configure' },
    { num: 3, label: 'Preview', shortLabel: 'Preview' },
    { num: 4, label: 'Confirm', shortLabel: 'Confirm' },
  ];

  // Precise track progress widths for the connector line
  const progressPercentage =
    currentStep === 1 ? '12%' : currentStep === 2 ? '38%' : currentStep === 3 ? '68%' : '100%';

  return (
    <div className="w-full max-w-xl mx-auto mb-6 px-3">
      <div className="relative py-2">
        {/* Background connector track line */}
        <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-[2px] bg-slate-800/90 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"
            style={{ width: progressPercentage }}
          />
        </div>

        <div className="flex items-center justify-between relative z-10">
          {steps.map((step) => {
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isClickable = onStepClick && (isDone || step.num <= maxAccessibleStep);

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (isClickable && onStepClick) {
                    onStepClick(step.num);
                  }
                }}
                disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex flex-col items-center group select-none transition-transform focus:outline-none ${
                  isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default'
                }`}
                title={isClickable ? `Jump to ${step.label}` : step.label}
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-200 ${
                    isCurrent
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20 scale-105'
                      : isDone
                      ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30'
                      : 'bg-[#0b1426] border border-blue-900/60 text-slate-400 group-hover:border-slate-600'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] sm:text-xs mt-2 font-bold tracking-tight whitespace-nowrap transition-colors relative ${
                    isCurrent
                      ? 'text-white font-extrabold'
                      : isDone
                      ? 'text-slate-300 group-hover:text-orange-400'
                      : 'text-slate-400'
                  }`}
                >
                  {step.shortLabel}
                  {isCurrent && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


