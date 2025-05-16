
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  isPercentage?: boolean;
}

interface DynamicMetricsDisplayProps {
  metrics: Record<string, any>;
  taskType: string;
  bestModelDetails?: Record<string, any>;
}

// Helper function for formatting metric values
const formatMetricValue = (value: number | undefined, decimals: number = 3): string => {
  if (value === undefined) return 'N/A';
  return value.toFixed(decimals);
};

// Helper function to format metric names for display
const formatMetricName = (key: string): string => {
  const metricNameMap: Record<string, string> = {
    'auc': 'AUC',
    'logloss': 'Log Loss',
    'aucpr': 'AUC PR',
    'mean_per_class_error': 'Mean Per Class Error',
    'accuracy': 'Accuracy',
    'f1': 'F1 Score',
    'f1_score': 'F1 Score',
    'precision': 'Precision',
    'recall': 'Recall',
    'rmse': 'RMSE',
    'mse': 'MSE',
    'mae': 'MAE',
    'r2': 'R² Score',
    'specificity': 'Specificity',
    'mcc': 'MCC', // Added Matthews Correlation Coefficient
  };

  return metricNameMap[key] || key.replace(/_/g, ' ').split(' ').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Determine which metrics to show based on task type
const getMetricsForTaskType = (
  taskType: string, 
  metrics: Record<string, any>,
  bestModelDetails?: Record<string, any>
): Record<string, number | undefined> => {
  const isClassification = taskType.includes('classification');
  const isBinary = taskType.includes('binary');
  const result: Record<string, number | undefined> = {};
  
  // Combine metrics from both sources, prioritizing bestModelDetails
  const combinedMetrics = { ...metrics };
  if (bestModelDetails) {
    Object.entries(bestModelDetails).forEach(([key, value]) => {
      if (typeof value === 'number') {
        combinedMetrics[key] = value;
      }
    });
  }
  
  if (isClassification) {
    // Classification metrics
    result.auc = combinedMetrics.auc;
    result.logloss = combinedMetrics.logloss;
    result.accuracy = combinedMetrics.accuracy;
    result.aucpr = combinedMetrics.aucpr;
    result.mean_per_class_error = combinedMetrics.mean_per_class_error;
    result.rmse = combinedMetrics.rmse;
    result.mse = combinedMetrics.mse;
    
    // Add F1, precision, recall if available
    if (combinedMetrics.f1_score !== undefined || combinedMetrics.f1 !== undefined) {
      result.f1_score = combinedMetrics.f1_score !== undefined ? combinedMetrics.f1_score : combinedMetrics.f1;
    }
    if (combinedMetrics.precision !== undefined) result.precision = combinedMetrics.precision;
    if (combinedMetrics.recall !== undefined) result.recall = combinedMetrics.recall;
    
    // Add specificity for binary classification
    if (isBinary && combinedMetrics.specificity !== undefined) {
      result.specificity = combinedMetrics.specificity;
    }
    
    // Add MCC for binary classification if available
    if (isBinary && combinedMetrics.mcc !== undefined) {
      result.mcc = combinedMetrics.mcc;
    }
  } else {
    // Regression metrics
    result.mae = combinedMetrics.mae;
    result.rmse = combinedMetrics.rmse;
    result.mse = combinedMetrics.mse;
    result.r2 = combinedMetrics.r2;
  }
  
  return result;
};

// Helper function to determine if a metric should be displayed as a percentage
const isPercentageMetric = (metricName: string): boolean => {
  return ['accuracy', 'f1', 'f1_score', 'precision', 'recall', 'auc', 'aucpr', 'specificity'].includes(metricName.toLowerCase());
};

// Component to display a confusion matrix
interface ConfusionMatrixProps {
  confusionMatrix?: number[][];
  labels?: string[];
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ confusionMatrix, labels }) => {
  if (!confusionMatrix || confusionMatrix.length === 0) return null;
  
  // Generate default labels if not provided
  const matrixLabels = labels || Array.from({ length: confusionMatrix.length }, (_, i) => `Class ${i}`);
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Confusion Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Actual / Predicted</TableHead>
                {matrixLabels.map((label, idx) => (
                  <TableHead key={idx}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {confusionMatrix.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  <TableCell className="font-medium">{matrixLabels[rowIdx]}</TableCell>
                  {row.map((cell, cellIdx) => (
                    <TableCell 
                      key={cellIdx} 
                      className={rowIdx === cellIdx ? "font-bold bg-primary/10" : ""}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, isPercentage = false }) => {
  // Format the display value
  let displayValue = typeof value === 'number' 
    ? isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4)
    : value;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          {title}
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-1">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {displayValue}
        </div>
      </CardContent>
    </Card>
  );
};

const DynamicMetricsDisplay: React.FC<DynamicMetricsDisplayProps> = ({ 
  metrics, 
  taskType,
  bestModelDetails 
}) => {
  const isClassification = taskType.includes('classification');
  const taskSpecificMetrics = getMetricsForTaskType(taskType, metrics, bestModelDetails);
  
  // Get confusion matrix if available
  const confusionMatrix = metrics.confusion_matrix || bestModelDetails?.confusion_matrix;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(taskSpecificMetrics).map(([key, value]) => {
          if (value === undefined) return null;
          
          // Get description and percentage formatting
          const isPercent = isPercentageMetric(key);
          
          return (
            <MetricCard
              key={key}
              title={formatMetricName(key)}
              value={value}
              isPercentage={isPercent}
            />
          );
        })}
      </div>
      
      {isClassification && confusionMatrix && (
        <ConfusionMatrix 
          confusionMatrix={confusionMatrix} 
          labels={metrics.class_labels || bestModelDetails?.class_labels}
        />
      )}
    </div>
  );
};

export default DynamicMetricsDisplay;
