
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Feature Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select which features to use for analysis and modeling
            </p>
          </div>
          
          {/* Target Column Selector - Always visible, just disabled if already selected */}
          <div className="w-full md:w-64">
            <Select 
              value={targetColumn || ""} 
              onValueChange={handleTargetColumnChange}
              disabled={!previewColumns || previewColumns.length === 0}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <TargetIcon className="h-4 w-4 text-purple-500" />
                  <SelectValue placeholder="Select target column" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {previewColumns && previewColumns.map(column => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Target column is what your model will predict
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!targetColumn && previewColumns && previewColumns.length > 0 && (
          <div className="mb-4 border border-orange-200 bg-orange-50 p-3 rounded-md">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              Please select a target column before selecting features
            </p>
          </div>
        )}
        
        {targetColumn && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Filter className="h-4 w-4 text-purple-600" />
                Features to Analyze
              </h4>
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
            
            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg bg-white p-2">
              {availableFeatures.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No features available. Please make sure you've selected a target column.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
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
                      {selectedFeatures.includes(column) && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-3">
              <p className="text-sm text-gray-500">
                {selectedFeatures.length} of {availableFeatures.length} features selected
              </p>
            </div>
          </>
        )}
        
        {targetColumn && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
            <p className="text-sm text-blue-700 flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Target column: <span className="font-medium ml-1">{targetColumn}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureSelector;
