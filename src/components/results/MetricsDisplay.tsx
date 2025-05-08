
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExperimentResults } from '@/types/training';

interface MetricsDisplayProps {
  results: ExperimentResults;
}

const formatValue = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return value >= 0 && value <= 1 ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
};

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ results }) => {
  const metrics = results?.metrics || {};
  
  // Filter out non-numeric metrics and special keys
  const relevantMetrics = Object.entries(metrics)
    .filter(([key, value]) => 
      typeof value === 'number' && 
      !key.includes('matrix') &&
      !key.includes('report') &&
      !key.includes('_samples') &&
      !key.includes('_avg')
    );

  if (relevantMetrics.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No metrics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {relevantMetrics.map(([key, value]) => {
          const isPercentageMetric = ['accuracy', 'f1', 'f1_score', 'precision', 'recall', 'auc', 'r2'].some(
            metricName => key.toLowerCase().includes(metricName)
          );
          
          const displayName = key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return (
            <Card key={key} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isPercentageMetric 
                    ? formatValue(value as number)
                    : typeof value === 'number' ? value.toFixed(4) : String(value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsDisplay;
