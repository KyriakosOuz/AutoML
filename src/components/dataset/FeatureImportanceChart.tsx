
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
  ChevronRight, 
  ListFilter 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
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
    columnsToKeep
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columnsToKeep || 
    (previewColumns?.filter(col => col !== targetColumn) || [])
  );

  const handleTargetColumnChange = async (value: string) => {
    if (!value) return;
    
    setTargetColumn(value);
    // Reset feature importance when target column changes
    setFeatureImportance(null);
    
    // Update selected columns to exclude the new target
    setSelectedColumns(prev => prev.filter(col => col !== value));
    
    // Call the API to detect task type
    try {
      await detectTaskType(value);
    } catch (err) {
      console.error('Error detecting task type:', err);
    }
  };
  
  const detectTaskType = async (selectedTarget: string) => {
    if (!datasetId || !selectedTarget) {
      setError('Dataset ID and target column are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.detectTaskType(datasetId, selectedTarget);
      setTaskType(response.task_type);
      
      toast({
        title: "Task type detected",
        description: `Detected task type: ${response.task_type.replace('_', ' ')}`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error detecting task type:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect task type');
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!previewColumns || !targetColumn) return;
    setSelectedColumns(previewColumns.filter(col => col !== targetColumn));
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

  const saveFeatures = () => {
    if (selectedColumns.length === 0) {
      setError('Select at least one feature column');
      return;
    }
    
    setColumnsToKeep(selectedColumns);
    toast({
      title: "Features selected",
      description: `${selectedColumns.length} features selected for analysis`,
      duration: 3000
    });
  };

  const analyzeFeatures = async () => {
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

  // Set colors for feature bars based on importance
  const getBarColor = (importance: number) => {
    if (importance > 0.5) return '#8B5CF6'; // High importance - purple
    if (importance > 0.2) return '#A78BFA'; // Medium importance - lighter purple
    return '#C4B5FD'; // Low importance - lightest purple
  };

  if (!datasetId || !previewColumns) {
    return null;
  }

  const availableFeatures = previewColumns.filter(col => col !== targetColumn);

  return (
    <Card className="w-full mt-6 overflow-hidden border border-gray-100 shadow-md rounded-xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <BarChart3 className="h-5 w-5" />
          Target Selection & Feature Analysis
        </CardTitle>
        <CardDescription>
          Select your target variable, choose features, and analyze feature importance
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
          <div className="grid gap-4 md:grid-cols-2">
            <div>
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
            </div>
            
            {targetColumn && taskType && (
              <div className="flex items-center">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg w-full">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-purple-800">Detected Task Type</h4>
                    <Badge className="capitalize bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300">
                      {taskType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-purple-700">
                    {taskType === 'regression' && 'Predicting a continuous numerical value'}
                    {taskType === 'binary_classification' && 'Predicting between two classes'}
                    {taskType === 'multiclass_classification' && 'Predicting between multiple classes'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {targetColumn && (
            <div className="space-y-3 mt-6 border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  Select Features
                </h4>
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
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
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
              
              <div className="text-sm text-gray-500 mt-2">
                <p>Selected {selectedColumns.length} of {availableFeatures.length} features</p>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button 
                  onClick={saveFeatures}
                  size="sm"
                  variant="outline"
                  disabled={selectedColumns.length === 0 || isLoading}
                >
                  Save Feature Selection
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : featureImportance && featureImportance.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Feature Importance</h4>
                <p className="text-xs text-gray-500">
                  Higher values indicate more important features
                </p>
              </div>
              
              <div className="h-[350px] w-full bg-gray-50 rounded-lg p-4">
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
                    <ChartTooltip
                      cursor={{ fill: 'rgba(180, 180, 180, 0.1)' }}
                      content={
                        <ChartTooltipContent
                          formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Importance']}
                        />
                      }
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
          ) : targetColumn && columnsToKeep && columnsToKeep.length > 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p>Click "Analyze Feature Importance" to see which features are most important for predicting {targetColumn}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
      {targetColumn && columnsToKeep && columnsToKeep.length > 0 && !featureImportance && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 gap-2 flex justify-end">
          <Button 
            onClick={analyzeFeatures} 
            disabled={isLoading || !targetColumn || selectedColumns.length === 0}
            variant="default"
            size="lg"
            className="mt-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Analyze Feature Importance'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FeatureImportanceChart;
