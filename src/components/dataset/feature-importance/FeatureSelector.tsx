
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Check, CheckCircle, TargetIcon } from 'lucide-react';

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
  const { targetColumn, setTargetColumn, previewColumns } = useDataset();
  
  const handleTargetColumnChange = (value: string) => {
    setTargetColumn(value);
  };
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-6">
      {/* Target Column Selector */}
      {!targetColumn && previewColumns && previewColumns.length > 0 && (
        <div className="mb-4 border border-orange-200 bg-orange-50 p-3 rounded-md">
          <h3 className="font-medium mb-2 flex items-center gap-2 text-orange-800">
            <TargetIcon className="h-4 w-4" />
            Select Target Column First
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            You need to select a target column before analyzing feature importance.
          </p>
          <Select onValueChange={handleTargetColumnChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select target column" />
            </SelectTrigger>
            <SelectContent>
              {previewColumns.map(column => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Feature Selection */}
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-purple-600" />
        Step 1: Select Features to Analyze
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Select columns you want to use as features for your model. These will be analyzed for importance.
      </p>
      
      <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white p-2">
        {availableFeatures.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No features available. Please make sure you've selected a target column.
          </div>
        ) : (
          availableFeatures.map(column => (
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
              {selectedFeatures.includes(column) && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          ))
        )}
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
      
      {targetColumn && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
          <p className="text-sm text-blue-700 flex items-center">
            <Check className="h-4 w-4 mr-2" />
            Target column: <span className="font-medium ml-1">{targetColumn}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default FeatureSelector;
