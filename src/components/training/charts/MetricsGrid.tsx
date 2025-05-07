import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  isPercentage?: boolean;
}

interface MetricsGridProps {
  metrics: Record<string, number>;
  taskType?: string;
}

// Helper function to format metric names for display
const formatMetricName = (key: string): string => {
  const metricNameMap: Record<string, string> = {
    'f1': 'F1 Score',
    'f1_score': 'F1 Score',
    'auc': 'AUC',
    'mcc': 'Matthews CC',
    'recall': 'Recall',
    'logloss': 'Log Loss',
    'accuracy': 'Accuracy',
    'precision': 'Precision',
    'r2_score': 'R² Score',
    'mae': 'Mean Absolute Error',
    'mse': 'Mean Squared Error',
    'rmse': 'Root Mean Squared Error',
  };

  return metricNameMap[key] || key.replace(/_/g, ' ').split(' ').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to determine if a metric should be displayed as a percentage
const shouldBePercentage = (key: string): boolean => {
  return ['accuracy', 'f1', 'f1_score', 'precision', 'recall', 'auc'].includes(key.toLowerCase());
};

// Helper function to determine metric description
const getMetricDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    'accuracy': 'Overall correctness of predictions',
    'f1': 'Harmonic mean of precision and recall',
    'f1_score': 'Harmonic mean of precision and recall',
    'precision': 'Positive predictive value',
    'recall': 'Sensitivity/True Positive Rate',
    'auc': 'Area Under ROC Curve',
    'mcc': 'Matthews Correlation Coefficient',
    'logloss': 'Log Loss (lower is better)',
    'r2_score': 'Coefficient of determination',
    'mae': 'Mean Absolute Error (lower is better)',
    'mse': 'Mean Squared Error (lower is better)',
    'rmse': 'Root Mean Squared Error (lower is better)',
  };

  return descriptions[key] || '';
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, isPercentage = false }) => {
  // Determine display value and color based on the metric
  let displayValue = typeof value === 'number' 
    ? isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4)
    : value;
  
  let colorClass = 'text-muted-foreground';
  if (typeof value === 'number') {
    if (title.toLowerCase().includes('loss') || title.toLowerCase().includes('error')) {
      // For loss/error metrics, lower is better
      if (value <= 0.1) colorClass = 'text-green-600';
      else if (value <= 0.3) colorClass = 'text-emerald-600';
      else if (value <= 0.5) colorClass = 'text-amber-600';
      else colorClass = 'text-red-600';
    } else if (isPercentage) {
      // For percentage metrics like accuracy, higher is better
      if (value >= 0.9) colorClass = 'text-green-600';
      else if (value >= 0.7) colorClass = 'text-emerald-600';
      else if (value >= 0.5) colorClass = 'text-amber-600';
      else colorClass = 'text-red-600';
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
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
  
  // Group metrics by importance and type
  const primaryMetrics: string[] = isClassification 
    ? ['accuracy', 'f1', 'f1_score', 'precision', 'recall', 'auc']
    : ['r2_score', 'mae', 'mse', 'rmse'];
  
  const secondaryMetrics: string[] = ['mcc', 'logloss'];
  
  // Get primary metrics that exist in the data
  const existingPrimaryMetrics = primaryMetrics.filter(
    metric => metrics[metric] !== undefined
  );
  
  // Get all other metrics that aren't in the primary list
  const otherMetrics = Object.keys(metrics).filter(key => {
    // Filter out non-numeric values and those that are in the primary list
    if (typeof metrics[key] !== 'number') return false;
    if (primaryMetrics.includes(key)) return false;
    
    // Keep metrics that contain 'score' or other meaningful suffixes
    return true;
  });
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {/* Primary metrics (always show these first) */}
      {existingPrimaryMetrics.map(key => (
        <MetricCard 
          key={key}
          title={formatMetricName(key)}
          value={metrics[key]}
          description={getMetricDescription(key)}
          isPercentage={shouldBePercentage(key)}
        />
      ))}
      
      {/* Secondary metrics */}
      {secondaryMetrics
        .filter(metric => metrics[metric] !== undefined)
        .map(key => (
          <MetricCard 
            key={key}
            title={formatMetricName(key)}
            value={metrics[key]}
            description={getMetricDescription(key)}
            isPercentage={shouldBePercentage(key)}
          />
        ))
      }
      
      {/* All other metrics */}
      {otherMetrics.map(key => {
        const isPercentage = shouldBePercentage(key);
        
        return (
          <MetricCard 
            key={key}
            title={formatMetricName(key)}
            value={metrics[key]}
            description={getMetricDescription(key)}
            isPercentage={isPercentage}
          />
        );
      })}
    </div>
  );
};

export default MetricsGrid;
