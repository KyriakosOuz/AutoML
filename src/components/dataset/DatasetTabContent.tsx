
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, BarChart3, Info } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
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
import { datasetApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const { 
    featureImportance, 
    overview, 
    previewColumns, 
    setTargetColumn, 
    setTaskType, 
    updateState 
  } = useDataset();
  
  const { toast } = useToast();
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    columnsToKeep || 
    (previewColumns && targetColumn 
      ? previewColumns.filter(col => col !== targetColumn)
      : [])
  );
  
  const [featuresAreSaved, setFeaturesAreSaved] = useState<boolean>(
    !!processingStage && processingStage === 'final'
  );
  
  const [isAnalyzingFeatures, setIsAnalyzingFeatures] = useState(false);
  const [taskTypeError, setTaskTypeError] = useState<string | null>(null);
  const [isLoadingTaskType, setIsLoadingTaskType] = useState<boolean>(false);

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
        
        if (response && typeof response === 'object' && response.task_type) {
          detectedTaskType = response.task_type;
        } else if (response && typeof response === 'object' && response.data && response.data.task_type) {
          detectedTaskType = response.data.task_type;
        } else if (typeof response === 'string') {
          detectedTaskType = response.trim();
        }
        
        const validTaskTypes = ['binary_classification', 'multiclass_classification', 'regression'];
        if (detectedTaskType && validTaskTypes.includes(detectedTaskType)) {
          console.log('Detected task type:', detectedTaskType);
          setTaskType(detectedTaskType);
        } else {
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
        <FileUpload onUploadSuccess={goToNextTab} />
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
        <MissingValueHandler onComplete={goToNextTab} />
        <DataPreview />
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
        
        <div className="flex justify-center mt-6 mb-6">
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

const hasNoMissingValues = (overview: any) => {
  return overview && 
    (!overview.total_missing_values || overview.total_missing_values === 0);
};

export default DatasetTabContent;
