
import React from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { 
  Checkbox 
} from '@/components/ui/checkbox';
import { 
  Label 
} from '@/components/ui/label';
import { 
  Button 
} from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface FeatureSelectorProps {
  selectedFeatures: string[];
  availableFeatures: string[];
  onFeatureToggle: (column: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  selectedFeatures,
  availableFeatures,
  onFeatureToggle,
  onSelectAll,
  onClearAll
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-purple-600" />
        Step 2: Select Features to Analyze
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Select columns you want to use as features for your model. These will be analyzed for importance.
      </p>
      
      <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white p-2">
        {availableFeatures.map(column => (
          <div key={column} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
            <Checkbox 
              id={`feature-${column}`}
              checked={selectedFeatures.includes(column)}
              onCheckedChange={() => onFeatureToggle(column)}
            />
            <Label 
              htmlFor={`feature-${column}`}
              className="cursor-pointer flex-1"
            >
              {column}
            </Label>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-3">
        <p className="text-sm text-gray-500">
          {selectedFeatures.length} of {availableFeatures.length} features selected
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSelectAll}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeatureSelector;
