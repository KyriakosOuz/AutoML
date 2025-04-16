
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save } from 'lucide-react';

const FeatureSelector: React.FC = () => {
  const { 
    datasetId, 
    previewColumns,
    targetColumn,
    columnsToKeep,
    setColumnsToKeep,
    updateState,
    taskType
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columnsToKeep || 
    (previewColumns?.filter(col => col !== targetColumn) || [])
  );

  const toggleFeature = (column: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const selectAll = () => {
    if (!previewColumns) return;
    setSelectedColumns(previewColumns.filter(col => col !== targetColumn));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const saveDataset = async () => {
    if (!datasetId || !targetColumn) {
      setError('Dataset ID and target column are required');
      return;
    }

    if (selectedColumns.length === 0) {
      setError('Select at least one feature column');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.saveDataset(
        datasetId, 
        targetColumn,
        selectedColumns
      );
      
      // Update context with response data
      updateState({
        datasetId: response.dataset_id,
        fileUrl: response.file_url,
        columnsToKeep: response.columns_to_keep,
        targetColumn: response.target_column,
        overview: response.overview
      });
      
    } catch (error) {
      console.error('Error saving dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to save dataset');
    } finally {
      setIsLoading(false);
    }
  };

  if (!datasetId || !previewColumns || !targetColumn) {
    return null;
  }

  const availableFeatures = previewColumns.filter(col => col !== targetColumn);

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Select Features</CardTitle>
        <CardDescription>
          Choose which features to include in your model
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-800">Target Variable</h4>
          <div className="flex items-center mt-1">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">
              {targetColumn}
            </Badge>
            {taskType && (
              <span className="ml-2 text-sm text-blue-700">
                ({taskType.replace('_', ' ')})
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Available Features</h4>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                disabled={isLoading}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAll}
                disabled={isLoading}
              >
                Deselect All
              </Button>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
            {availableFeatures.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">No features available</p>
            ) : (
              availableFeatures.map((column) => (
                <div key={column} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                  <Checkbox 
                    id={`feature-${column}`}
                    checked={selectedColumns.includes(column)}
                    onCheckedChange={() => toggleFeature(column)}
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor={`feature-${column}`}
                    className="cursor-pointer flex-1"
                  >
                    {column}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Selected {selectedColumns.length} of {availableFeatures.length} features</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveDataset} 
          disabled={isLoading || selectedColumns.length === 0}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Selected Features'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeatureSelector;
