
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadCloud } from 'lucide-react';
import ClassificationReportTable from '../../ClassificationReportTable';
import DynamicMetricsDisplay from '@/components/results/DynamicMetricsDisplay';

interface MetricsBlockProps {
  metrics: {
    accuracy?: number;
    f1_macro?: number;
    f1?: number;
    auc?: number;
    precision?: number;
    recall?: number;
    mcc?: number;
    logloss?: number;
    mae?: number;
    rmse?: number;
    r2?: number;
    // Additional H2O metrics
    aucpr?: number;
    mean_per_class_error?: number;
    best_model_details?: Record<string, any>;
    confusion_matrix?: number[][];
    class_labels?: string[];
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
  return (
    <div className="space-y-6">
      {/* Use the DynamicMetricsDisplay component for consistent metrics display */}
      <DynamicMetricsDisplay 
        metrics={metrics} 
        taskType={taskType} 
        bestModelDetails={metrics.best_model_details}
      />
      
      {/* Add Download Model button if URL is provided */}
      {modelFileUrl && (
        <Card className="mt-4">
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

      {metrics.report && <ClassificationReportTable report={metrics.report} />}
    </div>
  );
};

export default MetricsBlock;
