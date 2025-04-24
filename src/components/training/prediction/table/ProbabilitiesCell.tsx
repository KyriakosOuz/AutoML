
import React from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface ProbabilitiesCellProps {
  probabilities: Record<string, number>;
  showInline?: boolean;
}

export const ProbabilitiesCell: React.FC<ProbabilitiesCellProps> = ({ 
  probabilities,
  showInline = false 
}) => {
  const sortedProbs = Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a);
  
  const [highestClass, highestProb] = sortedProbs[0];
  
  if (!showInline) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline">{(highestProb * 100).toFixed(1)}%</Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
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
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedProbs.map(([label, prob]) => (
        <div key={label} className="flex justify-between text-sm">
          <Badge 
            variant={label === highestClass ? "default" : "outline"}
            className="min-w-[60px] justify-center"
          >
            {label}
          </Badge>
          <span className={label === highestClass ? "font-semibold" : ""}>
            {(prob * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};
