import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PerClassMetric } from '@/types/training';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  isPercentage?: boolean;
  isMain?: boolean; // New prop to highlight main metric
}

interface DynamicMetricsDisplayProps {
  metrics: Record<string, any>;
  taskType: string;
  bestModelDetails?: Record<string, any>;
  mainMetric?: string; // New prop to specify the main metric
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
    'f1-score': 'F1 Score',
    'precision': 'Precision',
    'recall': 'Recall',
    'rmse': 'RMSE',
    'mse': 'MSE',
    'mae': 'MAE',
    'r2': 'R² Score',
    'specificity': 'Specificity',
    'mcc': 'MCC',
  };

  return metricNameMap[key] || key.replace(/_/g, ' ').split(' ').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Determine which metrics to show based on task type
const getMetricsForTaskType = (
  taskType: string, 
  metrics: Record<string, any>,
  bestModelDetails?: Record<string, any>,
  mainMetric?: string
): Record<string, number | undefined> => {
  const isClassification = taskType.includes('classification');
  const isBinary = taskType.includes('binary');
  const isMulticlass = taskType.includes('multiclass');
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
    if (isMulticlass) {
      // For multiclass classification, always include the main metric (logloss) if available
      if (mainMetric && combinedMetrics[mainMetric] !== undefined) {
        result[mainMetric] = combinedMetrics[mainMetric];
      }
      
      // Add H2O multiclass specific metrics
      if (combinedMetrics.mean_per_class_error !== undefined) result.mean_per_class_error = combinedMetrics.mean_per_class_error;
      if (combinedMetrics.logloss !== undefined) result.logloss = combinedMetrics.logloss;
      if (combinedMetrics.rmse !== undefined) result.rmse = combinedMetrics.rmse;
      if (combinedMetrics.mse !== undefined) result.mse = combinedMetrics.mse;
      
      // Also include these standard metrics
      if (combinedMetrics.accuracy !== undefined) result.accuracy = combinedMetrics.accuracy;
      if (combinedMetrics.precision !== undefined) result.precision = combinedMetrics.precision;
      if (combinedMetrics.recall !== undefined) result.recall = combinedMetrics.recall;
      
      // Also include F1 score if we need to show it later
      if (combinedMetrics['f1-score'] !== undefined) {
        result['f1-score'] = combinedMetrics['f1-score'];
      } else if (combinedMetrics.f1_score !== undefined) {
        result.f1_score = combinedMetrics.f1_score;
      } else if (combinedMetrics.f1 !== undefined) {
        result.f1 = combinedMetrics.f1;
      }
    } else if (isBinary) {
      // For binary classification, show only these four metrics
      result.accuracy = combinedMetrics.accuracy;
      
      // Add F1 score if available
      if (combinedMetrics.f1_score !== undefined || combinedMetrics.f1 !== undefined || combinedMetrics['f1-score'] !== undefined) {
        result.f1_score = combinedMetrics.f1_score !== undefined ? 
          combinedMetrics.f1_score : 
          (combinedMetrics.f1 !== undefined ? 
            combinedMetrics.f1 : 
            combinedMetrics['f1-score']);
      }
      
      // Add precision and recall
      if (combinedMetrics.precision !== undefined) result.precision = combinedMetrics.precision;
      if (combinedMetrics.recall !== undefined) result.recall = combinedMetrics.recall;
    } else {
      // Default classification metrics
      result.accuracy = combinedMetrics.accuracy;
      result.logloss = combinedMetrics.logloss;
      result.auc = combinedMetrics.auc;
      result.aucpr = combinedMetrics.aucpr;
      result.mean_per_class_error = combinedMetrics.mean_per_class_error;
      result.rmse = combinedMetrics.rmse;
      result.mse = combinedMetrics.mse;
      
      // Add F1, precision, recall if available
      if (combinedMetrics.f1_score !== undefined || combinedMetrics.f1 !== undefined || combinedMetrics['f1-score'] !== undefined) {
        result.f1_score = combinedMetrics.f1_score !== undefined ? 
          combinedMetrics.f1_score : 
          (combinedMetrics.f1 !== undefined ? 
            combinedMetrics.f1 : 
            combinedMetrics['f1-score']);
      }
      if (combinedMetrics.precision !== undefined) result.precision = combinedMetrics.precision;
      if (combinedMetrics.recall !== undefined) result.recall = combinedMetrics.recall;
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
  return ['accuracy', 'f1', 'f1_score', 'f1-score', 'precision', 'recall', 'auc', 'aucpr', 'specificity'].includes(metricName.toLowerCase());
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

// Get descriptions for metrics
const getMetricDescription = (metricName: string): string => {
  const descriptions: Record<string, string> = {
    'accuracy': 'Overall prediction accuracy',
    'precision': 'Positive predictive value',
    'recall': 'Sensitivity/True Positive Rate',
    'f1_score': 'Harmonic mean of precision and recall',
    'f1-score': 'Harmonic mean of precision and recall',
    'auc': 'Area Under the ROC Curve',
    'aucpr': 'Area Under the Precision-Recall Curve',
    'logloss': 'Cross-entropy loss, lower values are better',
    'rmse': 'Root Mean Squared Error',
    'mse': 'Mean Squared Error',
    'mae': 'Mean Absolute Error',
    'r2': 'Coefficient of determination',
    'specificity': 'True Negative Rate',
    'mcc': 'Matthews Correlation Coefficient',
    'mean_per_class_error': 'Average classification error across all classes',
  };
  
  return descriptions[metricName.toLowerCase()] || '';
};

// New component to display per-class metrics
interface PerClassMetricsTableProps {
  perClassMetrics: Record<string, PerClassMetric>;
}

const PerClassMetricsTable: React.FC<PerClassMetricsTableProps> = ({ perClassMetrics }) => {
  if (!perClassMetrics || Object.keys(perClassMetrics).length === 0) return null;
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Per-Class Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>F1 Score</TableHead>
                <TableHead>Support</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(perClassMetrics).map(([className, metrics]) => (
                <TableRow key={className}>
                  <TableCell className="font-medium">{className}</TableCell>
                  <TableCell>{(metrics.precision * 100).toFixed(2)}%</TableCell>
                  <TableCell>{(metrics.recall * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    {(metrics['f1-score'] !== undefined ? 
                      metrics['f1-score'] : metrics.f1_score) !== undefined ? 
                      ((metrics['f1-score'] !== undefined ? 
                        metrics['f1-score'] : metrics.f1_score) * 100).toFixed(2) + '%' : 'N/A'}
                  </TableCell>
                  <TableCell>{metrics.support}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, isPercentage = false, isMain = false }) => {
  // Format the display value
  let displayValue = typeof value === 'number' 
    ? isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4)
    : value;
  
  return (
    <Card className={`${isMain ? 'border-primary border-2' : ''}`}>
      <CardHeader className={`pb-2 ${isMain ? 'bg-primary/10' : ''}`}>
        <div className="flex justify-between items-center">
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
          {isMain && <Badge variant="mainMetric">Main</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isMain ? 'text-primary' : ''}`}>
          {displayValue}
        </div>
        {description && (
          <div className="text-sm text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DynamicMetricsDisplay: React.FC<DynamicMetricsDisplayProps> = ({ 
  metrics, 
  taskType,
  bestModelDetails,
  mainMetric = 'logloss' // Default main metric is logloss for H2O multiclass
}) => {
  const isClassification = taskType.includes('classification');
  const isMulticlass = taskType.includes('multiclass');
  const taskSpecificMetrics = getMetricsForTaskType(taskType, metrics, bestModelDetails, mainMetric);
  
  // Get confusion matrix if available
  const confusionMatrix = metrics.confusion_matrix || bestModelDetails?.confusion_matrix;
  
  // Check for per_class metrics
  const perClassMetrics = metrics.per_class || (metrics.metrics && metrics.metrics.per_class);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(taskSpecificMetrics).map(([key, value]) => {
          if (value === undefined) return null;
          
          // Get description and percentage formatting
          const isPercent = isPercentageMetric(key);
          const description = getMetricDescription(key);
          const isMainMetric = key === mainMetric;
          
          return (
            <MetricCard
              key={key}
              title={formatMetricName(key)}
              value={value}
              description={description}
              isPercentage={isPercent}
              isMain={isMainMetric}
            />
          );
        })}
      </div>
      
      {/* Add Per-Class Metrics Table for multiclass classification */}
      {isMulticlass && perClassMetrics && (
        <PerClassMetricsTable perClassMetrics={perClassMetrics} />
      )}
      
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
