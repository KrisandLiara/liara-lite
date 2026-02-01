import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  step: number;
  title: string;
  isActive: boolean;
  isComplete: boolean;
  isLast?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  step, 
  title, 
  isActive, 
  isComplete, 
  isLast = false 
}) => {
  return (
    <div className="flex items-center">
      {/* Step Circle */}
      <div className="flex items-center">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
            isComplete
              ? "bg-emerald-500 border-emerald-500 text-white"
              : isActive
              ? "bg-sky-500 border-sky-500 text-white"
              : "bg-slate-700 border-slate-600 text-slate-400"
          )}
        >
          {isComplete ? (
            <Check className="w-4 h-4" />
          ) : (
            <span className="text-sm font-semibold">{step}</span>
          )}
        </div>
        
        {/* Step Title */}
        <div className="ml-3">
          <div
            className={cn(
              "text-sm font-medium transition-colors",
              isComplete
                ? "text-emerald-400"
                : isActive
                ? "text-sky-400"
                : "text-slate-400"
            )}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Arrow Connector */}
      {!isLast && (
        <ArrowRight 
          className={cn(
            "w-4 h-4 mx-4 transition-colors",
            isComplete ? "text-emerald-500" : "text-slate-600"
          )} 
        />
      )}
    </div>
  );
};

interface StepProgressProps {
  currentStep: number;
  steps: Array<{ title: string; isComplete: boolean }>;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center py-6 mb-6 bg-slate-800/50 rounded-lg border border-slate-700">
      {steps.map((step, index) => (
        <StepIndicator
          key={index}
          step={index + 1}
          title={step.title}
          isActive={currentStep === index + 1}
          isComplete={step.isComplete}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}; 