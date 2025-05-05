
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClassificationReportTable from '../../ClassificationReportTable';

interface MetricsBlockProps {
  metrics: {
    accuracy?: number;
    f1_macro?: number;
    mae?: number;
    rmse?: number;
    r2?: number;
    report?: Record<string, {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    }>;
  };
  taskType: string;
}

const MetricsBlock: React.FC<MetricsBlockProps> = ({ metrics, taskType }) => {
  const formatMetric = (value: number) => (value * 100).toFixed(1) + '%';
  const formatRegressionMetric = (value: number) => value.toFixed(3);

  if (taskType.includes('classification')) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.accuracy !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.accuracy)}</div>
              </CardContent>
            </Card>
          )}
          {metrics.f1_macro !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">F1 Score (Macro)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.f1_macro)}</div>
              </CardContent>
            </Card>
          )}
        </div>
        {metrics.report && <ClassificationReportTable report={metrics.report} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.mae !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mean Absolute Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRegressionMetric(metrics.mae)}</div>
            </CardContent>
          </Card>
        )}
        {metrics.rmse !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Root Mean Squared Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRegressionMetric(metrics.rmse)}</div>
            </CardContent>
          </Card>
        )}
        {metrics.r2 !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">R² Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRegressionMetric(metrics.r2)}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MetricsBlock;
