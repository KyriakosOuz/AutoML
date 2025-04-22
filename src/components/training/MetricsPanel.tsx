
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricsPanelProps {
  taskType?: string;
  metrics: Record<string, any>;
}

const formatMetric = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return (value * 100).toFixed(2) + '%';
};

const formatRegressionMetric = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return value.toFixed(4);
};

const getMetricColor = (value: number | undefined) => {
  if (value === undefined) return 'text-gray-400';
  if (value >= 0.9) return 'text-green-600';
  if (value >= 0.7) return 'text-emerald-600';
  if (value >= 0.5) return 'text-amber-600';
  return 'text-red-600';
};

const MetricsPanel: React.FC<MetricsPanelProps> = ({ taskType, metrics }) => {
  const isClassification = taskType?.includes('classification');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {isClassification ? (
        <>
          {metrics.accuracy !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                  {formatMetric(metrics.accuracy)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.f1_score !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">F1 Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.f1_score)}`}>
                  {formatMetric(metrics.f1_score)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.precision !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                  {formatMetric(metrics.precision)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.recall !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                  {formatMetric(metrics.recall)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {metrics.r2_score !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">R² Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.r2_score)}`}>
                  {formatRegressionMetric(metrics.r2_score)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.mae !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mean Absolute Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRegressionMetric(metrics.mae)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.mse !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mean Squared Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRegressionMetric(metrics.mse)}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics.rmse !== undefined && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRegressionMetric(metrics.rmse)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MetricsPanel;

