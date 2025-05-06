
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

// Define types for normalization
export type NormalizationMethod = 'minmax' | 'standard' | 'robust' | 'log' | 'skip';

interface NormalizationSelectorProps {
  value: NormalizationMethod;
  onChange: (value: NormalizationMethod) => void;
  hasNumericalFeatures: boolean;
  isLoading: boolean;
}

const NormalizationSelector: React.FC<NormalizationSelectorProps> = ({
  value,
  onChange,
  hasNumericalFeatures,
  isLoading
}) => {
  return (
    <div>
      <h4 className="font-medium mb-2">Normalization</h4>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={value}
                onValueChange={(value) => onChange(value as NormalizationMethod)}
                disabled={!hasNumericalFeatures || isLoading}
              >
                <SelectTrigger className="w-full" aria-disabled={!hasNumericalFeatures || isLoading}>
                  <SelectValue placeholder="Select normalization method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                  <SelectItem value="standard">Standard Scaling (Z-score)</SelectItem>
                  <SelectItem value="robust">Robust Scaling</SelectItem>
                  <SelectItem value="log">Log Transformation</SelectItem>
                  <SelectItem value="skip">Skip Normalization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {!hasNumericalFeatures && (
            <TooltipContent>
              <p>Normalization is disabled because no numerical features are selected.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <p className="text-xs text-gray-500 mt-1">
        {value === 'minmax' && 'Scales features to a range of [0,1]'}
        {value === 'standard' && 'Transforms features to have mean=0 and variance=1'}
        {value === 'robust' && 'Uses median and IQR, less sensitive to outliers'}
        {value === 'log' && 'Applies log transformation to handle skewed data'}
        {value === 'skip' && 'No normalization will be applied'}
      </p>
    </div>
  );
};

export default NormalizationSelector;
