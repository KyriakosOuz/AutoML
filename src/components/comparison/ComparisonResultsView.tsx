import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadCSV } from '@/components/training/prediction/utils/downloadUtils';

interface ComparisonExperiment {
  experiment_id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm: string;
  engine: string | null;
  metrics: {
    accuracy?: number;
    f1_score?: number;
    precision?: number;
    recall?: number;
    auc?: number;
    r2?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    f1?: number; // Add f1 as a possible metric
    // Additional H2O metrics
    aucpr?: number;
    mean_per_class_error?: number;
    logloss?: number;
  };
  dataset_name: string;
}

interface ComparisonResultsViewProps {
  experiments: ComparisonExperiment[];
}

// Helper function to get F1 score from either f1 or f1_score
const getF1Score = (metrics: ComparisonExperiment['metrics']): number | undefined => {
  return metrics.f1_score !== undefined ? metrics.f1_score : metrics.f1;
};

const formatMetricValue = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  return typeof value === 'number' ? value.toFixed(4) : String(value);
};

const ComparisonResultsView: React.FC<ComparisonResultsViewProps> = ({ experiments }) => {
  if (!experiments.length) return null;
  
  const firstExperiment = experiments[0];
  const isRegression = firstExperiment.task_type.includes('regression');
  
  // Determine the engine type from the first experiment
  const engineType = firstExperiment.engine?.toLowerCase();
  
  // Determine metrics based on task type
  const metrics = isRegression 
    ? ['r2', 'mae', 'mse', 'rmse'] 
    : ['accuracy', 'precision', 'recall', 'f1_score', 'auc', 'aucpr', 'mean_per_class_error', 'logloss']; 
  
  // Calculate minimum width based on number of experiments
  // Base width for metric column + each experiment takes approximately 180px
  const experimentsCount = experiments.length;
  const useScrolling = experimentsCount > 5;
  const minWidth = useScrolling ? `${180 + (experimentsCount * 180)}px` : undefined;
  
  // Function to handle exporting to CSV
  const handleExportToCsv = () => {
    // Convert experiments data to a format suitable for CSV
    const csvData = experiments.map(exp => {
      const metricsData: Record<string, any> = {
        experiment_name: exp.experiment_name,
        experiment_id: exp.experiment_id,
        algorithm: exp.algorithm,
        engine: exp.engine,
        dataset_name: exp.dataset_name,
        created_at: format(new Date(exp.created_at), 'yyyy-MM-dd HH:mm:ss')
      };
      
      // Add all available metrics
      Object.entries(exp.metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          metricsData[key] = value;
        }
      });
      
      return metricsData;
    });
    
    // Download the CSV file
    downloadCSV(csvData, 'comparison_results.csv');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button size="sm" variant="outline" onClick={handleExportToCsv}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>
      
      <ResponsiveTable minWidth={minWidth}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px] min-w-[180px] sticky left-0 bg-background z-20">Metric</TableHead>
            {experiments.map((exp) => (
              <TableHead key={exp.experiment_id} className="min-w-[180px]">
                <div className="truncate max-w-[180px]" title={exp.experiment_name}>
                  {exp.experiment_name}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">Engine</TableCell>
            {experiments.map((exp) => (
              <TableCell key={`${exp.experiment_id}-engine`}>
                <Badge variant="outline" className="bg-primary/10">
                  {exp.engine ? exp.engine.toUpperCase() : 'Unknown'}
                </Badge>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">Dataset</TableCell>
            {experiments.map((exp) => (
              <TableCell key={`${exp.experiment_id}-dataset`}>
                {exp.dataset_name || 'Unknown dataset'}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium sticky left-0 bg-background z-10">Created</TableCell>
            {experiments.map((exp) => (
              <TableCell key={`${exp.experiment_id}-created`}>
                {format(new Date(exp.created_at), 'MMM d, yyyy')}
              </TableCell>
            ))}
          </TableRow>
          
          {/* Metrics rows - includes all relevant metrics */}
          {metrics.map((metric) => {
            // Skip metrics that don't exist in any experiments
            const hasMetric = experiments.some(exp => {
              if (metric === 'f1_score') {
                return getF1Score(exp.metrics) !== undefined;
              }
              return exp.metrics[metric as keyof typeof exp.metrics] !== undefined;
            });
            
            if (!hasMetric) return null;
            
            return (
              <TableRow key={metric}>
                <TableCell className="font-medium sticky left-0 bg-background z-10 capitalize">
                  {metric === 'r2' ? 'R²' : 
                   metric === 'aucpr' ? 'AUC PR' :
                   metric === 'mean_per_class_error' ? 'Mean Per Class Error' :
                   metric === 'logloss' ? 'Log Loss' :
                   metric.replace('_', ' ')}
                </TableCell>
                {experiments.map((exp) => {
                  // For f1_score, use our helper function to get the value from either f1 or f1_score
                  const metricValue = metric === 'f1_score' ? 
                    getF1Score(exp.metrics) : 
                    exp.metrics[metric as keyof typeof exp.metrics] as number | undefined;
                    
                  // Find the best value for this metric across all experiments
                  const metricValues = experiments.map(e => {
                    if (metric === 'f1_score') {
                      return getF1Score(e.metrics);
                    }
                    return e.metrics[metric as keyof typeof e.metrics] as number | undefined;
                  });
                  
                  const bestValue = isRegression 
                    ? (metric === 'r2' ? Math.max(...metricValues.filter(Boolean) as number[]) : Math.min(...metricValues.filter(Boolean) as number[]))
                    : ['logloss', 'mean_per_class_error'].includes(metric)
                      ? Math.min(...metricValues.filter(Boolean) as number[])
                      : Math.max(...metricValues.filter(Boolean) as number[]);
                  
                  const isBest = metricValue !== undefined && 
                    ((isRegression && metric === 'r2' && metricValue === bestValue) || 
                     (isRegression && metric !== 'r2' && metricValue === bestValue) ||
                     (!isRegression && ['logloss', 'mean_per_class_error'].includes(metric) && metricValue === bestValue) ||
                     (!isRegression && !['logloss', 'mean_per_class_error'].includes(metric) && metricValue === bestValue));
                  
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-${metric}`}
                      className={isBest ? 'font-bold text-primary' : ''}
                    >
                      {formatMetricValue(metricValue)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </ResponsiveTable>
      
      <div className="text-sm text-muted-foreground">
        <p>* Best values for each metric are highlighted.</p>
      </div>
    </div>
  );
};

export default ComparisonResultsView;
