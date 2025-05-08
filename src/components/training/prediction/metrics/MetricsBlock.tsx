
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';
import ClassificationReportTable from '../../ClassificationReportTable';

interface MetricsBlockProps {
  metrics: {
    accuracy?: number;
    f1_macro?: number;
    f1?: number;
    auc?: number;
    mcc?: number;
    recall?: number;
    logloss?: number;
    precision?: number;
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
  modelFileUrl?: string;
}

const MetricsBlock: React.FC<MetricsBlockProps> = ({ metrics, taskType, modelFileUrl }) => {
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
          
          {(metrics.f1_macro !== undefined || metrics.f1 !== undefined) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">F1 Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.f1_macro ?? metrics.f1!)}</div>
              </CardContent>
            </Card>
          )}
          
          {metrics.precision !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.precision)}</div>
              </CardContent>
            </Card>
          )}
          
          {metrics.recall !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.recall)}</div>
              </CardContent>
            </Card>
          )}
          
          {metrics.auc !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AUC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.auc)}</div>
              </CardContent>
            </Card>
          )}
          
          {metrics.mcc !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">MCC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMetric(metrics.mcc)}</div>
              </CardContent>
            </Card>
          )}
          
          {metrics.logloss !== undefined && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Log Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatRegressionMetric(metrics.logloss)}</div>
              </CardContent>
            </Card>
          )}
          
          {/* Add Download Model button if URL is provided */}
          {modelFileUrl && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Download Model</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <a href={modelFileUrl} download target="_blank" rel="noopener noreferrer">
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
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
        
        {/* Add Download Model button if URL is provided */}
        {modelFileUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Download Model</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href={modelFileUrl} download target="_blank" rel="noopener noreferrer">
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MetricsBlock;
