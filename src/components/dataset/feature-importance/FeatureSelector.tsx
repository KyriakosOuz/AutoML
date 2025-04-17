
import React from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
  Check, CheckCircle, Filter, BarChart3
} from 'lucide-react';
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
  const { 
    datasetId,
    targetColumn,
    taskType,
    updateState
  } = useDataset();
  
  const { toast } = useToast();
  const [isAnalyzingFeatures, setIsAnalyzingFeatures] = React.useState(false);

  const analyzeFeatures = async () => {
    if (!datasetId || !targetColumn) {
      toast({
        title: "Error",
        description: "Dataset ID and target column are required",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedFeatures.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one feature to analyze",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzingFeatures(true);
      
      const response = await datasetApi.featureImportancePreview(
        datasetId, 
        targetColumn
      );
      
      const importanceData = response.data.feature_importance || [];
      
      if (!importanceData || importanceData.length === 0) {
        throw new Error('No feature importance data returned from API');
      }
      
      const filteredImportance = importanceData.filter(
        (item: any) => selectedFeatures.includes(item.feature)
      );
      
      const sortedImportance = [...filteredImportance].sort(
        (a: any, b: any) => b.importance - a.importance
      );
      
      updateState({
        featureImportance: sortedImportance,
        taskType: response.data.task_type || taskType,
        columnsToKeep: selectedFeatures
      });
      
      toast({
        title: "Feature importance analyzed",
        description: "Feature importance analysis completed successfully",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error analyzing features:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to analyze features',
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingFeatures(false);
    }
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
        </div>
      </CardHeader>
      
      <CardContent>
        {!targetColumn && (
          <div className="mb-4 border border-orange-200 bg-orange-50 p-3 rounded-md">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              Please select a target column in the Data Target section above before selecting features
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
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={analyzeFeatures} 
                disabled={isAnalyzingFeatures || !targetColumn || selectedFeatures.length === 0}
                variant="default"
                size="lg"
                className="bg-black hover:bg-gray-800"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {isAnalyzingFeatures ? 'Analyzing...' : 'Analyze Feature Importance'}
              </Button>
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
