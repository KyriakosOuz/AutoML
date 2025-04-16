
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
import { 
  AlertCircle, 
  BarChart3, 
  HelpCircle,
  Save
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle target column change and detect task type
  const handleTargetColumnChange = async (value: string) => {
    if (!value) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Set the target column immediately to update UI
      setTargetColumn(value);
      
      // Reset feature importance when target column changes
      setFeatureImportance(null);
      
      // Call the API to detect task type
      const response = await datasetApi.detectTaskType(datasetId || '', value);
      setTaskType(response.task_type);
      
      // Use all non-target columns as default selected columns
      if (previewColumns) {
        const defaultColumns = previewColumns.filter(col => col !== value);
        setColumnsToKeep(defaultColumns);
      }
      
      toast({
        title: "Task type detected",
        description: `Detected task type: ${response.task_type.replace('_', ' ')}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error detecting task type:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect task type');
      setTargetColumn(null); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFeatures = async () => {
    if (!datasetId || !targetColumn) {
      setError('Dataset ID and target column are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.featureImportancePreview(datasetId, targetColumn);
      
      setFeatureImportance(response.feature_importance);
      if (!taskType) {
        setTaskType(response.task_type);
      }
      
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
    if (!datasetId || !targetColumn || !columnsToKeep) {
      setError('Dataset ID, target column, and features are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.saveDataset(
        datasetId, 
        targetColumn,
        columnsToKeep
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
              value={targetColumn || ''}
              onValueChange={handleTargetColumnChange}
              disabled={isLoading}
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
            
            {targetColumn && taskType && (
              <div className="mt-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-purple-800">Detected Task Type</h4>
                    <Badge className="capitalize bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">
                      {taskType ? taskType.replace(/_/g, ' ') : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    {taskType === 'regression' && 'Predicting a continuous numerical value'}
                    {taskType === 'binary_classification' && 'Predicting between two classes'}
                    {taskType === 'multiclass_classification' && 'Predicting between multiple classes'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Analyze Feature Importance */}
          {targetColumn && taskType && (
            <div className="mt-4 flex justify-center">
              {!featureImportance ? (
                <Button 
                  onClick={analyzeFeatures} 
                  disabled={isLoading || !targetColumn}
                  variant="default"
                  size="lg"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isLoading ? 'Analyzing...' : 'Analyze Feature Importance'}
                </Button>
              ) : null}
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
              <h3 className="font-medium mb-3">Step 2: Feature Importance Analysis</h3>
              
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
