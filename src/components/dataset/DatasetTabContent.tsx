
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Info } from 'lucide-react';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/feature-importance/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/feature-importance/FeatureSelector';
import FeatureAnalyzer from '@/components/dataset/feature-importance/FeatureAnalyzer';
import SaveDatasetButton from '@/components/dataset/feature-importance/SaveDatasetButton';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { TabsContent } from '@/components/ui/tabs';
import { useDataset } from '@/contexts/DatasetContext';
import { useState, useEffect } from 'react';
import { datasetApi } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TabContentProps {
  activeTab: string;
  datasetId: string | null;
  targetColumn: string | null;
  taskType: string | null;
  processingStage: string | null;
  columnsToKeep: string[] | null;
  goToNextTab: () => void;
  formatTaskType: (type: string | null) => string;
}

const DatasetTabContent: React.FC<TabContentProps> = ({
  activeTab,
  datasetId,
  targetColumn,
  taskType,
  processingStage,
  columnsToKeep,
  goToNextTab,
  formatTaskType,
}) => {
  // Get the featureImportance data from the DatasetContext
  const { featureImportance, overview, previewColumns, setTargetColumn, setTaskType } = useDataset();
  
  // Local state for selected features and save status
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    // Initialize with columns to keep if available, otherwise all columns except target
    columnsToKeep || 
    (previewColumns && targetColumn 
      ? previewColumns.filter(col => col !== targetColumn)
      : [])
  );
  
  const [featuresAreSaved, setFeaturesAreSaved] = useState<boolean>(!!processingStage && processingStage === 'final');
  
  // State for loading task type
  const [isLoadingTaskType, setIsLoadingTaskType] = useState<boolean>(false);
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null);
  
  // Update selected features when columns to keep changes
  useEffect(() => {
    if (columnsToKeep) {
      setSelectedFeatures(columnsToKeep);
    } else if (previewColumns && targetColumn) {
      setSelectedFeatures(previewColumns.filter(col => col !== targetColumn));
    }
  }, [columnsToKeep, previewColumns, targetColumn]);
  
  // Functions to handle feature selection
  const handleFeatureToggle = (column: string) => {
    setSelectedFeatures(prev => 
      prev.includes(column)
        ? prev.filter(f => f !== column)
        : [...prev, column]
    );
    // Reset save state when features are changed
    setFeaturesAreSaved(false);
  };

  const handleSelectAll = () => {
    if (previewColumns && targetColumn) {
      // Select all columns except the target column
      setSelectedFeatures(previewColumns.filter(col => col !== targetColumn));
    }
    // Reset save state when features are changed
    setFeaturesAreSaved(false);
  };

  const handleClearAll = () => {
    setSelectedFeatures([]);
    // Reset save state when features are changed
    setFeaturesAreSaved(false);
  };
  
  // Function to get available features (all columns except target column)
  const getAvailableFeatures = () => {
    if (!previewColumns) return [];
    return targetColumn
      ? previewColumns.filter(col => col !== targetColumn)
      : previewColumns;
  };

  // Handle target column change
  const handleTargetColumnChange = async (value: string) => {
    setTargetColumn(value);
    // Update selected features to exclude the new target column
    if (previewColumns) {
      setSelectedFeatures(prev => prev.filter(col => col !== value));
    }
    
    // Reset save state when target column is changed
    setFeaturesAreSaved(false);
    
    // Reset task type detection error
    setTaskTypeError(null);
    
    // Only proceed with API call if we have a dataset ID
    if (datasetId) {
      setIsLoadingTaskType(true);
      try {
        const response = await datasetApi.detectTaskType(datasetId, value);
        
        // Extract task type from response
        let detectedTaskType = null;
        
        if (response && typeof response === 'object' && response.task_type) {
          detectedTaskType = response.task_type;
        } else if (response && typeof response === 'object' && response.data && response.data.task_type) {
          detectedTaskType = response.data.task_type;
        } else if (typeof response === 'string') {
          detectedTaskType = response.trim();
        }
        
        // Validate the task type - only accept specific values
        const validTaskTypes = ['binary_classification', 'multiclass_classification', 'regression'];
        if (detectedTaskType && validTaskTypes.includes(detectedTaskType)) {
          console.log('Detected task type:', detectedTaskType);
          setTaskType(detectedTaskType);
        } else {
          // Handle invalid task type
          console.error('Invalid task type received:', detectedTaskType);
          setTaskTypeError(`Invalid task type: ${detectedTaskType}. Expected one of: binary_classification, multiclass_classification, regression`);
        }
      } catch (error) {
        console.error('Error detecting task type:', error);
        setTaskTypeError(error instanceof Error ? error.message : 'Failed to detect task type');
      } finally {
        setIsLoadingTaskType(false);
      }
    }
  };

  // Handler for when save is complete
  const handleSaveComplete = () => {
    setFeaturesAreSaved(true);
  };

  // Get tooltip content based on task type
  const getTaskTypeTooltip = (type: string | null) => {
    if (!type) return "Select a target column to determine the task type";
    
    switch(type) {
      case 'binary_classification':
        return "Binary Classification: Predicting one of two possible outcomes (e.g. yes/no, true/false)";
      case 'multiclass_classification':
        return "Multiclass Classification: Predicting one of three or more possible outcomes";
      case 'regression':
        return "Regression: Predicting a continuous numerical value";
      default:
        return `${formatTaskType(type)}: Predicting values based on input features`;
    }
  };
  
  // Handle successful file upload
  const handleUploadSuccess = () => {
    goToNextTab();
  };
  
  return (
    <>
      <TabsContent value="upload" className="pt-4">
        <FileUpload />
        {datasetId && (
          <>
            <DataPreview />
            <div className="flex justify-end mt-4">
              <Button 
                onClick={goToNextTab} 
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
              >
                Next: Explore Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="explore" className="pt-4">
        <MissingValueHandler />
        <DataPreview />
        {/* Show Next button if either there are no missing values initially or after processing */}
        {(processingStage === 'cleaned' || (datasetId && hasNoMissingValues(overview))) && (
          <div className="flex justify-end mt-4">
            <Button 
              onClick={goToNextTab} 
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
            >
              Next: Feature Selection
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="features" className="pt-4">
        {/* Target Selection and Task Type Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Target & Task Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Target Column Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Target Column
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 inline ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          The target column is what your model will predict based on the other features
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Select 
                  value={targetColumn || ""} 
                  onValueChange={handleTargetColumnChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target column" />
                  </SelectTrigger>
                  <SelectContent>
                    {previewColumns?.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Task Type Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Task Type
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 inline ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          {getTaskTypeTooltip(taskType)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm flex items-center">
                  {isLoadingTaskType ? (
                    "Detecting task type..."
                  ) : taskTypeError ? (
                    <span className="text-destructive">{taskTypeError}</span>
                  ) : taskType ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {formatTaskType(taskType)}
                    </Badge>
                  ) : (
                    "Not determined yet"
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Feature Selector Component with clear layout */}
        <FeatureSelector 
          selectedFeatures={selectedFeatures}
          availableFeatures={getAvailableFeatures()}
          onFeatureToggle={handleFeatureToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
        
        {/* Feature Analyzer Component */}
        <FeatureAnalyzer selectedFeatures={selectedFeatures} />
        
        {/* Feature Importance Chart - Only shown if data available */}
        {featureImportance && featureImportance.length > 0 ? (
          <>
            <FeatureImportanceChart featureImportance={featureImportance} />
            
            {/* Save & Next buttons positioned side by side */}
            <div className="flex justify-end gap-4 mt-6">
              <SaveDatasetButton 
                selectedFeatures={selectedFeatures}
                onSaveComplete={handleSaveComplete}
              />
              
              <Button 
                onClick={goToNextTab}
                disabled={!featuresAreSaved}
                variant="outline"
                size="lg"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Next: Preprocess
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center mt-6">
            <p className="text-gray-600 mb-4">No feature importance data available yet.</p>
            {targetColumn ? (
              <p className="text-sm text-gray-500">Select features above and click "Analyze Feature Importance" to view this chart.</p>
            ) : (
              <p className="text-sm text-gray-500">Select a target column first, then analyze feature importance.</p>
            )}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="preprocess" className="pt-4">
        <PreprocessingOptions />
        <DataPreview />
        {datasetId && targetColumn && taskType && (
          <div className="flex justify-end mt-8">
            <Link to="/training">
              <Button size="lg" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                <PlayCircle className="h-5 w-5" />
                Next: Train Model
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </TabsContent>
    </>
  );
};

// Helper function to check if dataset has no missing values
const hasNoMissingValues = (overview: any) => {
  return overview && 
    (!overview.total_missing_values || overview.total_missing_values === 0);
};

export default DatasetTabContent;
