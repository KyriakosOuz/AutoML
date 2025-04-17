
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
  LabelList,
  Tooltip as RechartsTooltip,
  Legend
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
  const [isAnalyzingFeatures, setIsAnalyzingFeatures] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(targetColumn);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(columnsToKeep || []);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  // Removed rawTaskTypeData state since we're not displaying it anymore
  
  // Format task type for better display
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
    console.log("Extracting task type from:", response);
    
    if (!response) return null;
    
    // Handle string response
    if (typeof response === 'string') {
      // Check if the string contains "classification" or "regression"
      const lcResponse = response.toLowerCase();
      if (lcResponse.includes('classification')) {
        return 'classification';
      } else if (lcResponse.includes('regression')) {
        return 'regression';
      }
      return response.trim().toLowerCase();
    }
    
    // Handle object response
    if (typeof response === 'object') {
      // Try to find task_type in the response object
      if (response.task_type) {
        const taskTypeStr = response.task_type.toString().toLowerCase();
        if (taskTypeStr.includes('classification')) {
          return 'classification';
        } else if (taskTypeStr.includes('regression')) {
          return 'regression';
        }
        return taskTypeStr;
      }
      
      // Try to determine based on Data field with Task Type
      if (response.Data && typeof response.Data === 'object') {
        const dataObj = response.Data;
        if (dataObj['Task Type'] && typeof dataObj['Task Type'] === 'string') {
          const typeStr = dataObj['Task Type'].toLowerCase();
          if (typeStr.includes('classification')) {
            return 'classification';
          } else if (typeStr.includes('regression')) {
            return 'regression';
          }
          return typeStr;
        }
      }
      
      // Check if the response itself contains the key terms
      const jsonStr = JSON.stringify(response).toLowerCase();
      if (jsonStr.includes('classification')) {
        return 'classification';
      } else if (jsonStr.includes('regression')) {
        return 'regression';
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
        setSelectedFeatures(defaultColumns);
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
    if (!datasetId || !targetColumn) {
      setError('Dataset ID and target column are required');
      return;
    }
    
    if (selectedFeatures.length === 0) {
      setError('Please select at least one feature to analyze');
      return;
    }

    try {
      setIsLoading(true);
      setIsAnalyzingFeatures(true);
      setError(null);
      
      console.log('Analyzing features for dataset:', datasetId);
      console.log('Target column:', targetColumn);
      console.log('Selected features:', selectedFeatures);
      
      // Call the API with the selected features and target column
      const response = await datasetApi.featureImportancePreview(
        datasetId, 
        targetColumn
      );
      
      console.log('Feature importance response:', response);
      
      // Extract feature importance data from response
      const importanceData = response.feature_importance || [];
      
      if (!importanceData || importanceData.length === 0) {
        throw new Error('No feature importance data returned from API');
      }
      
      // Filter feature importance data to show only selected features
      const filteredImportance = importanceData.filter(
        (item: any) => selectedFeatures.includes(item.feature)
      );
      
      // Sort by importance in descending order
      const sortedImportance = [...filteredImportance].sort(
        (a: any, b: any) => b.importance - a.importance
      );
      
      console.log('Processed importance data:', sortedImportance);
      
      // Update context with the sorted and filtered data
      updateState({
        featureImportance: sortedImportance,
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
      setIsAnalyzingFeatures(false);
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
      
      // Save the selected features
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
  const getBarColor = (importance: number, index: number) => {
    const baseColors = [
      '#8B5CF6', // Purple
      '#6366F1', // Indigo
      '#3B82F6', // Blue
      '#0EA5E9', // Light blue
      '#14B8A6', // Teal
    ];
    
    // Use the index to get different colors for different features
    const baseColor = baseColors[index % baseColors.length];
    
    // Adjust opacity based on importance
    const opacity = 0.3 + (importance * 0.7);
    
    // Convert hex to rgba
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium text-sm">{payload[0].payload.feature}</p>
          <p className="text-purple-600 font-mono">
            {(payload[0].value * 100).toFixed(2)}% importance
          </p>
        </div>
      );
    }
    return null;
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
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-purple-800">Detected Task Type</h4>
                    <Badge className="capitalize w-fit bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">
                      {formatTaskType(taskType)}
                    </Badge>
                    
                    {/* Removed API Response display */}
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
                  disabled={isLoading || !targetColumn || selectedFeatures.length === 0 || isAnalyzingFeatures}
                  variant="default"
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isAnalyzingFeatures ? 'Analyzing...' : 'Analyze Feature Importance'}
                </Button>
              </div>
            </div>
          )}

          {/* Feature importance chart */}
          {isLoading && isAnalyzingFeatures ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[350px] w-full rounded-lg" />
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
              
              <div className="h-[400px] w-full bg-white rounded-lg p-4 border border-gray-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureImportance}
                    layout="vertical"
                    margin={{ top: 20, right: 50, left: 140, bottom: 20 }}
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
                      width={130}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="importance" 
                      name="Importance Score"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    >
                      {featureImportance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getBarColor(entry.importance, index)} 
                        />
                      ))}
                      <LabelList 
                        dataKey="importance" 
                        position="right" 
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        style={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
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
            className="bg-purple-600 hover:bg-purple-700"
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
