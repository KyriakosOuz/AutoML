
import React, { useState } from 'react';
import { useDataset } from '@/contexts/DatasetContext';
import { datasetApi } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, HelpCircle } from 'lucide-react';
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
    taskType
  } = useDataset();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTargetColumnChange = async (value: string) => {
    setTargetColumn(value);
    // Reset feature importance when target column changes
    setFeatureImportance(null);
    setTaskType(null);
    
    // Automatically analyze features when target column is selected
    if (value) {
      await analyzeFeatures(value);
    }
  };

  const analyzeFeatures = async (selectedTarget: string) => {
    if (!datasetId || !selectedTarget) {
      setError('Dataset ID and target column are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.featureImportancePreview(datasetId, selectedTarget);
      
      setFeatureImportance(response.feature_importance);
      setTaskType(response.task_type);
      
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
                        automatically analyze the importance of other features.
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
            
            {taskType && (
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
          ) : targetColumn ? (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p>Select a target column to analyze feature importance</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportanceChart;
