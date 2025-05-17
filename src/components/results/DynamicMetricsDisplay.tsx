
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  colorClass?: string;
}

interface DynamicMetricsDisplayProps {
  metrics: Record<string, any>;
  taskType: string;
  bestModelDetails?: Record<string, any>;
}

const formatValue = (value: number | undefined, isPercentage: boolean = false): string => {
  if (value === undefined) return 'N/A';
  if (isPercentage) {
    return `${(value * 100).toFixed(2)}%`;
  }
  return value.toFixed(4);
};

const getMetricColor = (value: number | undefined, isErrorMetric: boolean = false): string => {
  if (value === undefined) return 'text-gray-400';

  if (isErrorMetric) {
    // For error metrics (lower is better)
    if (value <= 0.1) return 'text-green-600';
    if (value <= 0.3) return 'text-emerald-600';
    if (value <= 0.5) return 'text-amber-600';
    return 'text-red-600';
  } else {
    // For performance metrics (higher is better)
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  }
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, colorClass }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass || ''}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const DynamicMetricsDisplay: React.FC<DynamicMetricsDisplayProps> = ({ metrics, taskType, bestModelDetails }) => {
  // Special multiclass metrics from H2O
  const h2oMulticlassMetrics = useMemo(() => {
    return {
      mean_per_class_error: metrics.mean_per_class_error,
      logloss: metrics.logloss,
      rmse: metrics.rmse,
      mse: metrics.mse
    };
  }, [metrics]);
  
  const isH2OMulticlass = useMemo(() => {
    return taskType?.includes('multiclass') && metrics?.mean_per_class_error !== undefined;
  }, [metrics, taskType]);

  const isH2OBinary = useMemo(() => {
    return taskType?.includes('binary') && bestModelDetails?.auc !== undefined;
  }, [bestModelDetails, taskType]);

  const isClassification = taskType?.includes('classification');
  const isRegression = taskType?.includes('regression');

  // Determine primary metrics based on task type
  const primaryMetrics = useMemo(() => {
    if (isH2OBinary) {
      return [
        {
          title: 'AUC',
          value: formatValue(bestModelDetails?.auc, true),
          colorClass: getMetricColor(bestModelDetails?.auc),
          description: 'Area Under ROC Curve'
        },
        {
          title: 'Accuracy',
          value: formatValue(bestModelDetails?.accuracy, true),
          colorClass: getMetricColor(bestModelDetails?.accuracy),
          description: 'Overall prediction accuracy'
        },
        {
          title: 'F1 Score',
          value: formatValue(bestModelDetails?.f1, true),
          colorClass: getMetricColor(bestModelDetails?.f1),
          description: 'Harmonic mean of precision and recall'
        },
        {
          title: 'Precision',
          value: formatValue(bestModelDetails?.precision, true),
          colorClass: getMetricColor(bestModelDetails?.precision),
          description: 'Positive predictive value'
        },
        {
          title: 'Recall',
          value: formatValue(bestModelDetails?.recall, true),
          colorClass: getMetricColor(bestModelDetails?.recall),
          description: 'True positive rate'
        },
        {
          title: 'Specificity',
          value: formatValue(bestModelDetails?.specificity, true),
          colorClass: getMetricColor(bestModelDetails?.specificity),
          description: 'True negative rate'
        }
      ];
    }

    if (isH2OMulticlass) {
      return [
        {
          title: 'Mean Per Class Error',
          value: formatValue(h2oMulticlassMetrics.mean_per_class_error, true),
          colorClass: getMetricColor(1 - h2oMulticlassMetrics.mean_per_class_error),
          description: 'Average error across all classes'
        },
        {
          title: 'Log Loss',
          value: formatValue(h2oMulticlassMetrics.logloss),
          colorClass: getMetricColor(h2oMulticlassMetrics.logloss, true),
          description: 'Logarithmic loss (lower is better)'
        },
        {
          title: 'RMSE',
          value: formatValue(h2oMulticlassMetrics.rmse),
          colorClass: getMetricColor(h2oMulticlassMetrics.rmse, true),
          description: 'Root mean squared error'
        },
        {
          title: 'MSE',
          value: formatValue(h2oMulticlassMetrics.mse),
          colorClass: getMetricColor(h2oMulticlassMetrics.mse, true),
          description: 'Mean squared error'
        }
      ];
    }

    if (isClassification) {
      const f1Score = metrics.f1 || metrics.f1_score || metrics['f1-score'];
      return [
        {
          title: 'Accuracy',
          value: formatValue(metrics.accuracy, true),
          colorClass: getMetricColor(metrics.accuracy),
          description: 'Overall prediction accuracy'
        },
        {
          title: 'F1 Score',
          value: formatValue(f1Score, true),
          colorClass: getMetricColor(f1Score),
          description: 'Harmonic mean of precision and recall'
        },
        {
          title: 'Precision',
          value: formatValue(metrics.precision, true),
          colorClass: getMetricColor(metrics.precision),
          description: 'Positive predictive value'
        },
        {
          title: 'Recall',
          value: formatValue(metrics.recall, true),
          colorClass: getMetricColor(metrics.recall),
          description: 'True positive rate / Sensitivity'
        }
      ];
    }

    if (isRegression) {
      return [
        {
          title: 'R² Score',
          value: formatValue(metrics.r2 || metrics.r2_score, true),
          colorClass: getMetricColor(metrics.r2 || metrics.r2_score),
          description: 'Coefficient of determination'
        },
        {
          title: 'MAE',
          value: formatValue(metrics.mae),
          colorClass: getMetricColor(metrics.mae, true),
          description: 'Mean Absolute Error (lower is better)'
        },
        {
          title: 'RMSE',
          value: formatValue(metrics.rmse),
          colorClass: getMetricColor(metrics.rmse, true),
          description: 'Root Mean Squared Error (lower is better)'
        }
      ];
    }

    // Default case: display any available metrics
    return Object.entries(metrics)
      .filter(([key, value]) => typeof value === 'number' && !key.includes('_'))
      .map(([key, value]) => {
        const isErrorMetric = ['loss', 'error', 'mse', 'rmse', 'mae'].some(
          term => key.toLowerCase().includes(term)
        );
        
        return {
          title: key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          value: formatValue(value as number, !isErrorMetric && value >= 0 && value <= 1),
          colorClass: isErrorMetric 
            ? getMetricColor(value as number, true) 
            : getMetricColor(value as number),
          description: ''
        };
      });
  }, [metrics, taskType, bestModelDetails, h2oMulticlassMetrics, isH2OBinary, isH2OMulticlass, isClassification, isRegression]);

  if (Object.keys(metrics).length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No metrics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {primaryMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            colorClass={metric.colorClass}
          />
        ))}
      </div>
    </div>
  );
};

export default DynamicMetricsDisplay;
