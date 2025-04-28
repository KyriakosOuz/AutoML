
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ComparisonMetrics {
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  auc?: number;
  r2?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
}

interface ComparisonExperiment {
  experiment_id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm: string;
  engine: string | null;
  metrics: ComparisonMetrics;
  dataset_name: string;
}

interface ComparisonResultsViewProps {
  experiments: ComparisonExperiment[];
}

const ComparisonResultsView: React.FC<ComparisonResultsViewProps> = ({ experiments }) => {
  if (!experiments || experiments.length === 0) {
    return <p>No comparison data available.</p>;
  }

  // Determine task type from the first experiment
  const taskType = experiments[0].task_type;
  const isClassification = taskType.includes('classification');

  // Format metric values
  const formatMetric = (value: number | undefined, isPercentage: boolean = true) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(4);
  };

  // Get metric badge color (green >90%, yellow >70%, red <70%)
  const getMetricBadgeVariant = (value: number | undefined) => {
    if (value === undefined || value === null) return "outline";
    if (value >= 0.9) return "default"; // Green
    if (value >= 0.7) return "secondary"; // Yellow
    return "destructive"; // Red
  };

  // Format task type for display
  const formatTaskType = (taskType: string) => {
    switch (taskType) {
      case 'binary_classification':
        return 'Binary Classification';
      case 'multiclass_classification':
        return 'Multiclass Classification';
      case 'regression':
        return 'Regression';
      default:
        return taskType;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Metric / Field</TableHead>
            {experiments.map(exp => (
              <TableHead key={exp.experiment_id}>
                {exp.experiment_name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Basic Information Rows */}
          <TableRow>
            <TableCell className="font-medium">Task Type</TableCell>
            {experiments.map(exp => (
              <TableCell key={`${exp.experiment_id}-task`}>
                {formatTaskType(exp.task_type)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Algorithm</TableCell>
            {experiments.map(exp => (
              <TableCell key={`${exp.experiment_id}-alg`}>
                {exp.algorithm || exp.engine || 'Unknown'}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Dataset</TableCell>
            {experiments.map(exp => (
              <TableCell key={`${exp.experiment_id}-dataset`}>
                {exp.dataset_name || 'Unknown'}
              </TableCell>
            ))}
          </TableRow>
          
          {/* Classification Metrics */}
          {isClassification && (
            <>
              <TableRow>
                <TableCell className="font-medium">Accuracy</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-acc`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.accuracy)}>
                      {formatMetric(exp.metrics.accuracy)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F1 Score</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-f1`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.f1_score)}>
                      {formatMetric(exp.metrics.f1_score)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Precision</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-prec`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.precision)}>
                      {formatMetric(exp.metrics.precision)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Recall</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-recall`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.recall)}>
                      {formatMetric(exp.metrics.recall)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">AUC</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-auc`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.auc)}>
                      {formatMetric(exp.metrics.auc)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
            </>
          )}
          
          {/* Regression Metrics */}
          {!isClassification && (
            <>
              <TableRow>
                <TableCell className="font-medium">R² Score</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-r2`}>
                    <Badge variant={getMetricBadgeVariant(exp.metrics.r2)}>
                      {formatMetric(exp.metrics.r2, false)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">MAE</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-mae`}>
                    {formatMetric(exp.metrics.mae, false)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">MSE</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-mse`}>
                    {formatMetric(exp.metrics.mse, false)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">RMSE</TableCell>
                {experiments.map(exp => (
                  <TableCell key={`${exp.experiment_id}-rmse`}>
                    {formatMetric(exp.metrics.rmse, false)}
                  </TableCell>
                ))}
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ComparisonResultsView;
