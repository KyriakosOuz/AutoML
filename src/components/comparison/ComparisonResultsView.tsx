
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ComparisonMetrics {
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
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

  // Get metric badge color (green >90%, yellow >60%, red <60%)
  const getMetricBadgeVariant = (value: number | undefined) => {
    if (value === undefined || value === null) return "outline";
    if (value >= 0.9) return "default"; // Green
    if (value >= 0.6) return "secondary"; // Yellow - changed from 0.7 to 0.6
    return "destructive"; // Red
  };

  // Find best metric value among experiments
  const findBestMetric = (metricKey: keyof ComparisonMetrics): number | undefined => {
    const values = experiments
      .map(exp => exp.metrics[metricKey])
      .filter((val): val is number => val !== undefined);
      
    if (values.length === 0) return undefined;
    
    // For error metrics like MAE, MSE, RMSE - lower is better
    if (['mae', 'mse', 'rmse'].includes(metricKey)) {
      return Math.min(...values);
    }
    
    // For all other metrics - higher is better
    return Math.max(...values);
  };

  // Check if this is the best value for highlighting
  const isBestMetricValue = (value: number | undefined, metricKey: keyof ComparisonMetrics): boolean => {
    if (value === undefined) return false;
    const bestValue = findBestMetric(metricKey);
    if (bestValue === undefined) return false;
    
    // For error metrics, lowest is best
    if (['mae', 'mse', 'rmse'].includes(metricKey)) {
      return value === bestValue;
    }
    
    // For other metrics, highest is best
    return value === bestValue;
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
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
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
            <TableCell className="font-medium">
              {experiments.some(exp => exp.engine) ? 'Engine/Algorithm' : 'Algorithm'}
            </TableCell>
            {experiments.map(exp => (
              <TableCell key={`${exp.experiment_id}-alg`}>
                {exp.engine || exp.algorithm || 'Unknown'}
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
          <TableRow>
            <TableCell className="font-medium">Created At</TableCell>
            {experiments.map(exp => (
              <TableCell key={`${exp.experiment_id}-created`}>
                {formatDate(exp.created_at)}
              </TableCell>
            ))}
          </TableRow>
          
          {/* Classification Metrics */}
          {isClassification && (
            <>
              <TableRow>
                <TableCell className="font-medium">Accuracy</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.accuracy, 'accuracy');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-acc`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      <Badge variant={getMetricBadgeVariant(exp.metrics.accuracy)}>
                        {formatMetric(exp.metrics.accuracy)}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">F1 Score</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.f1_score, 'f1_score');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-f1`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      <Badge variant={getMetricBadgeVariant(exp.metrics.f1_score)}>
                        {formatMetric(exp.metrics.f1_score)}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Precision</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.precision, 'precision');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-prec`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      <Badge variant={getMetricBadgeVariant(exp.metrics.precision)}>
                        {formatMetric(exp.metrics.precision)}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Recall</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.recall, 'recall');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-recall`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      <Badge variant={getMetricBadgeVariant(exp.metrics.recall)}>
                        {formatMetric(exp.metrics.recall)}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
            </>
          )}
          
          {/* Regression Metrics */}
          {!isClassification && (
            <>
              <TableRow>
                <TableCell className="font-medium">R² Score</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.r2, 'r2');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-r2`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      <Badge variant={getMetricBadgeVariant(exp.metrics.r2)}>
                        {formatMetric(exp.metrics.r2, false)}
                      </Badge>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">MAE</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.mae, 'mae');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-mae`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      {formatMetric(exp.metrics.mae, false)}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">MSE</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.mse, 'mse');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-mse`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      {formatMetric(exp.metrics.mse, false)}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">RMSE</TableCell>
                {experiments.map(exp => {
                  const isBest = isBestMetricValue(exp.metrics.rmse, 'rmse');
                  return (
                    <TableCell 
                      key={`${exp.experiment_id}-rmse`}
                      className={isBest ? 'font-bold border border-green-500 bg-green-50' : ''}
                    >
                      {formatMetric(exp.metrics.rmse, false)}
                    </TableCell>
                  );
                })}
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ComparisonResultsView;
