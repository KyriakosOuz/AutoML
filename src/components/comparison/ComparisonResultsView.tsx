
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  };
  dataset_name: string;
}

interface ComparisonResultsViewProps {
  experiments: ComparisonExperiment[];
}

const formatMetricValue = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  return typeof value === 'number' ? value.toFixed(4) : String(value);
};

const ComparisonResultsView: React.FC<ComparisonResultsViewProps> = ({ experiments }) => {
  if (!experiments.length) return null;
  
  const firstExperiment = experiments[0];
  const isRegression = firstExperiment.task_type.includes('regression');
  
  // Remove AUC from metrics list
  const metrics = isRegression 
    ? ['r2', 'mae', 'mse', 'rmse'] 
    : ['accuracy', 'precision', 'recall', 'f1_score']; // Removed 'auc'
  
  return (
    <div className="space-y-6">
      <ScrollArea className="w-full" type="always">
        <div className="min-w-[650px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] min-w-[180px] sticky left-0 bg-background z-20">Metric</TableHead>
                {experiments.map((exp) => (
                  <TableHead key={exp.experiment_id} className="min-w-[150px]">
                    <div className="truncate max-w-[150px]" title={exp.experiment_name}>
                      {exp.experiment_name}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-background z-10">Algorithm</TableCell>
                {experiments.map((exp) => (
                  <TableCell key={`${exp.experiment_id}-algorithm`}>
                    <Badge variant="outline">{exp.algorithm}</Badge>
                    {exp.engine && (
                      <Badge variant="outline" className="ml-1 bg-primary/10">{exp.engine}</Badge>
                    )}
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
              
              {/* Metrics rows - removed AUC */}
              {metrics.map((metric) => (
                <TableRow key={metric}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10 capitalize">
                    {metric === 'r2' ? 'R²' : metric.replace('_', ' ')}
                  </TableCell>
                  {experiments.map((exp) => {
                    // Find the best value for this metric across all experiments
                    const metricValues = experiments.map(e => e.metrics[metric as keyof typeof e.metrics] as number | undefined);
                    const bestValue = isRegression 
                      ? (metric === 'r2' ? Math.max(...metricValues.filter(Boolean) as number[]) : Math.min(...metricValues.filter(Boolean) as number[]))
                      : Math.max(...metricValues.filter(Boolean) as number[]);
                    
                    const currentValue = exp.metrics[metric as keyof typeof exp.metrics] as number | undefined;
                    const isBest = currentValue !== undefined && 
                      ((isRegression && metric === 'r2' && currentValue === bestValue) || 
                       (isRegression && metric !== 'r2' && currentValue === bestValue) ||
                       (!isRegression && currentValue === bestValue));
                    
                    return (
                      <TableCell 
                        key={`${exp.experiment_id}-${metric}`}
                        className={isBest ? 'font-bold text-primary' : ''}
                      >
                        {formatMetricValue(currentValue)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      
      <div className="text-sm text-muted-foreground">
        <p>* Best values for each metric are highlighted.</p>
      </div>
    </div>
  );
};

export default ComparisonResultsView;
