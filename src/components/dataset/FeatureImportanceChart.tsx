
import React, { useState, useEffect } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';

// Import refactored components
import TaskTypeSelector from './feature-importance/TaskTypeSelector';
import FeatureSelector from './feature-importance/FeatureSelector';
import FeatureAnalyzer from './feature-importance/FeatureAnalyzer';
import FeatureImportanceChartComponent from './feature-importance/FeatureImportanceChart';
import SaveDatasetButton from './feature-importance/SaveDatasetButton';

const FeatureImportanceChart: React.FC = () => {
  const { 
    datasetId, 
    previewColumns, 
    targetColumn, 
    setTargetColumn,
    featureImportance,
    setFeatureImportance,
    taskType,
    setTaskType,
    setColumnsToKeep,
    columnsToKeep,
  } = useDataset();
  
  const [error, setError] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(columnsToKeep || []);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  
  // Update available features when target column changes
  useEffect(() => {
    if (previewColumns && targetColumn) {
      setAvailableFeatures(previewColumns.filter(col => col !== targetColumn));
    } else {
      setAvailableFeatures([]);
    }
  }, [previewColumns, targetColumn]);

  // Handle target column change
  const handleTargetColumnChange = (value: string) => {
    // Reset feature importance when target column changes
    setFeatureImportance(null);
    
    // Use all non-target columns as default selected columns
    if (previewColumns) {
      const defaultColumns = previewColumns.filter(col => col !== value);
      setColumnsToKeep(defaultColumns);
      setSelectedFeatures(defaultColumns);
    }
  };

  // Toggle feature selection
  const toggleFeature = (column: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  // Utility functions for feature selection
  const selectAllFeatures = () => setSelectedFeatures(availableFeatures);
  const clearAllFeatures = () => setSelectedFeatures([]);

  if (!datasetId || !previewColumns) {
    return null;
  }

  return (
    <Card className="w-full mt-6 overflow-hidden border border-gray-100 shadow-md rounded-xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <BarChart3 className="h-5 w-5" />
          Target Selection & Feature Analysis
        </CardTitle>
        <CardDescription>
          Select your target variable and analyze feature importance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Step 1: Target Column Selection */}
          <TaskTypeSelector onTargetColumnChange={handleTargetColumnChange} />

          {/* Step 2: Feature Selection - Only show after target column is selected */}
          {targetColumn && taskType && availableFeatures.length > 0 && (
            <>
              <FeatureSelector 
                selectedFeatures={selectedFeatures}
                availableFeatures={availableFeatures}
                onFeatureToggle={toggleFeature}
                onSelectAll={selectAllFeatures}
                onClearAll={clearAllFeatures}
              />
              
              <FeatureAnalyzer 
                selectedFeatures={selectedFeatures}
              />
            </>
          )}

          {/* Feature importance chart */}
          {featureImportance && featureImportance.length > 0 && (
            <FeatureImportanceChartComponent featureImportance={featureImportance} />
          )}
        </div>
      </CardContent>
      
      {targetColumn && featureImportance && featureImportance.length > 0 && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 gap-2 flex justify-end">
          <SaveDatasetButton />
        </CardFooter>
      )}
    </Card>
  );
};

export default FeatureImportanceChart;
