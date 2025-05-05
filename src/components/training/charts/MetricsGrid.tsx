
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  isPercentage?: boolean;
  highlight?: boolean;
}

interface MetricsGridProps {
  metrics: Record<string, number>;
  taskType?: string;
}

// Metric descriptions for tooltips
const METRIC_DESCRIPTIONS: Record<string, string> = {
  accuracy: "Percentage of correct predictions out of all predictions",
  f1_score: "Harmonic mean of precision and recall, balancing both metrics",
  precision: "Ratio of true positives to all positive predictions",
  recall: "Ratio of true positives to all actual positives",
  auc: "Area Under the ROC Curve, measuring classifier performance",
  r2_score: "Coefficient of determination, indicating how well data fits the model",
  mae: "Mean Absolute Error, average absolute difference between predictions and actual values",
  mse: "Mean Squared Error, average squared difference between predictions and actual values",
  rmse: "Root Mean Squared Error, square root of MSE",
  logloss: "Logarithmic Loss, measuring classifier accuracy with probabilistic outputs",
  mcc: "Matthews Correlation Coefficient, balanced measure for binary classification"
};

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  isPercentage = false,
  highlight = false 
}) => {
  // Determine display value and color based on the metric
  let displayValue = typeof value === 'number' 
    ? isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4)
    : value;
  
  let colorClass = 'text-muted-foreground';
  
  if (typeof value === 'number') {
    if (isPercentage || title.toLowerCase().includes('r2')) {
      if (value >= 0.9) colorClass = 'text-green-600';
      else if (value >= 0.7) colorClass = 'text-emerald-600';
      else if (value >= 0.5) colorClass = 'text-amber-600';
      else colorClass = 'text-red-600';
    } else if (title.toLowerCase().includes('error') || title.toLowerCase().includes('loss')) {
      // For error metrics, lower is better
      if (value < 0.1) colorClass = 'text-green-600';
      else if (value < 0.3) colorClass = 'text-emerald-600';
      else if (value < 0.5) colorClass = 'text-amber-600';
      else colorClass = 'text-red-600';
    }
  }
  
  const metricDescription = METRIC_DESCRIPTIONS[title.toLowerCase().replace(/\s+/g, '_')] || description;
  
  return (
    <Card className={cn(
      "transition-all",
      highlight && "border-primary/30 shadow-md"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          {metricDescription && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Info className="h-4 w-4 text-muted-foreground ml-1 inline cursor-help" /></span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{metricDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {displayValue}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, taskType }) => {
  const isClassification = taskType?.includes('classification');
  
  // Determine which is the primary metric for highlighting
  const getPrimaryMetricKey = (): string => {
    if (isClassification) {
      if (metrics.accuracy !== undefined) return 'accuracy';
      if (metrics.f1_score !== undefined) return 'f1_score';
    } else {
      if (metrics.r2_score !== undefined) return 'r2_score';
      if (metrics.rmse !== undefined) return 'rmse';
    }
    return Object.keys(metrics)[0] || '';
  };
  
  const primaryMetricKey = getPrimaryMetricKey();
  
  // Group metrics by category
  const classificationMetrics = ['accuracy', 'f1_score', 'precision', 'recall', 'auc', 'roc_auc', 'logloss', 'mcc'];
  const regressionMetrics = ['r2_score', 'mae', 'mse', 'rmse'];
  
  // Format metric name for display
  const formatMetricName = (name: string): string => {
    // Special cases
    if (name === 'r2_score') return 'R² Score';
    if (name === 'mae') return 'MAE';
    if (name === 'mse') return 'MSE';
    if (name === 'rmse') return 'RMSE';
    if (name === 'mcc') return 'MCC';
    if (name === 'auc' || name === 'roc_auc') return 'AUC';
    
    // General case
    return name.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {isClassification ? (
        // Classification metrics
        <>
          {classificationMetrics.map(key => {
            if (metrics[key] === undefined) return null;
            return (
              <MetricCard 
                key={key}
                title={formatMetricName(key)} 
                value={metrics[key]} 
                isPercentage={key !== 'logloss'}
                highlight={key === primaryMetricKey}
              />
            );
          })}
        </>
      ) : (
        // Regression metrics
        <>
          {regressionMetrics.map(key => {
            if (metrics[key] === undefined) return null;
            return (
              <MetricCard 
                key={key}
                title={formatMetricName(key)} 
                value={metrics[key]} 
                isPercentage={key === 'r2_score'}
                highlight={key === primaryMetricKey}
              />
            );
          })}
        </>
      )}
      
      {/* Custom or additional metrics */}
      {Object.entries(metrics).map(([key, value]) => {
        // Skip already rendered metrics
        if ([...classificationMetrics, ...regressionMetrics].includes(key) || 
            key === 'classification_report' ||
            key === 'confusion_matrix') {
          return null;
        }
        
        const isPercentage = ['accuracy', 'f1', 'precision', 'recall', 'auc'].some(m => 
          key.toLowerCase().includes(m)
        );
        
        return (
          <MetricCard 
            key={key}
            title={formatMetricName(key)}
            value={value}
            isPercentage={isPercentage}
            highlight={key === primaryMetricKey}
          />
        );
      })}
    </div>
  );
};

export default MetricsGrid;
