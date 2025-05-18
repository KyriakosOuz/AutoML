
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
const formatMetricValue = (value: number | number[] | number[][] | undefined, decimals: number = 3): string => {
  if (value === undefined) return 'N/A';
  
  // Handle array values
  if (Array.isArray(value)) {
    // For nested arrays, flatten and average
    if (Array.isArray(value[0])) {
      const flatValues = (value as number[][]).flat();
      return flatValues.length > 0 
        ? (flatValues.reduce((acc, val) => acc + val, 0) / flatValues.length).toFixed(decimals) 
        : 'N/A';
    }
    
    // For simple arrays, calculate average
    return (value as number[]).length > 0 
      ? ((value as number[]).reduce((acc, val) => acc + val, 0) / (value as number[]).length).toFixed(decimals) 
      : 'N/A';
  }
  
  // For simple number values
  return value.toFixed(decimals);
};

// Helper function to format metric names for display
const formatMetricName = (key: string): string => {
  const metricNameMap: Record<string, string> = {
    'auc': 'AUC',
    'logloss': 'Log Loss',
    'aucpr': 'AUC PR',
    'mean_per_class_error': 'MPCE', // Changed to MPCE as requested
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
    'rmsle': 'RMSLE',
    'mean_residual_deviance': 'Mean Residual Deviance',
  };

  return metricNameMap[key] || key.replace(/_/g, ' ').split(' ').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to determine if a metric should be displayed as a percentage
const isPercentageMetric = (metricName: string): boolean => {
  return ['accuracy', 'f1', 'f1_score', 'f1-score', 'precision', 'recall', 'auc', 'aucpr', 'specificity', 'mean_per_class_error'].includes(metricName.toLowerCase());
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

// Determine which metrics to show based on task type
const getMetricsForTaskType = (
  taskType: string, 
  metrics: Record<string, any>,
  bestModelDetails?: Record<string, any>,
  mainMetric?: string
): Record<string, number | number[] | number[][] | undefined> => {
  const isClassification = taskType.includes('classification');
  const isBinary = taskType.includes('binary');
  const isMulticlass = taskType.includes('multiclass');
  const isH2O = metrics?.automl_engine === 'h2o' || bestModelDetails?.automl_engine === 'h2o';
  const isRegression = taskType.includes('regression');
  const result: Record<string, number | number[] | number[][] | undefined> = {};
  
  // Combine metrics from both sources, prioritizing bestModelDetails
  const combinedMetrics = { ...metrics };
  if (bestModelDetails) {
    Object.entries(bestModelDetails).forEach(([key, value]) => {
      if (typeof value === 'number' || Array.isArray(value)) {
        combinedMetrics[key] = value;
      }
    });
  }
  
  if (isClassification) {
    if (isMulticlass && isH2O) {
      // H2O multiclass classification - use the metrics that are actually available
      if (combinedMetrics.mse !== undefined) result.mse = combinedMetrics.mse;
      if (combinedMetrics.rmse !== undefined) result.rmse = combinedMetrics.rmse;
      if (combinedMetrics.logloss !== undefined) result.logloss = combinedMetrics.logloss;
      if (combinedMetrics.mean_per_class_error !== undefined) result.mean_per_class_error = combinedMetrics.mean_per_class_error;
      
      // If there's a main metric specified, make sure it's included
      if (mainMetric && combinedMetrics[mainMetric] !== undefined) {
        result[mainMetric] = combinedMetrics[mainMetric];
      }
    } else if (isMulticlass) {
      // For multiclass classification, always include the main metric (logloss) if available
      if (mainMetric && combinedMetrics[mainMetric] !== undefined) {
        result[mainMetric] = combinedMetrics[mainMetric];
      }
      
      // Add H2O multiclass specific metrics
      if (combinedMetrics.mean_per_class_error !== undefined) result.mean_per_class_error = combinedMetrics.mean_per_class_error;
      if (combinedMetrics.logloss !== undefined) result.logloss = combinedMetrics.logloss;
      if (combinedMetrics.rmse !== undefined) result.rmse = combinedMetrics.rmse;
      if (combinedMetrics.mse !== undefined) result.mse = combinedMetrics.mse;
      
      // Also include these standard metrics if available
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
  } else if (isRegression) {
    // For H2O regression, show the metrics in a specific order with Mean Residual Deviance as main
    if (isH2O) {
      // Set Mean Residual Deviance as the default main metric for regression if not specified
      const regressionMainMetric = mainMetric || 'mean_residual_deviance';
      
      // Add the main metric first
      if (combinedMetrics[regressionMainMetric] !== undefined) {
        result[regressionMainMetric] = combinedMetrics[regressionMainMetric];
      }
      
      // Add other H2O regression metrics in order
      if (combinedMetrics.mae !== undefined) result.mae = combinedMetrics.mae;
      if (combinedMetrics.mse !== undefined) result.mse = combinedMetrics.mse;
      if (regressionMainMetric !== 'rmse' && combinedMetrics.rmse !== undefined) 
        result.rmse = combinedMetrics.rmse;
      if (combinedMetrics.rmsle !== undefined) result.rmsle = combinedMetrics.rmsle;
      if (regressionMainMetric !== 'mean_residual_deviance' && combinedMetrics.mean_residual_deviance !== undefined) 
        result.mean_residual_deviance = combinedMetrics.mean_residual_deviance;
      if (combinedMetrics.r2 !== undefined) result.r2 = combinedMetrics.r2;
    } else {
      // Standard regression metrics
      result.mae = combinedMetrics.mae;
      result.rmse = combinedMetrics.rmse;
      result.mse = combinedMetrics.mse;
      result.r2 = combinedMetrics.r2;
      
      // Add additional regression metrics if available
      if (combinedMetrics.rmsle !== undefined) result.rmsle = combinedMetrics.rmsle;
      if (combinedMetrics.mean_residual_deviance !== undefined) 
        result.mean_residual_deviance = combinedMetrics.mean_residual_deviance;
    }
  }
  
  return result;
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
    'mean_per_class_error': 'Mean Per-Class Error (average classification error across all classes)',
    'rmsle': 'Root Mean Squared Logarithmic Error',
    'mean_residual_deviance': 'Mean of residual deviance, lower values are better',
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
        <CardTitle className="text-base flex items-center justify-between">
          <span className="truncate">{title}</span>
          <div className="flex items-center">
            {isMain && (
              <Badge variant="outline" className="bg-primary text-primary-foreground ml-2">
                Main
              </Badge>
            )}
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
          </div>
        </CardTitle>
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
  mainMetric = taskType.includes('regression') ? 'mean_residual_deviance' : 'logloss' // Changed default for regression to mean_residual_deviance
}) => {
  const isClassification = taskType.includes('classification');
  const isMulticlass = taskType.includes('multiclass');
  const isRegression = taskType.includes('regression');
  const isH2O = metrics?.automl_engine === 'h2o' || bestModelDetails?.automl_engine === 'h2o';
  
  const taskSpecificMetrics = getMetricsForTaskType(taskType, metrics, bestModelDetails, mainMetric);
  
  // Get confusion matrix if available
  const confusionMatrix = metrics.confusion_matrix || bestModelDetails?.confusion_matrix;
  
  // Check for per_class metrics
  const perClassMetrics = metrics.per_class || (metrics.metrics && metrics.metrics.per_class);
  
  return (
    <div className="space-y-6">
      {/* For regression, display a grid similar to multiclass */}
      {isRegression && isH2O && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {['mean_residual_deviance', 'mae', 'mse', 'rmse', 'rmsle', 'r2'].map((metricName) => {
            if (metrics[metricName] === undefined && (!bestModelDetails || bestModelDetails[metricName] === undefined)) return null;
            
            const metricValue = metrics[metricName] !== undefined ? metrics[metricName] : 
                              bestModelDetails ? bestModelDetails[metricName] : undefined;
            if (metricValue === undefined) return null;
            
            const isMainMetric = metricName === (mainMetric || 'mean_residual_deviance');
            const description = getMetricDescription(metricName);
            
            // Create metric descriptions based on the image reference
            let metricDescription;
            switch (metricName) {
              case 'mae':
                metricDescription = 'Mean Absolute Error';
                break;
              case 'mse':
                metricDescription = 'Mean Squared Error';
                break;
              case 'rmse':
                metricDescription = 'Root Mean Squared Error';
                break;
              case 'rmsle':
                metricDescription = 'Root Mean Squared Logarithmic Error';
                break;
              case 'mean_residual_deviance':
                metricDescription = 'Mean of residual deviance, lower values are better';
                break;
              case 'r2':
                metricDescription = 'Coefficient of determination';
                break;
              default:
                metricDescription = description;
            }
            
            return (
              <div 
                key={metricName} 
                className={`bg-muted p-4 rounded-lg ${isMainMetric ? 'border-primary border-2' : ''}`}
              >
                <p className="text-sm text-muted-foreground flex items-center justify-between">
                  {formatMetricName(metricName)}
                  {isMainMetric && (
                    <Badge variant="outline" className="bg-primary text-primary-foreground text-xs">
                      Main
                    </Badge>
                  )}
                </p>
                <p className={`text-2xl font-semibold ${isMainMetric ? 'text-primary' : ''}`}>
                  {formatMetricValue(metricValue)}
                </p>
                {metricDescription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metricDescription}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main metrics grid for all metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(taskSpecificMetrics).map(([key, value]) => {
          if (value === undefined) return null;
          
          // Skip metrics that are already shown in the top grid for H2O regression
          if (isRegression && isH2O) return null;
          
          // Format the metric value accounting for arrays
          let displayValue: string | number;
          
          if (Array.isArray(value)) {
            // For array values, use our formatting helper
            displayValue = formatMetricValue(value);
          } else {
            // For regular values, just use the value directly
            displayValue = value;
          }
          
          // Get description and percentage formatting
          const isPercent = isPercentageMetric(key);
          const description = getMetricDescription(key);
          const isMainMetric = key === mainMetric;
          
          // For mean_per_class_error, ensure it's displayed as MPCE
          const displayName = key === 'mean_per_class_error' ? 'MPCE' : formatMetricName(key);
          
          return (
            <MetricCard
              key={key}
              title={displayName}
              value={displayValue}
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
