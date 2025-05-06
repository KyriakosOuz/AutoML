
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export type BalanceStrategy = 'undersample' | 'oversample' | 'skip';

interface BalanceStrategySelectorProps {
  value: BalanceStrategy;
  onChange: (value: BalanceStrategy) => void;
  isClassification: boolean;
  isLoading: boolean;
}

const BalanceStrategySelector: React.FC<BalanceStrategySelectorProps> = ({
  value,
  onChange,
  isClassification,
  isLoading
}) => {
  return (
    <div>
      <h4 className="font-medium mb-2">Balance Classes</h4>
      
      {!isClassification && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700">
            Class balancing is only applicable to classification tasks (binary or multiclass), not regression.
          </AlertDescription>
        </Alert>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={value}
                onValueChange={(value) => onChange(value as BalanceStrategy)}
                disabled={!isClassification || isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select balance strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Skip Balancing</SelectItem>
                  <SelectItem value="undersample">Undersampling</SelectItem>
                  <SelectItem value="oversample">Oversampling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {!isClassification && (
            <TooltipContent>
              <p>Balancing is only supported for classification tasks, not regression.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <p className="text-xs text-gray-500 mt-1">
        {value === 'undersample' && 'Reduces samples from majority classes to balance class distribution'}
        {value === 'oversample' && 'Increases samples in minority classes through duplication or synthetic generation'}
        {value === 'skip' && 'No class balancing will be applied'}
        {!isClassification && 'Class balancing is only applicable for classification tasks'}
      </p>
    </div>
  );
};

export default BalanceStrategySelector;
