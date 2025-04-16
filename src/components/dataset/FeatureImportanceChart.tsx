
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
import { AlertCircle, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

  const handleTargetColumnChange = (value: string) => {
    setTargetColumn(value);
    // Reset feature importance when target column changes
    setFeatureImportance(null);
    setTaskType(null);
  };

  const handleAnalyzeFeatures = async () => {
    if (!datasetId || !targetColumn) {
      setError('Dataset ID and target column are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await datasetApi.featureImportancePreview(datasetId, targetColumn);
      
      setFeatureImportance(response.feature_importance);
      setTaskType(response.task_type);
      
    } catch (error) {
      console.error('Error analyzing features:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze features');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const chartData = featureImportance ? {
    labels: featureImportance.map(item => item.feature),
    datasets: [
      {
        label: 'Feature Importance',
        data: featureImportance.map(item => item.importance),
        backgroundColor: 'rgba(79, 70, 229, 0.7)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  // Chart options
  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Importance: ${(context.raw * 100).toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: Math.min(1, Math.max(...(featureImportance?.map(item => item.importance) || [0])) * 1.1),
        ticks: {
          callback: function(value: any) {
            return `${(value * 100).toFixed(0)}%`;
          }
        }
      }
    },
  };

  if (!datasetId || !previewColumns) {
    return null;
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Feature Importance</CardTitle>
        <CardDescription>
          Analyze the importance of features for predicting your target variable
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target Column</label>
            <Select
              value={targetColumn || ''}
              onValueChange={handleTargetColumnChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full mt-1">
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
            <p className="text-xs text-gray-500 mt-1">
              This is the variable you want to predict
            </p>
          </div>

          <Button 
            onClick={handleAnalyzeFeatures} 
            disabled={isLoading || !targetColumn}
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {isLoading ? 'Analyzing...' : 'Analyze Features'}
          </Button>

          {taskType && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-4">
              <h4 className="font-medium text-blue-800">
                Task Type: <span className="capitalize">{taskType.replace('_', ' ')}</span>
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {taskType === 'regression' && 'Predicting a continuous numerical value'}
                {taskType === 'binary_classification' && 'Predicting between two classes'}
                {taskType === 'multiclass_classification' && 'Predicting between multiple classes'}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : featureImportance && featureImportance.length > 0 ? (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Feature Importance</h4>
              <div className="h-[300px]">
                <Bar data={chartData!} options={chartOptions} />
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureImportanceChart;
