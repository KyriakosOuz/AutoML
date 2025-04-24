
import React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface ClassProbabilitiesProps {
  probabilities: Record<string, number>;
  displayMode?: 'inline' | 'tooltip';
}

export const ClassProbabilities: React.FC<ClassProbabilitiesProps> = ({ 
  probabilities, 
  displayMode = 'inline' 
}) => {
  const sortedProbs = Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a);
  
  const highestProb = sortedProbs[0];

  if (displayMode === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="ml-2">
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {sortedProbs.map(([label, prob]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="font-medium">{label}:</span>
                  <span>{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {sortedProbs.map(([label, prob]) => (
        <div 
          key={label} 
          className={`flex justify-between ${
            highestProb[0] === label ? 'text-primary font-medium' : ''
          }`}
        >
          <span>{label}:</span>
          <span>{(prob * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};
