import React from 'react';
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
  const { featureImportance, overview, previewColumns, setTargetColumn, setTaskType } = useDataset();
  
  const hasNoMissingValues = overview && 
    (!overview.total_missing_values || overview.total_missing_values === 0);
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    columnsToKeep || 
    (previewColumns && targetColumn 
      ? previewColumns.filter(col => col !== targetColumn)
      : [])
  );
  
  const [featuresAreSaved, setFeaturesAreSaved] = useState<boolean>(!!processingStage && processingStage === 'final');
  
  const [isLoadingTaskType, setIsLoadingTaskType] = useState<boolean>(false);
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null);
  
  useEffect(() => {
    if (columnsToKeep) {
      setSelectedFeatures(columnsToKeep);
    } else if (previewColumns && targetColumn) {
      setSelectedFeatures(previewColumns.filter(col => col !== targetColumn));
    }
  }, [columnsToKeep, previewColumns, targetColumn]);
  
  const handleFeatureToggle = (column: string) => {
    setSelectedFeatures(prev => 
      prev.includes(column)
        ? prev.filter(f => f !== column)
        : [...prev, column]
    );
    setFeaturesAreSaved(false);
  };

  const handleSelectAll = () => {
    if (previewColumns && targetColumn) {
      setSelectedFeatures(previewColumns.filter(col => col !== targetColumn));
    }
    setFeaturesAreSaved(false);
  };

  const handleClearAll = () => {
    setSelectedFeatures([]);
    setFeaturesAreSaved(false);
  };
  
  const getAvailableFeatures = () => {
    if (!previewColumns) return [];
    return targetColumn
      ? previewColumns.filter(col => col !== targetColumn)
      : previewColumns;
  };

  const handleTargetColumnChange = async (value: string) => {
    setTargetColumn(value);
    if (previewColumns) {
      setSelectedFeatures(prev => prev.filter(col => col !== value));
    }
    setFeaturesAreSaved(false);
    setTaskTypeError(null);
    if (datasetId) {
      setIsLoadingTaskType(true);
      try {
        const response = await datasetApi.detectTaskType(datasetId, value);
        
        let detectedTaskType = null;
        
        if (response && typeof response === 'object') {
          if (response.task_type) {
            detectedTaskType = response.task_type;
          } else if (response.data && response.data.task_type) {
            detectedTaskType = response.data.task_type;
          }
        } else if (typeof response === 'string') {
          try {
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.task_type) {
              detectedTaskType = parsedResponse.task_type;
            } else if (parsedResponse.data && parsedResponse.data.task_type) {
              detectedTaskType = parsedResponse.data.task_type;
            }
          } catch (e) {
            detectedTaskType = response.trim();
          }
        }
        
        console.log('Detected task type:', detectedTaskType);
        setTaskType(detectedTaskType);
      } catch (error) {
        console.error('Error detecting task type:', error);
        setTaskTypeError(error instanceof Error ? error.message : 'Failed to detect task type');
      } finally {
        setIsLoadingTaskType(false);
      }
    }
  };

  const handleSaveComplete = () => {
    setFeaturesAreSaved(true);
  };

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
  
  return (
    <>
      <TabsContent value="upload" className="pt-4">
        <FileUpload />
      </TabsContent>
      
      <TabsContent value="explore" className="pt-4">
        <MissingValueHandler />
        <DataPreview />
        <Button onClick={goToNextTab} disabled={!hasNoMissingValues} variant="outline" size="lg" className="border-black text-black hover:bg-black hover:text-white">
          Next: Explore
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </TabsContent>
      
      <TabsContent value="features" className="pt-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Target & Task Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
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
        
        <FeatureSelector 
          selectedFeatures={selectedFeatures}
          availableFeatures={getAvailableFeatures()}
          onFeatureToggle={handleFeatureToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
        
        <FeatureAnalyzer selectedFeatures={selectedFeatures} />
        
        {featureImportance && featureImportance.length > 0 ? (
          <>
            <FeatureImportanceChart featureImportance={featureImportance} />
            
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
        <Button onClick={goToNextTab} disabled={!processingStage || processingStage !== 'final'} variant="outline" size="lg" className="border-black text-black hover:bg-black hover:text-white">
          Train Model
          <PlayCircle className="h-4 w-4 ml-2" />
        </Button>
      </TabsContent>
    </>
  );
};

export default DatasetTabContent;
