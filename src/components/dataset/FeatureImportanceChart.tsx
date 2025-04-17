
import React, { useState, useEffect } from 'react';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  AlertCircle, 
  BarChart3, 
  HelpCircle,
  Save,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts';

const FeatureImportanceChart: React.FC = () => {
  const { 
    datasetId, 
    previewColumns, 
    targetColumn, 
    setTargetColumn,
    setFeatureImportance,
    featureImportance,
    setTaskType,
    taskType,
    setColumnsToKeep,
    columnsToKeep,
    updateState
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingTaskType, setIsDetectingTaskType] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(targetColumn);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(columnsToKeep || []);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  
  // Format task type for display
  const formatTaskType = (type: string | null): string => {
    if (!type) return '';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Update available features when target column changes
  useEffect(() => {
    if (previewColumns && selectedTarget) {
      setAvailableFeatures(previewColumns.filter(col => col !== selectedTarget));
    } else {
      setAvailableFeatures([]);
    }
  }, [previewColumns, selectedTarget]);

  // Extract clean task type from response
  const extractTaskType = (response: any): string | null => {
    if (!response) return null;
    
    // If it's a string, just return it
    if (typeof response === 'string') {
      return response.trim().toLowerCase();
    }
    
    // If it's an object, try to extract task_type
    if (typeof response === 'object') {
      // Check for common response patterns
      if (response.task_type) {
        return response.task_type.toString().toLowerCase();
      }
      
      if (response.type) {
        return response.type.toString().toLowerCase();
      }
      
      // Check if the data object contains the task type
      if (response.data && response.data['task Type']) {
        return response.data['task Type'].toString().toLowerCase().replace(' ', '_');
      }
    }
    
    return null;
  };

  // Handle target column change and detect task type
  const handleTargetColumnChange = async (value: string) => {
    if (!value || !datasetId) return;
    
    try {
      // Update local state first for UI responsiveness
      setSelectedTarget(value);
      setIsDetectingTaskType(true);
      setError(null);
      setSelectedFeatures([]);
      
      console.log(`Detecting task type for dataset ${datasetId} with target column ${value}`);
      
      // Call the API to detect task type
      const response = await datasetApi.detectTaskType(datasetId, value);
      
      console.log('🔍 Full task type detection response:', response);
      
      // Extract clean task type
      const detectedTaskType = extractTaskType(response);
      
      // Check if we have a valid task type
      if (!detectedTaskType) {
        console.error('❌ Could not extract task type from response:', response);
        throw new Error('Could not determine task type from API response');
      }
      
      console.log(`✅ Successfully determined task type: ${detectedTaskType}`);
      
      // Only update the main context after API call completes
      const updatedState: {
        targetColumn: string;
        taskType: string;
        columnsToKeep?: string[];
      } = {
        targetColumn: value,
        taskType: detectedTaskType,
      };
      
      // Use all non-target columns as default selected columns
      if (previewColumns) {
        const defaultColumns = previewColumns.filter(col => col !== value);
        updatedState.columnsToKeep = defaultColumns;
      }
      
      // Apply all updates together
      updateState(updatedState);
      
      // Reset feature importance when target column changes
      setFeatureImportance(null);
      
      toast({
        title: "Task type detected",
        description: `Detected task type: ${formatTaskType(detectedTaskType)}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('❌ Error detecting task type:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect task type');
      setSelectedTarget(targetColumn); // Reset on error
    } finally {
      setIsDetectingTaskType(false);
    }
  };

  const toggleFeature = (column: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      } else {
        return [...prev, column];
      }
    });
  };

  const analyzeFeatures = async () => {
    if (!datasetId || !targetColumn || selectedFeatures.length === 0) {
      setError('Dataset ID, target column, and at least one feature are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Only send the selected features for analysis
      const response = await datasetApi.featureImportancePreview(
        datasetId, 
        targetColumn
      );
      
      // Use updateState to batch update context
      updateState({
        featureImportance: response.feature_importance,
        taskType: response.task_type || taskType,
        columnsToKeep: selectedFeatures // Save the selected features
      });
      
      toast({
        title: "Feature importance analyzed",
        description: "Feature importance analysis completed successfully",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error analyzing features:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze features');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDataset = async () => {
    if (!datasetId || !targetColumn || !selectedFeatures.length) {
      setError('Dataset ID, target column, and features are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Save only the selected features
      const response = await datasetApi.saveDataset(
        datasetId, 
        targetColumn,
        selectedFeatures
      );
      
      // Update context with response data
      updateState({
        datasetId: response.dataset_id,
        fileUrl: response.file_url,
        columnsToKeep: response.columns_to_keep,
        targetColumn: response.target_column,
        overview: response.overview,
        processingStage: 'final'
      });
      
      toast({
        title: "Features saved",
        description: "Selected features have been saved successfully.",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error saving dataset:', error);
      setError(error instanceof Error ? error.message : 'Failed to save dataset');
    } finally {
      setIsLoading(false);
    }
  };

  // Set colors for feature bars based on importance
  const getBarColor = (importance: number) => {
    if (importance > 0.5) return '#8B5CF6'; // High importance - purple
    if (importance > 0.2) return '#A78BFA'; // Medium importance - lighter purple
    return '#C4B5FD'; // Low importance - lightest purple
  };

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
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="font-medium mb-3">Step 1: Select Target Column</h3>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Target Column</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                      <HelpCircle className="h-3 w-3" />
                      <span className="sr-only">Help</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      This is the variable you want to predict. Selecting a target will
                      automatically detect the task type (regression or classification).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={selectedTarget || ''}
              onValueChange={handleTargetColumnChange}
              disabled={isDetectingTaskType || isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {previewColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isDetectingTaskType && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-purple-700">
                  <Skeleton className="h-4 w-4 rounded-full animate-pulse bg-purple-200" />
                  <span className="text-sm">Detecting task type...</span>
                </div>
              </div>
            )}
            
            {selectedTarget && taskType && !isDetectingTaskType && (
              <div className="mt-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-purple-800">Detected Task Type</h4>
                    <Badge className="capitalize bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">
                      {formatTaskType(taskType)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Feature Selection - Only show after target column is selected */}
          {selectedTarget && taskType && !isDetectingTaskType && availableFeatures.length > 0 && (
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
                      onCheckedChange={() => toggleFeature(column)}
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
                    onClick={() => setSelectedFeatures(availableFeatures)}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedFeatures([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={analyzeFeatures} 
                  disabled={isLoading || !targetColumn || selectedFeatures.length === 0}
                  variant="default"
                  size="lg"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isLoading ? 'Analyzing...' : 'Analyze Feature Importance'}
                </Button>
              </div>
            </div>
          )}

          {/* Feature importance chart */}
          {isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : featureImportance && featureImportance.length > 0 ? (
            <div className="space-y-3 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="font-medium mb-3">Step 3: Feature Importance Analysis</h3>
              
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Feature Importance</h4>
                <p className="text-xs text-gray-500">
                  Higher values indicate more important features
                </p>
              </div>
              
              <div className="h-[350px] w-full bg-white rounded-lg p-4 border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureImportance}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 1]} 
                      tickFormatter={(value) => `${Math.round(value * 100)}%`} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="feature" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Bar 
                      dataKey="importance" 
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {featureImportance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.importance)} />
                      ))}
                      <LabelList 
                        dataKey="importance" 
                        position="right" 
                        formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                        style={{ fill: '#666', fontSize: 12, fontWeight: 500 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      
      {targetColumn && featureImportance && featureImportance.length > 0 && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 gap-2 flex justify-end">
          <Button 
            onClick={saveDataset} 
            disabled={isLoading || !targetColumn}
            variant="default"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FeatureImportanceChart;
