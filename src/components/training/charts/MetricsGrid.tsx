
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

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, isPercentage = false }) => {
  // Determine display value and color based on the metric
  let displayValue = typeof value === 'number' 
    ? isPercentage 
      ? `${(value * 100).toFixed(2)}%` 
      : value.toFixed(4)
    : value;
  
  let colorClass = 'text-muted-foreground';
  if (typeof value === 'number' && isPercentage) {
    if (value >= 0.9) colorClass = 'text-green-600';
    else if (value >= 0.7) colorClass = 'text-emerald-600';
    else if (value >= 0.5) colorClass = 'text-amber-600';
    else colorClass = 'text-red-600';
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
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {isClassification ? (
        // Classification metrics
        <>
          {metrics.accuracy !== undefined && (
            <MetricCard 
              title="Accuracy" 
              value={metrics.accuracy} 
              description="Overall correctness of predictions"
              isPercentage={true}
            />
          )}
          
          {metrics.f1_score !== undefined && (
            <MetricCard 
              title="F1 Score" 
              value={metrics.f1_score} 
              description="Harmonic mean of precision and recall"
              isPercentage={true}
            />
          )}
          
          {metrics.precision !== undefined && (
            <MetricCard 
              title="Precision" 
              value={metrics.precision} 
              description="Positive predictive value"
              isPercentage={true}
            />
          )}
          
          {metrics.recall !== undefined && (
            <MetricCard 
              title="Recall" 
              value={metrics.recall} 
              description="Sensitivity/True Positive Rate"
              isPercentage={true}
            />
          )}
          
          {metrics.auc !== undefined && (
            <MetricCard 
              title="AUC" 
              value={metrics.auc} 
              description="Area Under ROC Curve"
              isPercentage={true}
            />
          )}
        </>
      ) : (
        // Regression metrics
        <>
          {metrics.r2_score !== undefined && (
            <MetricCard 
              title="R² Score" 
              value={metrics.r2_score} 
              description="Coefficient of determination"
              isPercentage={false}
            />
          )}
          
          {metrics.mae !== undefined && (
            <MetricCard 
              title="MAE" 
              value={metrics.mae} 
              description="Mean Absolute Error"
              isPercentage={false}
            />
          )}
          
          {metrics.mse !== undefined && (
            <MetricCard 
              title="MSE" 
              value={metrics.mse} 
              description="Mean Squared Error"
              isPercentage={false}
            />
          )}
          
          {metrics.rmse !== undefined && (
            <MetricCard 
              title="RMSE" 
              value={metrics.rmse} 
              description="Root Mean Squared Error"
              isPercentage={false}
            />
          )}
        </>
      )}
      
      {/* Custom or additional metrics */}
      {Object.entries(metrics).map(([key, value]) => {
        // Skip already rendered metrics
        if (['accuracy', 'f1_score', 'precision', 'recall', 'auc', 'r2_score', 'mae', 'mse', 'rmse'].includes(key)) {
          return null;
        }
        
        const isPercentage = ['accuracy', 'f1', 'precision', 'recall', 'auc'].some(m => 
          key.toLowerCase().includes(m)
        );
        
        return (
          <MetricCard 
            key={key}
            title={key.replace(/_/g, ' ')}
            value={value}
            isPercentage={isPercentage}
          />
        );
      })}
    </div>
  );
};

export default MetricsGrid;
