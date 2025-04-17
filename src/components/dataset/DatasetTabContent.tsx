import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Info, AlertCircle, BarChart, Sparkles, Filter } from 'lucide-react';
import FileUpload from '@/components/dataset/FileUpload';
import DataPreview from '@/components/dataset/DataPreview';
import MissingValueHandler from '@/components/dataset/MissingValueHandler';
import FeatureImportanceChart from '@/components/dataset/feature-importance/FeatureImportanceChart';
import FeatureSelector from '@/components/dataset/feature-importance/FeatureSelector';
import SaveDatasetButton from '@/components/dataset/feature-importance/SaveDatasetButton';
import PreprocessingOptions from '@/components/dataset/PreprocessingOptions';
import { TabsContent } from '@/components/ui/tabs';
import { useDataset } from '@/contexts/DatasetContext';
import { useState, useEffect } from 'react';
import { datasetApi } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface TabContentProps {
  activeTab: string;
  datasetId: string | null;
  targetColumn: string | null;
  taskType: string | null;
  processingStage: string | null;
  columnsToKeep: string[] | null;
  goToNextTab: () => void;
}

const DatasetTabContent: React.FC<TabContentProps> = ({
  activeTab,
  datasetId,
  targetColumn,
  taskType,
  processingStage,
  columnsToKeep,
  goToNextTab,
}) => {
  const { 
    featureImportance, 
    overview, 
    previewColumns, 
    setTargetColumn, 
    setTaskType, 
    setFeatureImportance,
    updateState 
  } = useDataset();
  
  const { toast } = useToast();
  
  const hasNoMissingValues = overview && 
    (!overview.total_missing_values || overview.total_missing_values === 0);
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    columnsToKeep || 
    (previewColumns && targetColumn 
      ? previewColumns.filter(col => col !== targetColumn)
      : [])
  );
  
  const [featuresAreSaved, setFeaturesAreSaved] = useState<boolean>(!!processingStage && processingStage === 'final');
  
  const [isAnalyzingFeatures, setIsAnalyzingFeatures] = useState<boolean>(false);
  const [featureError, setFeatureError] = useState<string | null>(null);
  
  useEffect(() => {
    if (columnsToKeep) {
      setSelectedFeatures(columnsToKeep);
    } else if (previewColumns && targetColumn) {
      setSelectedFeatures(previewColumns.filter(col => col !== targetColumn));
    }
  }, [columnsToKeep, previewColumns, targetColumn]);
  
  const analyzeFeatures = async () => {
    if (!datasetId || !targetColumn) {
      setFeatureError('Dataset ID and target column are required');
      return;
    }

    if (selectedFeatures.length === 0) {
      setFeatureError('Please select at least one feature to analyze');
      return;
    }

    try {
      setIsAnalyzingFeatures(true);
      setFeatureError(null);

      const taskTypeResponse = await datasetApi.detectTaskType(datasetId, targetColumn);
      
      if (taskTypeResponse.task_type) {
        setTaskType(taskTypeResponse.task_type);
      } else {
        throw new Error("Could not determine task type");
      }
      
      const response = await datasetApi.featureImportancePreview(datasetId, targetColumn);

      const importanceData = response?.data?.feature_importance || [];

      if (!importanceData.length) {
        throw new Error('No feature importance data returned from API');
      }

      const filtered = importanceData.filter((f: any) => selectedFeatures.includes(f.feature));
      const sorted = filtered.sort((a: any, b: any) => b.importance - a.importance);

      setFeatureImportance(sorted);

      toast({
        title: "Success",
        description: "Feature importance calculated successfully",
      });
    } catch (err) {
      console.error('Error analyzing features:', err);
      setFeatureError(err instanceof Error ? err.message : 'Failed to analyze features');
      toast({
        title: "Error analyzing features",
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
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
  };

  const handleSaveComplete = () => {
    setFeaturesAreSaved(true);
  };

  const formatTaskType = (type: string | null): string => {
    if (!type) return "Unknown";
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
  
  const isPreprocessTabReady = datasetId && targetColumn && taskType && columnsToKeep && columnsToKeep.length > 0;

  const navigateToUploadTab = () => {
    const tabTrigger = document.querySelector('[data-value="upload"]');
    if (tabTrigger && tabTrigger instanceof HTMLElement) {
      tabTrigger.click();
    }
  };

  const navigateToFeaturesTab = () => {
    const tabTrigger = document.querySelector('[data-value="features"]');
    if (tabTrigger && tabTrigger instanceof HTMLElement) {
      tabTrigger.click();
    }
  };

  const navigateToExploreTab = () => {
    const tabTrigger = document.querySelector('[data-value="explore"]');
    if (tabTrigger && tabTrigger instanceof HTMLElement) {
      tabTrigger.click();
    }
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
        {(processingStage === 'cleaned' || (datasetId && hasNoMissingValues)) && (
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
            <CardTitle>Target Selection</CardTitle>
            <CardDescription>
              Select the column you want to predict, then analyze feature importance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              
              {featureError && (
                <Alert variant="destructive" className="mb-4 w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{featureError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        <FeatureSelector 
          selectedFeatures={selectedFeatures}
          availableFeatures={getAvailableFeatures()}
          onFeatureToggle={handleFeatureToggle}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onAnalyzeFeatures={analyzeFeatures}
          isAnalyzing={isAnalyzingFeatures}
        />
        
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
              <p className="text-sm text-gray-500">Select features above and click "Analyze Importance" to view this chart.</p>
            ) : (
              <p className="text-sm text-gray-500">Select a target column first, then analyze feature importance.</p>
            )}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="preprocess" className="pt-4">
        {isPreprocessTabReady ? (
          <>
            <Card className="w-full mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Data Preprocessing
                </CardTitle>
                <CardDescription>
                  Apply transformations to prepare your data for machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Alert className="bg-blue-50 border-blue-200 mb-4">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-700">Preprocessing Information</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      <p className="mb-2">You are about to prepare your data for machine learning training with:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Target column: <Badge className="ml-1 bg-primary/20 text-primary">{targetColumn}</Badge></li>
                        <li>Task type: <Badge className="ml-1 bg-primary/20 text-primary">{formatTaskType(taskType)}</Badge></li>
                        <li>Selected features: <Badge className="ml-1 bg-primary/20 text-primary">{columnsToKeep?.length || 0}</Badge></li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 text-sm">
                      <p>Preprocessing helps improve model performance by:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Scaling numerical features to similar ranges</li>
                        <li>Balancing classes for better classification</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <PreprocessingOptions />
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Preview</CardTitle>
                  <CardDescription>
                    View your dataset with selected features for training
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataPreview />
                </CardContent>
              </Card>
            </div>

            {processingStage === 'processed' && (
              <div className="flex justify-end mt-8">
                <Link to="/training">
                  <Button size="lg" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                    <PlayCircle className="h-5 w-5" />
                    Continue to Training
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Preprocessing</CardTitle>
              <CardDescription>
                Complete previous steps to access preprocessing options
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {!datasetId ? (
                <div className="text-center space-y-4">
                  <Filter className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-medium">No Dataset Uploaded</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Please upload a dataset in the "Upload" tab before proceeding to preprocessing.
                  </p>
                  <Button variant="outline" onClick={navigateToUploadTab}>
                    Go to Upload Tab
                  </Button>
                </div>
              ) : !targetColumn || !taskType ? (
                <div className="text-center space-y-4">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-medium">Target Column Not Selected</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Please select a target column and analyze feature importance in the "Features" tab.
                  </p>
                  <Button variant="outline" onClick={navigateToFeaturesTab}>
                    Go to Features Tab
                  </Button>
                </div>
              ) : !columnsToKeep || columnsToKeep.length === 0 ? (
                <div className="text-center space-y-4">
                  <Filter className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="text-lg font-medium">Features Not Selected</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Please select and save features in the "Features" tab before proceeding to preprocessing.
                  </p>
                  <Button variant="outline" onClick={navigateToFeaturesTab}>
                    Go to Features Tab
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-6 w-48 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                  <Skeleton className="h-10 w-32 mx-auto" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </>
  );
};

export default DatasetTabContent;
